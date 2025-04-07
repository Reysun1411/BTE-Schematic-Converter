const { ipcRenderer } = require('electron');
const statusDiv = document.getElementById('status');

ipcRenderer.on("export-success", () => {
  statusDiv.textContent = 'Файл успешно сохранен!'
  statusDiv.style.color = 'green'
})

document.getElementById('importKML').addEventListener('click', () => {
    ipcRenderer.invoke('import-kml');
});

document.getElementById('exportSchem').addEventListener('click', () => {
    ipcRenderer.invoke('export-schem');
});