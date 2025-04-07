import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import {readKML, getBTECoords, createSchematic} from "./converter.js"

let kmlPath = null;
let coords = null;

function createWindow() {
    const win = new BrowserWindow({
      width: 400,
      height: 300,
      webPreferences: {
        nodeIntegration: true, // позволяет использовать Node.js в renderer.js
        contextIsolation: false,
      }
    });

    win.loadFile('index.html');
  }

app.whenReady().then(createWindow);

// ОБРАБОТЧИКИ

ipcMain.handle("import-kml", async () => {
    const result = await dialog.showOpenDialog({
        filters: [{ name: 'KML Files', extensions: ['kml']}],
        properties: ['openFile']
    });

    if (!result.canceled) {
        kmlPath = result.filePaths[0];
        coords = await readKML(kmlPath)
        console.log('Координаты импортированы: ',coords)
    }
});

ipcMain.handle('export-schem', async () => {
    if (coords && kmlPath) {
      const bteCoords = getBTECoords(coords);
      await createSchematic(bteCoords, kmlPath);
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