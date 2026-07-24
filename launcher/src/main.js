// LiquidLaunch — main process
// A macOS Launchpad-style overlay for Windows 11. Frameless, acrylic,
// covers the active monitor, enumerates Start Menu apps, launches them.
// Cloudex Labs — MIT.

const { app, BrowserWindow, ipcMain, shell, globalShortcut, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  // Re-running the exe (or the single-instance relaunch) just shows the overlay.
  app.on('second-instance', showLauncher);

  app.whenReady().then(() => {
    const smoke = process.argv.includes('--smoke');
    createWindow();
    // Global hotkey to summon the launcher from anywhere.
    globalShortcut.register('Control+Alt+Space', toggle);
    globalShortcut.register('Control+Alt+Q', () => app.quit());

    if (smoke) {
      // Headless self-test: boot window + renderer + icon pipeline, never show.
      win.webContents.on('console-message', (_e, _l, m) => console.log('RENDERER:', m));
      win.webContents.on('preload-error', (_e, _p, err) => console.log('PRELOAD ERROR:', err));
      win.webContents.on('did-fail-load', (_e, code, desc) => console.log('LOAD FAIL:', code, desc));
      setTimeout(() => { console.log('SMOKE DONE'); app.quit(); }, 7000);
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
