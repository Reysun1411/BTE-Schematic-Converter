import { fromGeo } from "@bte-germany/terraconvert";
import fs from 'fs/promises';
import { writeUncompressed, TagType } from "prismarine-nbt";
import { XMLParser } from "fast-xml-parser";
import zlib from "zlib";
import path from "path";
import { KMLParse, GeojsonParse } from "./geoparser.js";

// Чтение и парсинг файла KML
/* Вид возвращаемого словаря (ключ - высота, значение - массив линий):
  {1: [ 
        [ [lon,lat], [lon,lat], [lon,lat]... ]
        [ [lon,lat], [lon,lat], [lon,lat]... ]
        ...
      ]
   2: ...
  }
*/
export async function readKML(filepath) {
    // Чтение всего файла в data
    const data = await fs.readFile(filepath, "utf-8");

    const ext = path.extname(filepath).toLowerCase();
    console.log(ext)
    if (ext == '.kml') {
      return KMLParse(data)
    }
    else if (ext == '.geojson') {
      return GeojsonParse(data)
    }
    else {
      return NaN
    }
}

// Преобразование координат в проекцию BTE и округление
export function getBTECoords(contours) {
    const btecoords = {};
    let mcheight;

    for (const [elev, lines] of Object.entries(contours)) {

      mcheight = elev - 1 
      // Контур в майне будет на 1 уровень ниже,
      // чтобы в F3 отображалась нужная высота, когда стоишь на нем

      lines.forEach(line => {
          const convertedLine = []

          line.forEach(coord => {
              convertedLine.push(
                fromGeo(coord[1],coord[0]) // Конвертация координат в проекцию BTE
                .map(n => Math.floor(n))   // Округление вниз до целого числа
              )
          })
          
          // Добавляем сконвертированное в словарь btecoords
          if (!btecoords[mcheight]) {btecoords[mcheight] = []};
          btecoords[mcheight].push(convertedLine)
      })

    }
    return btecoords
}


// Создание схематики
export function createSchematic(btecoords, blockId, doConnections, useSmoothCurves) {
    const MAX_ALLOWED_SIZE = 500_000_000;

    // Получаем все координаты
    const allCoords = Object.entries(btecoords).flatMap(([elev, lines]) =>
      lines.flatMap(line => line.map(([x, z]) => [x, z, Number(elev)]))
    );

    const xCoords = allCoords.map(([x]) => x);
    const zCoords = allCoords.map(([_, z]) => z);
    const yCoords = allCoords.map(([_, __, y]) => y);

    // Границы схемы
    const minX = xCoords.reduce((min, val) => Math.min(min, val), Infinity);
    const maxX = xCoords.reduce((max, val) => Math.max(max, val), -Infinity);
    const minZ = zCoords.reduce((min, val) => Math.min(min, val), Infinity);
    const maxZ = zCoords.reduce((max, val) => Math.max(max, val), -Infinity);
    const minY = yCoords.reduce((min, val) => Math.min(min, val), Infinity);
    const maxY = yCoords.reduce((max, val) => Math.max(max, val), -Infinity);

    // Размеры схемы
    const length = maxX - minX + 1;
    const width = maxZ - minZ + 1;
    const height = maxY - minY + 1;

    const totalSize = width * height * length;
    if (totalSize > MAX_ALLOWED_SIZE) {
      throw new Error("Размер схемы слишком большой для обработки.");
    }

    const blockData = new Uint8Array(totalSize);

    const fullBlockId = "minecraft:" + blockId;
    const palette = {
      "minecraft:air": { type: TagType.Int, value: 0 },
      [fullBlockId]: { type: TagType.Int, value: 1 }
    };

    // Обработка каждой высоты
    Object.entries(btecoords).forEach(([elevStr, lines]) => {
      const y = Number(elevStr) - minY;

      lines.forEach(line => {
        const flat2D = line.map(([x, z]) => [x - minX, z - minZ]);
        let segmentPoints;
        
        // Соединения точек включены
        if (doConnections) {
          // Соединение точек со скруглением (тест)
          if (useSmoothCurves) {
            segmentPoints = catmullRomSpline(flat2D);
          // Прямое соединение точек
          } else {
            segmentPoints = [];
            for (let i = 0; i < flat2D.length - 1; i++) {
              segmentPoints.push(...bresenham2D(...flat2D[i], ...flat2D[i + 1]));
            }
          }
        }
        // Соединения точек выключены
        else {
          segmentPoints = [];
          for (let i = 0; i < flat2D.length-1; i++) {
            segmentPoints.push(flat2D[i])
          }
        }

        segmentPoints.forEach(([x, z]) => {
          if (x < 0 || z < 0 || y < 0 || x >= length || z >= width || y >= height) return;
          const index = y * width * length + z * length + x;
          blockData[index] = 1;
        });

      });
    });

    const originPoint = [Math.ceil(minX), Math.ceil(minY), Math.ceil(minZ)]

    // Создание схематика
    const schematic = {
      type: TagType.Compound,
      name: "Schematic",
      author: "KMLtoBTESchematic",
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
          value: originPoint,
        },
      },
    };

    const nbtBuffer = writeUncompressed(schematic);
    const compressed = zlib.gzipSync(nbtBuffer);
    
    return [compressed, originPoint];
}


// Сохранение файла
export function exportSchematic(schem, fileName, savePath) {
    const fullFileName = fileName + '.schem'
    const outputPath = path.join(path.dirname(savePath), fullFileName);
    fs.writeFile(outputPath, schem).then(() => {
        console.log("Export path: ",outputPath);
    })
}

// Интерполяция Catmull-Rom
function catmullRomSpline(points, segments = 30) {
  const result = [];
  // Добавляем первый и последний точки для правильной интерполяции
  const extended = [
      points[0],
      ...points,
      points[points.length - 1]
  ];

  for (let i = 0; i < points.length - 1; i++) {
      const p0 = extended[i];
      const p1 = extended[i + 1];
      const p2 = extended[i + 2];
      const p3 = extended[i + 3];

      for (let t = 0; t < segments; t++) {
          const s = t / segments;
          const x = catmullRom(p0[0], p1[0], p2[0], p3[0], s);
          const z = catmullRom(p0[1], p1[1], p2[1], p3[1], s);
          result.push([Math.round(x), Math.round(z)]);
      }
  }

  return deduplicate(result);
}


// Возвращает точку на кривой между p1 и p2
// t - положение точки (0.0 - 1.0)
function catmullRom(p0, p1, p2, p3, t) {
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2*p0 - 5*p1 + 4*p2 - p3) * t * t +
    (-p0 + 3*p1 - 3*p2 + p3) * t * t * t
);
}


function deduplicate(points) {
  const seen = new Set();
  return points.filter(([x, z]) => {
      const key = `${x},${z}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
  });
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
