import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import {readKML, getBTECoords, createSchematic} from "./converter.js"

let kmlPath = null;
let coords = null;
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
ipcMain.handle("import-kml", async (event, optionalPath) => {

  // Если нажата кнопка импорта
  console.log('optionalpath:', optionalPath);
  if (!optionalPath) {

    const result = await dialog.showOpenDialog({
      filters: [{ name: 'KML Files', extensions: ['kml']}],
      properties: ['openFile']
    });

    if (result.canceled) {return};
    kmlPath = result.filePaths[0];
  
  // Если использован drag-n-drop
  } else {
    kmlPath = optionalPath;
  }

  coords = await readKML(kmlPath);
  console.log("Координаты импортированы");
});

// Экспорт
ipcMain.handle('export-schem', async (event, blockId) => {
    if (coords && kmlPath) {
      const bteCoords = getBTECoords(coords);
      await createSchematic(bteCoords, kmlPath, blockId);
      BrowserWindow.getAllWindows()[0].webContents.send('export-success');
    } 
    else {
      console.log('Нет данных для экспорта!');

      await dialog.showMessageBox({
        type: "warning",
        title: "Ошибка",
        message: "Нет данных для экспорта!",
        detail: "Импортируйте файл KML, прежде чем экспортировать schem.",
        buttons: ["OK"]
      })

    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});