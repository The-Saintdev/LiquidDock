// LiquidHome — preload bridge (context-isolated, no Node in the renderer).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('liquid', {
  // true while running as a normal dev window; false once it's the desktop shell.
  dev: !process.argv.includes('--shell'),
  getApps: () => ipcRenderer.invoke('get-apps'),
  launch: (p) => ipcRenderer.send('launch', p),
  getSystem: () => ipcRenderer.invoke('get-system'),
  getWeather: () => ipcRenderer.invoke('get-weather'),
  getWallpaper: () => ipcRenderer.invoke('get-wallpaper'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (c) => ipcRenderer.invoke('set-config', c),
  pickImage: () => ipcRenderer.invoke('pick-image'),
  minimize: () => ipcRenderer.send('minimize'),
  quit: () => ipcRenderer.send('quit'),
  desktopAction: (a) => ipcRenderer.send('desktop-action', a),
  getBoot: () => ipcRenderer.invoke('get-boot'),
  setBoot: (on) => ipcRenderer.invoke('set-boot', on),
});
