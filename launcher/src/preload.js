// LiquidHome — preload bridge (context-isolated, no Node in the renderer).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('liquid', {
  getApps: () => ipcRenderer.invoke('get-apps'),
  launch: (p) => ipcRenderer.send('launch', p),
  getSystem: () => ipcRenderer.invoke('get-system'),
  getWeather: () => ipcRenderer.invoke('get-weather'),
  getWallpaper: () => ipcRenderer.invoke('get-wallpaper'),
  minimize: () => ipcRenderer.send('minimize'),
  quit: () => ipcRenderer.send('quit'),
});
