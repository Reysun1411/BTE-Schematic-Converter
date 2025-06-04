import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import {readKML, getBTECoords, createSchematic, exportSchematic} from "./converter.js"

let filePath = null;
let coords = null;
const forbiddenChars = /[\\\/:*?"<>|]/;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 450,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.loadFile('index.html');
  }

app.whenReady().then(createWindow);


// ХЭНДЛЕРЫ
//
// Импорт
ipcMain.handle("import-kml", async (event) => {

  const result = await dialog.showOpenDialog({
    filters: [{ name: 'Geodata Files', extensions: ['kml','geojson']}],
    properties: ['openFile']
  });

  if (result.canceled) {return};
  filePath = result.filePaths[0];

  event.sender.send('reading');
  coords = await readKML(filePath);
  console.log("KML imported");

  const fileName = path.basename(filePath);
  // Оповещение о том что произошел импорт
  event.sender.send('import-success', fileName);
});
//
// Экспорт
ipcMain.handle('export-schem', async (event, blockId, exportFileName, doConnections, useSmoothCurves) => {

    if (coords && filePath) {
      if (!forbiddenChars.test(exportFileName)) {
        
        // Оповещение о начале конвертации
        event.sender.send('converting');
        console.log(`Exporting ${exportFileName} with block ${blockId}, doConnections ${doConnections} and useSmoothCurves ${useSmoothCurves}`);

        // Сам экспорт (поочередный вызов 3 функций)
        try {
          const bteCoords = getBTECoords(coords);
          const schem = createSchematic(bteCoords, blockId, doConnections, useSmoothCurves);
          await exportSchematic(schem, exportFileName, filePath);
        } catch (err) {
          console.error("Ошибка при создании схемы:",err);
          event.sender.send('export-error');
          throw new Error(err.message);
        }
        
        console.log('Successful export')
        
        // Оповещение о том что произошел экспорт
        event.sender.send('export-success')

      } else { 
        console.log('Exception: Forbidden chars in files name')
        await dialog.showMessageBox({
          type: "warning",
          title: "Ошибка",
          message: "Название файла содержит запрещенные символы!",
          detail: 
          "Измените название экспортируемого файла, чтобы оно не содержало запрещенные символы.",
          buttons: ["OK"]
        })}

    } else {
      console.log('Exception: No imported file');
      await dialog.showMessageBox({
        type: "warning",
        title: "Ошибка",
        message: "Нет данных для экспорта!",
        detail: 
        "Импортируйте файл KML, прежде чем экспортировать schem.",
        buttons: ["OK"]
      })}
});

ipcMain.handle('on-converting', async (event) => {
  event.sender.send('import-success', fileName);
})
//
//
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});