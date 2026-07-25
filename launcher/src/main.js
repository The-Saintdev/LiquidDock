// LiquidHome — main process.
// A custom home shell (HiOS/XOS-style) for Windows 11.
//
// SAFE DEV MODE: runs as a normal, closable window — it never pins to the
// desktop or covers your screen. Once the design is locked, a later build adds
// an opt-in "desktop takeover" mode (src/win32-desktop.js is kept for that).
//
// Cloudex Labs — MIT.

const { app, BrowserWindow, ipcMain, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');

const isSmoke = process.argv.includes('--smoke');
let homeWin = null;

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
// Optional macOS icon pack: drop PNG/ICO/SVG files into launcher/icons named
// after the app (e.g. "Google Chrome.png"). Matched case/space-insensitively;
// used in place of the extracted Windows icon. Lets any mac icon pack be applied
// without touching code.
const ICON_DIR = path.join(__dirname, '..', 'icons');
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
let iconMap = null;
function buildIconMap() {
  iconMap = new Map();
  try {
    for (const f of fs.readdirSync(ICON_DIR)) {
      const ext = path.extname(f).toLowerCase();
      if (MIME[ext]) iconMap.set(norm(path.basename(f, ext)), path.join(ICON_DIR, f));
    }
  } catch {}
}
function customIcon(name) {
  if (!iconMap) buildIconMap();
  const f = iconMap.get(norm(name));
  if (!f) return '';
  try { return `data:${MIME[path.extname(f).toLowerCase()]};base64,` + fs.readFileSync(f).toString('base64'); }
  catch { return ''; }
}

async function enumerateApps() {
  buildIconMap();
  const lnks = [];
  for (const d of START_DIRS) walk(d, lnks);
  const seen = new Set();
  const apps = [];
  for (const lnk of lnks) {
    const name = path.basename(lnk, path.extname(lnk));
    const key = name.toLowerCase();
    if (seen.has(key) || SKIP.test(name)) continue;
    seen.add(key);
    let icon = customIcon(name);
    if (!icon) { try { icon = (await app.getFileIcon(lnk, { size: 'large' })).toDataURL(); } catch {} }
    apps.push({ name, path: lnk, icon });
  }
  apps.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  return apps;
}

/* ---------------- Window ---------------- */
function createHome() {
  homeWin = new BrowserWindow({
    width: 1280, height: 820, minWidth: 940, minHeight: 640,
    frame: false, backgroundColor: '#0e1018', show: false, title: 'LiquidHome',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  const opts = isSmoke ? { search: 'smoke' } : {};
  homeWin.loadFile(path.join(__dirname, 'home', 'index.html'), opts);
  homeWin.once('ready-to-show', () => { if (!isSmoke) homeWin.show(); });
}

/* ---------------- Lifecycle ---------------- */
const gotLock = isSmoke ? true : app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => { if (homeWin) { homeWin.show(); homeWin.focus(); } });
  app.whenReady().then(() => {
    createHome();
    globalShortcut.register('Control+Alt+Q', () => app.quit());
    globalShortcut.register('Control+Alt+Space', () => { if (homeWin) { homeWin.show(); homeWin.focus(); } });

    if (isSmoke) {
      const resultPath = path.join(__dirname, '..', 'smoke-result.json');
      const logs = [];
      const rec = (tag, parts) => logs.push({ tag, parts });
      homeWin.webContents.on('console-message', (...a) => rec('home', a.map((x) => (x && typeof x === 'object') ? (x.message ?? '[obj]') : x)));
      homeWin.webContents.on('did-fail-load', (_e, c, d) => rec('fail', [c, d]));
      process.on('uncaughtException', (e) => rec('main-uncaught', [String(e && e.stack)]));
      setTimeout(() => { try { fs.writeFileSync(resultPath, JSON.stringify(logs, null, 2)); } catch {} app.quit(); }, 7000);
    }
  });
  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', () => globalShortcut.unregisterAll());
}

/* ---------------- IPC ---------------- */
ipcMain.handle('get-apps', () => enumerateApps());
ipcMain.on('launch', (_e, p) => shell.openPath(p));
ipcMain.on('minimize', () => { if (homeWin) homeWin.minimize(); });
ipcMain.on('quit', () => app.quit());

ipcMain.handle('get-wallpaper', () => {
  try {
    const p = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Themes', 'TranscodedWallpaper');
    return 'data:image/jpeg;base64,' + fs.readFileSync(p).toString('base64');
  } catch { return null; }
});

/* ---- Persisted settings (so nothing needs code edits) ---- */
const CONFIG_DEFAULTS = {
  background: 'designed',        // 'designed' | 'wallpaper'
  iconSize: 44,                  // px — smaller by default
  columns: 7,                    // Launchpad columns
  macTiles: true,               // squircle tiles behind icons
  clock24: false,
  widgets: { weather: true, system: true, calendar: true },
};
function configPath() { return path.join(app.getPath('userData'), 'liquidhome-config.json'); }
function loadConfig() {
  try {
    const c = JSON.parse(fs.readFileSync(configPath(), 'utf8'));
    return { ...CONFIG_DEFAULTS, ...c, widgets: { ...CONFIG_DEFAULTS.widgets, ...(c.widgets || {}) } };
  } catch { return { ...CONFIG_DEFAULTS }; }
}
ipcMain.handle('get-config', () => loadConfig());
ipcMain.handle('set-config', (_e, c) => {
  const merged = { ...loadConfig(), ...c, widgets: { ...loadConfig().widgets, ...(c.widgets || {}) } };
  try { fs.writeFileSync(configPath(), JSON.stringify(merged, null, 2)); } catch {}
  return merged;
});

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
    https.get(url, { headers: { 'User-Agent': 'LiquidHome' } }, (r) => {
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
