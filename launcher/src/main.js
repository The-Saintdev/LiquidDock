// LiquidLaunch — main process
// A macOS Launchpad-style overlay for Windows 11. Frameless, acrylic,
// covers the active monitor, enumerates Start Menu apps, launches them.
// Cloudex Labs — MIT.

const { app, BrowserWindow, ipcMain, shell, globalShortcut, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');

let win = null;

// Where Windows keeps app shortcuts (all-users + current-user Start Menu).
const START_DIRS = [
  path.join(process.env.ProgramData || 'C:\\ProgramData', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
];

// Noise we don't want as "apps".
const SKIP = /uninstall|read ?me|help online|documentation|user guide|website|home ?page|release notes|licen[cs]e|what's new/i;

function walk(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.isFile() && e.name.toLowerCase().endsWith('.lnk')) out.push(full);
  }
}

async function enumerateApps() {
  const lnks = [];
  for (const d of START_DIRS) walk(d, lnks);

  const seen = new Set();
  const apps = [];
  for (const lnk of lnks) {
    const name = path.basename(lnk, path.extname(lnk));
    const key = name.toLowerCase();
    if (seen.has(key) || SKIP.test(name)) continue;
    seen.add(key);
    let icon = '';
    try {
      // Electron extracts the real shell icon straight from the .lnk.
      icon = (await app.getFileIcon(lnk, { size: 'large' })).toDataURL();
    } catch { /* leave icon blank; renderer shows a fallback */ }
    apps.push({ name, path: lnk, icon });
  }
  apps.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  return apps;
}

function targetDisplay() {
  // Open on whichever monitor the mouse is on (nice on dual-monitor).
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
}

function createWindow() {
  const b = targetDisplay().bounds;
  win = new BrowserWindow({
    x: b.x, y: b.y, width: b.width, height: b.height,
    frame: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    show: false,
    transparent: false,
    backgroundColor: '#00000000',
    backgroundMaterial: 'acrylic', // real Windows 11 glass behind the overlay
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function showLauncher() {
  if (!win || win.isDestroyed()) createWindow();
  const b = targetDisplay().bounds;
  win.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height });
  win.show();
  win.focus();
  win.webContents.send('reset');
}

function hideLauncher() {
  if (win && !win.isDestroyed()) win.hide();
}

function toggle() {
  if (win && win.isVisible()) hideLauncher();
  else showLauncher();
}

const isSmoke = process.argv.includes('--smoke');
// Smoke tests must never early-quit on the single-instance lock.
const gotLock = isSmoke ? true : app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  // Re-running the exe (or the single-instance relaunch) just shows the overlay.
  app.on('second-instance', showLauncher);

  app.whenReady().then(() => {
    const smoke = isSmoke;
    createWindow();
    // Global hotkey to summon the launcher from anywhere.
    globalShortcut.register('Control+Alt+Space', toggle);
    globalShortcut.register('Control+Alt+Q', () => app.quit());

    if (smoke) {
      // Headless self-test: boot window + renderer + icon pipeline + widgets,
      // never show, and write findings to a file (GUI-subsystem stdout is
      // unreliable on Windows).
      const resultPath = path.join(__dirname, '..', 'smoke-result.json');
      const logs = [];
      const rec = (tag, parts) => logs.push({ tag, parts });
      win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { search: 'smoke' });
      win.webContents.on('console-message', (...args) => {
        rec('console', args.map((x) => (x && typeof x === 'object') ? (x.message ?? '[obj]') : x));
      });
      win.webContents.on('preload-error', (_e, p, err) => rec('preload-error', [p, String(err)]));
      win.webContents.on('did-fail-load', (_e, code, desc) => rec('did-fail-load', [code, desc]));
      process.on('uncaughtException', (e) => rec('main-uncaught', [String(e && e.stack)]));
      setTimeout(() => {
        try { fs.writeFileSync(resultPath, JSON.stringify(logs, null, 2)); } catch {}
        app.quit();
      }, 7000);
      return;
    }
    showLauncher();
  });

  app.on('window-all-closed', () => { /* stay resident in the background */ });
  app.on('will-quit', () => globalShortcut.unregisterAll());
}

ipcMain.handle('get-apps', () => enumerateApps());
ipcMain.on('launch', (_e, p) => { shell.openPath(p); hideLauncher(); });
ipcMain.on('hide', hideLauncher);
ipcMain.on('quit', () => app.quit());

// ---------- Widgets: system stats + weather ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cpuSample() {
  let idle = 0, total = 0;
  for (const c of os.cpus()) {
    for (const t in c.times) total += c.times[t];
    idle += c.times.idle;
  }
  return { idle, total };
}
async function cpuUsage() {
  const a = cpuSample();
  await sleep(200);
  const b = cpuSample();
  const idle = b.idle - a.idle;
  const total = b.total - a.total;
  return total > 0 ? 1 - idle / total : 0;
}

ipcMain.handle('get-system', async () => ({
  cpu: await cpuUsage(),
  memUsed: os.totalmem() - os.freemem(),
  memTotal: os.totalmem(),
  host: os.hostname(),
}));

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'LiquidLaunch' } }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

let weatherCache = null;
let weatherAt = 0;
ipcMain.handle('get-weather', async () => {
  if (weatherCache && Date.now() - weatherAt < 10 * 60 * 1000) return weatherCache;
  try {
    // IP-based location (only the request itself; no stored data) then open-meteo.
    const loc = await getJSON('https://ipapi.co/json/');
    const w = await getJSON(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code`
    );
    weatherCache = {
      temp: Math.round(w.current.temperature_2m),
      code: w.current.weather_code,
      city: loc.city || '',
    };
    weatherAt = Date.now();
    return weatherCache;
  } catch {
    return null;
  }
});
