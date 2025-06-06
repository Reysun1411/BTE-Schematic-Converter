const statusDiv = document.getElementById('status');
const originDiv = document.getElementById('originpoint')
const importKml = document.getElementById('importKML');
const exportSchem = document.getElementById('exportSchem');
const blockIdInput = document.getElementById('blockId');
const exportFileNameInput = document.getElementById('exportFileName');
const doConnectionsInput = document.getElementById('doConnections');
const useSmoothCurvesInput = document.getElementById("useSmoothCurves");

// Обработка кнопки импорта
importKml.addEventListener('click', () => {
  console.log('Import KML');
  window.electron.invokeImportKML();
});

// Обработка кнопки экспорта
exportSchem.addEventListener('click', () => {
  console.log('Export schem');
  const blockId = blockIdInput.value; // Значение diamond_block
  const exportFileName = exportFileNameInput.value; // Значение converted
  const doConnections = doConnectionsInput.checked;
  const useSmoothCurves = useSmoothCurvesInput.checked;
  try {
    window.electron.invokeExportSchem(blockId, exportFileName, doConnections, useSmoothCurves);
  } catch (err) {
    alert("Ошибка экспорта схемы:\n" + err.message);
  }
});

// Оповещение об успешном импорте
window.electron.onImportSuccess((fileName) => {
  statusDiv.textContent = `Файл загружен: ${fileName}`;
  statusDiv.style.color = 'lightBlue';
});

// Оповещение о процессе конвертации
window.electron.onConverting(() => {
  statusDiv.textContent = 'Идет конвертация...'
  statusDiv.style.color = 'wheat'
})

// Оповещение об успешном экспорте
window.electron.onExportSuccess((originPoint) => {
  statusDiv.textContent = 'Файл успешно сохранен!';
  originDiv.textContent = 'Исходная точка схематики: '+originPoint;
  statusDiv.style.color = 'MediumSeaGreen';
})

// Оповещение о чтении файла
window.electron.onReading(() => {
  statusDiv.textContent = 'Чтение файла...'
  statusDiv.style.color = 'wheat'
})

// Оповещение об ошибке при чтении файла
window.electron.onExportError(() => {
  statusDiv.textContent = 'Ошибка. Возможно, файл слишком большой'
  statusDiv.style.color = 'salmon'
})
