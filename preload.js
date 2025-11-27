const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendHyperDeckCommand: (ip, command) => 
    ipcRenderer.invoke('hyperdeck-command', { ip, command }),
  
  onExternalCommand: (callback) => 
    ipcRenderer.on('external-command', (event, data) => callback(data))
});
