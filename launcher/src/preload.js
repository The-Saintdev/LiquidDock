// LiquidLaunch — preload bridge (context-isolated, no Node in the renderer).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('liquid', {
  getApps: () => ipcRenderer.invoke('get-apps'),
  launch: (p) => ipcRenderer.send('launch', p),
  hide: () => ipcRenderer.send('hide'),
  quit: () => ipcRenderer.send('quit'),
  getSystem: () => ipcRenderer.invoke('get-system'),
  getWeather: () => ipcRenderer.invoke('get-weather'),
  onReset: (cb) => ipcRenderer.on('reset', () => cb()),
});
