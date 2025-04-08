//  Thanks to Codestian for implementing 
//  saving an array of coordinates to a schematic file
//  in his TerraSketch project.
//  https://github.com/Codestian/TerraSketch

import { fromGeo } from "@bte-germany/terraconvert";
import fs from 'fs/promises';
import { writeUncompressed, TagType } from "prismarine-nbt";
import zlib from "zlib";
import path from "path";

// Чтение файла KML
export async function readKML(filepath) {
    const data = await fs.readFile(filepath, "utf-8");

    const coordsMatches = data.match(/<coordinates>([\s\S]*?)<\/coordinates>/g);
    // Отбрасываем ненужное с помощью регулярного выражения
    const contours = coordsMatches.map(match => {
        return match
          .replace(/<\/?coordinates>/g, '')            // Убираем <coordinates>
          .trim()                                      // убираем пробелы
          .split(/\s+/)                                // разделяем точки друг от друга по переносу строки
          .map(line => line.split(',').map(Number));   // разделяем широту, долготу и высоту по запятой
      });
    
    return contours;
}

// Преобразование координат в проекцию BTE и округление
export function getBTECoords(contours) {
    const btecoords = [];

    contours.forEach(line => {
        const btecoord = [];
        line.forEach(coords => {

            const elevation = coords[2] - 1  // Высота (отнимается 1 для майнкрафта)
            const xzConverted = 
                fromGeo(coords[1],coords[0]) // Конвертация координат в проекцию BTE
                .map(n => Math.floor(n)) // Округление вниз до целого числа
            
            // Добавление массива с координатами точки в массив линии
            btecoord.push([...xzConverted, elevation]); 
        });
        // Добавление массива с координатами линии в массив всех линий
        btecoords.push(btecoord);
    });
    return btecoords
}

// Создание схематики
export function createSchematic(btecoords, blockId) {
    // Получаем координаты
    const xCoords = btecoords.flatMap(bteline => bteline.map(coord => coord[0]));
    const zCoords = btecoords.flatMap(bteline => bteline.map(coord => coord[1]));
    const yCoords = btecoords.flatMap(bteline => bteline.map(coord => coord[2]));
  
    // Границы схемы
    const minX = Math.min(...xCoords), maxX = Math.max(...xCoords);
    const minZ = Math.min(...zCoords), maxZ = Math.max(...zCoords);
    const minY = Math.min(...yCoords), maxY = Math.max(...yCoords);
  
    // Размеры схемы
    const length = maxX - minX + 1;
    const width = maxZ - minZ + 1;
    const height = maxY - minY + 1;
  
    const totalSize = width * height * length;
  
    // Создаем одномерный массив
    const blockData = new Uint8Array(totalSize); // 1 байт на блок
  
    // Палитра блоков
    const fullBlockId = "minecraft:" + blockId;
    const palette = {
      "minecraft:air": { type: TagType.Int, value: 0 },
      [fullBlockId]: { type: TagType.Int, value: 1 }
    };
  
    // Преобразуем координаты относительно минимума
    const transformedCoords = btecoords.map(bteline =>
      bteline.map(coord => [
        coord[0] - minX,
        coord[1] - minZ,
        coord[2] - minY
      ])
    );
  
    // Заполняем массив блоков
    transformedCoords.forEach(line => {
      const y = line[0][2];
  
      for (let i = 0; i < line.length - 1; i++) {
        const [x1, z1] = [line[i][0], line[i][1]];
        const [x2, z2] = [line[i + 1][0], line[i + 1][1]];
  
        const segmentPoints = bresenham2D(x1, z1, x2, z2);
  
        segmentPoints.forEach(([x, z]) => {
          const index = y * width * length + z * length + x;
          blockData[index] = 1;
        });
      }
    });
  
    // Сборка схемы
    const schematic = {
      type: TagType.Compound,
      name: "Schematic",
      value: {
        DataVersion: { type: TagType.Int, value: 3700 },
        Version: { type: TagType.Int, value: 2 },
        Width: { type: TagType.Short, value: length },
        Height: { type: TagType.Short, value: height },
        Length: { type: TagType.Short, value: width },
        PaletteMax: { type: TagType.Int, value: 2 },
        Palette: { type: TagType.Compound, value: palette },
        BlockData: { type: TagType.ByteArray, value: blockData },
        BlockEntities: {
          type: TagType.List,
          value: { type: TagType.Compound, value: [] },
        },
        Entities: {
          type: TagType.List,
          value: { type: TagType.Compound, value: [] },
        },
        Metadata: { type: TagType.Compound, value: {} },
        Offset: {
          type: TagType.IntArray,
          value: [Math.ceil(minX), Math.ceil(minY), Math.ceil(minZ)],
        },
      },
    };
  
    const nbtBuffer = writeUncompressed(schematic);
    const compressed = zlib.gzipSync(nbtBuffer);
  
    return compressed;
}

// Сохранение файла
export function exportSchematic(schem, fileName, savePath) {
    const fullFileName = fileName + '.schem'
    const outputPath = path.join(path.dirname(savePath), fullFileName);
    fs.writeFile(outputPath, schem).then(() => {
        console.log("Export path: ",outputPath);
    })
}

// Алгоритм Брезенхама
// Возвращает массив точек, образующих прямой отрезок между 2 точками
function bresenham2D(x1,z1,x2,z2) {

    const points = [];

    let x = x1;
    let z = z1;

    const dx = Math.abs(x2 - x1);
    const dz = Math.abs(z2 - z1);

    const sx = x1 < x2 ? 1 : -1;
    const sz = z1 < z2 ? 1 : -1;

    let err = dx - dz;

    while (true) {
        points.push([x, z]);

        if (x === x2 && z === z2) break;

        const e2 = 2 * err;

        if (e2 > -dz) {
            err -= dz;
            x += sx;
        }

        if (e2 < dx) {
            err += dx;
            z += sz;
        }
    }

    return points;
}
