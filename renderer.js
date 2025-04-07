const statusDiv = document.getElementById('status');
const importKml = document.getElementById('importKML');
const exportSchem = document.getElementById('exportSchem');
const blockIdInput = document.getElementById('blockId');

// Обработка кнопки импорта
importKml.addEventListener('click', () => {
  console.log('Import KML');
  window.electron.invokeImportKML();
});

// Обработка кнопки экспорта
exportSchem.addEventListener('click', () => {
  console.log('Export schem');
  const blockId = blockIdInput.value; // Значение diamond_block
  console.log('1: ',blockId)
  window.electron.invokeExportSchem(blockId);
});

// Оповещение об успешном экспорте
window.electron.onExportSuccess(() => {
  statusDiv.textContent = 'Файл успешно сохранен!';
  statusDiv.style.color = 'green';
});
