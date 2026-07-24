// LiquidLaunch — main process.
// Two layers:
//   1. Board  — widgets pinned to the desktop wallpaper (behind windows).
//   2. Launcher — the Launchpad app grid, summoned from the top-left hot corner.
// LiquidDock (the taskbar) is untouched. Cloudex Labs — MIT.

const { app, BrowserWindow, ipcMain, shell, globalShortcut, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const desktop = require('./win32-desktop.js');

const isSmoke = process.argv.includes('--smoke');
let launchWin = null;
let boardWin = null;

/* ---------------- App enumeration ---------------- */
const START_DIRS = [
  path.join(process.env.ProgramData || 'C:\\ProgramData', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
];
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
    try { icon = (await app.getFileIcon(lnk, { size: 'large' })).toDataURL(); } catch {}
    apps.push({ name, path: lnk, icon });
  }
  apps.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  return apps;
}

/* ---------------- Windows ---------------- */
function targetDisplay() {
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
}

function createLauncher() {
  const b = targetDisplay().bounds;
  launchWin = new BrowserWindow({
    x: b.x, y: b.y, width: b.width, height: b.height,
    frame: false, resizable: false, movable: false, skipTaskbar: true,
    show: false, transparent: false, backgroundColor: '#00000000',
    backgroundMaterial: 'acrylic', alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  launchWin.setAlwaysOnTop(true, 'screen-saver');
  const opts = isSmoke ? { search: 'smoke' } : {};
  launchWin.loadFile(path.join(__dirname, 'renderer', 'index.html'), opts);
}

function showLauncher() {
  if (!launchWin || launchWin.isDestroyed()) createLauncher();
  const b = targetDisplay().bounds;
  launchWin.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height });
  launchWin.show();
  launchWin.focus();
  launchWin.webContents.send('reset');
}
function hideLauncher() { if (launchWin && !launchWin.isDestroyed()) launchWin.hide(); }
function toggleLauncher() { (launchWin && launchWin.isVisible()) ? hideLauncher() : showLauncher(); }

function createBoard() {
  const b = screen.getPrimaryDisplay().bounds;
  boardWin = new BrowserWindow({
    x: b.x, y: b.y, width: b.width, height: b.height,
    frame: false, transparent: true, resizable: false, movable: false,
    skipTaskbar: true, focusable: false, show: false, hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  boardWin.setIgnoreMouseEvents(true, { forward: true }); // click-through to desktop
  boardWin.loadFile(path.join(__dirname, 'board', 'index.html'));
  boardWin.once('ready-to-show', () => {
    boardWin.showInactive();
    if (isSmoke) return;
    try {
      const hwnd = boardWin.getNativeWindowHandle().readBigUInt64LE();
      const r = desktop.pinToDesktop(hwnd);
      console.log('[board] pin:', JSON.stringify(r));
    } catch (e) { console.log('[board] pin failed:', e); }
  });
}

/* ---------------- Hot corner (top-left) ---------------- */
let cornerArmed = true;
function pollCorner() {
  if (!launchWin) return;
  const p = screen.getCursorScreenPoint();
  const d = screen.getDisplayNearestPoint(p).bounds;
  const inCorner = p.x <= d.x + 2 && p.y <= d.y + 2;
  if (inCorner && cornerArmed && !launchWin.isVisible()) { cornerArmed = false; showLauncher(); }
  else if (!inCorner && (p.x > d.x + 140 || p.y > d.y + 140)) cornerArmed = true;
}

/* ---------------- Lifecycle ---------------- */
const gotLock = isSmoke ? true : app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', showLauncher);
  app.whenReady().then(() => {
    createBoard();
    createLauncher();
    globalShortcut.register('Control+Alt+Space', toggleLauncher);
    globalShortcut.register('Control+Alt+Q', () => app.quit());

    if (isSmoke) {
      const resultPath = path.join(__dirname, '..', 'smoke-result.json');
      const logs = [];
      const rec = (tag, parts) => logs.push({ tag, parts });
      launchWin.webContents.on('console-message', (...a) => rec('launcher', a.map((x) => (x && typeof x === 'object') ? (x.message ?? '[obj]') : x)));
      boardWin.webContents.on('console-message', (...a) => rec('board', a.map((x) => (x && typeof x === 'object') ? (x.message ?? '[obj]') : x)));
      launchWin.webContents.on('did-fail-load', (_e, c, d) => rec('launcher-fail', [c, d]));
      boardWin.webContents.on('did-fail-load', (_e, c, d) => rec('board-fail', [c, d]));
      process.on('uncaughtException', (e) => rec('main-uncaught', [String(e && e.stack)]));
      rec('probe', [JSON.stringify(desktop.probe())]);
      setTimeout(() => { try { fs.writeFileSync(resultPath, JSON.stringify(logs, null, 2)); } catch {} app.quit(); }, 7000);
      return;
    }

    setInterval(pollCorner, 120);
  });
  app.on('window-all-closed', () => { /* stay resident */ });
  app.on('will-quit', () => globalShortcut.unregisterAll());
}

/* ---------------- IPC ---------------- */
ipcMain.handle('get-apps', () => enumerateApps());
ipcMain.on('launch', (_e, p) => { shell.openPath(p); hideLauncher(); });
ipcMain.on('hide', hideLauncher);
ipcMain.on('quit', () => app.quit());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function cpuSample() {
  let idle = 0, total = 0;
  for (const c of os.cpus()) { for (const t in c.times) total += c.times[t]; idle += c.times.idle; }
  return { idle, total };
}
async function cpuUsage() {
  const a = cpuSample(); await sleep(200); const b = cpuSample();
  const idle = b.idle - a.idle, total = b.total - a.total;
  return total > 0 ? 1 - idle / total : 0;
}
ipcMain.handle('get-system', async () => ({
  cpu: await cpuUsage(), memUsed: os.totalmem() - os.freemem(), memTotal: os.totalmem(), host: os.hostname(),
}));

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'LiquidLaunch' } }, (r) => {
      let d = ''; r.on('data', (c) => (d += c));
      r.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}
let weatherCache = null, weatherAt = 0;
ipcMain.handle('get-weather', async () => {
  if (weatherCache && Date.now() - weatherAt < 10 * 60 * 1000) return weatherCache;
  try {
    const loc = await getJSON('https://ipapi.co/json/');
    const w = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code`);
    weatherCache = { temp: Math.round(w.current.temperature_2m), code: w.current.weather_code, city: loc.city || '' };
    weatherAt = Date.now();
    return weatherCache;
  } catch { return null; }
});
