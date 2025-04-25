const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invokeImportKML: () => ipcRenderer.invoke('import-kml'),
  invokeExportSchem: (blockId, exportFileName, useSmoothCurves) => ipcRenderer.invoke('export-schem', blockId, exportFileName, useSmoothCurves),
  onImportSuccess: (callback) => ipcRenderer.on('import-success', (event, fileName) => callback(fileName)),
  onExportSuccess: (callback) => ipcRenderer.on('export-success', callback),
  onConverting: (callback) => ipcRenderer.on('converting', callback)
});
