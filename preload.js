const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invokeImportKML: () => ipcRenderer.invoke('import-kml'),
  invokeExportSchem: (blockId, exportFileName) => ipcRenderer.invoke('export-schem', blockId, exportFileName),
  onExportSuccess: (callback) => ipcRenderer.on('export-success', callback),
});
