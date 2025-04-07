import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import {readKML, getBTECoords, createSchematic, exportSchematic} from "./converter.js"

let kmlPath = null;
let coords = null;
const forbiddenChars = /[\\\/:*?"<>|]/;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 350,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, // позволяет использовать Node.js в renderer.js
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
  }

app.whenReady().then(createWindow);

//
// ХЭНДЛЕРЫ
//
// Импорт
ipcMain.handle("import-kml", async (event) => {

  const result = await dialog.showOpenDialog({
    filters: [{ name: 'KML Files', extensions: ['kml']}],
    properties: ['openFile']
  });

  if (result.canceled) {return};
  kmlPath = result.filePaths[0];

  coords = await readKML(kmlPath);
  console.log("KML imported");
});

// Экспорт
ipcMain.handle('export-schem', async (event, blockId, exportFileName) => {

    if (coords && kmlPath) {
      if (!forbiddenChars.test(exportFileName)) {

        const bteCoords = getBTECoords(coords);
        const schem = createSchematic(bteCoords, blockId);
        await exportSchematic(schem, exportFileName, kmlPath);
        console.log('Successful export')
        BrowserWindow.getAllWindows()[0].webContents.send('export-success')

      } else {
        console.log('Forbidden chars in files name')
        await dialog.showMessageBox({
          type: "warning",
          title: "Ошибка",
          message: "Название файла содержит запрещенные символы!",
          detail: 
          "Измените название экспортируемого файла, чтобы оно не содержало запрещенные символы.",
          buttons: ["OK"]
        })}

    } else {
      console.log('No imported file');
      await dialog.showMessageBox({
        type: "warning",
        title: "Ошибка",
        message: "Нет данных для экспорта!",
        detail: 
        "Импортируйте файл KML, прежде чем экспортировать schem.",
        buttons: ["OK"]
      })}
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});