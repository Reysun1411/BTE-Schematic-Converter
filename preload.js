const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invokeImportKML: (filePath) => ipcRenderer.invoke('import-kml'),
  invokeExportSchem: (blockId) => ipcRenderer.invoke('export-schem', blockId),
  onExportSuccess: (callback) => ipcRenderer.on('export-success', callback),
});
