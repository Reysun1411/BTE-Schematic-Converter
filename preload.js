const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invokeImportKML: () => ipcRenderer.invoke('import-kml'),
  invokeExportSchem: (blockId, exportFileName, doConnections, useSmoothCurves) => ipcRenderer.invoke('export-schem', blockId, exportFileName, doConnections, useSmoothCurves),
  onImportSuccess: (callback) => ipcRenderer.on('import-success', (event, fileName) => callback(fileName)),
  onExportSuccess: (callback) => ipcRenderer.on('export-success', (event, originPoint) => callback(originPoint)),
  onConverting: (callback) => ipcRenderer.on('converting', callback),
  onReading: (callback) => ipcRenderer.on('reading', callback),
  onExportError: (callback) => ipcRenderer.on('export-error', callback)
});
