import { XMLParser } from "fast-xml-parser";

const GEOJSON_POLYGON_TYPES = new Set(['Polygon','MultiLineString'])

// KML
export async function KMLParse(data) {
    // Создание парсера
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
    });
    const file = parser.parse(data); // парсим

    let placemarks = [];
    const doc = file.kml.Document;

    // Если в документе несколько Placemark, то placemarks уже будет массивом:
    if (Array.isArray(doc.Placemark)) {
        placemarks = doc.Placemark;
    } else if (doc.Folder && Array.isArray(doc.Folder.Placemark)) {
        placemarks = doc.Folder.Placemark;

    // Если в документа один Placemark, то надо сделать placemarks массивом:
    } else if (doc.Folder && doc.Folder.Placemark) {
        placemarks = [doc.Folder.Placemark];
    } else if (doc.Placemark) {
        placemarks = [doc.Placemark];
    }

    const contours = {};

    // Обрабатываем каждый или один Placemark
    for (const placemark of placemarks) {

        // Получение высоты в ExtendedData (для kml созданных в qgis)
        const elevationData = placemark.ExtendedData?.SchemaData?.SimpleData?.find(
            (d) => d["@_name"] === "ELEV"
        )?.["#text"];

        // Ищем местоположение LineString, в котором хранятся координаты
        let lineStrings = [];

        // Он может быть просто в Placemark (тогда он всего 1)
        if (placemark.LineString) { lineStrings = [placemark.LineString]; }
        // Или внутри MultiGeometry (тогда их может быть несколько)
        else if (placemark.MultiGeometry?.LineString) {
            const multi = placemark.MultiGeometry.LineString;
            lineStrings = Array.isArray(multi) ? multi : [multi];
        }

        // Обрабатываем каждый или один lineStrings
        for (const line of lineStrings) {
        
            // Получаем coordinates
            const coords = line.coordinates?.trim();
            if (!coords) continue;

            const points = coords
                .split(/\s+/)                              // Разделение точек по пробелам и переносам строки
                .map(line => line.split(',').map(Number))  // Разделение широты, долготы (и если есть - высоты) по запятой
                .filter(arr => arr.length >= 2);           // Только 2 и больше элемента в массиве
            
            const elevation = defineElevation(elevationData, points[0], contours)

            const linePoints = removeThirdParameter(points);      // Оставляем в списке координат точек линии все кроме высоты
            contours[elevation].push(linePoints);                 // Пушим значение в словарь
        }
    }
    
    return contours;
}

// Geojson
export async function GeojsonParse(data) {

    const file = JSON.parse(data);
    const contours = {};
    const features = file.features;

    // Обрабатываем каждую фигуру в features
    for (const feature of features) {

        const featureCoordinates = feature.geometry.coordinates;
        if (!featureCoordinates) continue;

        let firstPoint = featureCoordinates[0];
        let isPoly = false;
        const featureType = feature.geometry.type;
        if (GEOJSON_POLYGON_TYPES.has(featureType)) {
            isPoly = true;
            firstPoint = featureCoordinates[0][0]
        }

        // Получение высоты в properties (для geojson созданных в qgis)
        const elevationData = feature.properties.ELEV;
        const elevation = defineElevation(elevationData, firstPoint, contours)

        // ПОЛИГОН
        if (isPoly) {
            const lines = featureCoordinates.map(      // Оставляем в списке координат точек линии всё кроме высоты
                line => removeThirdParameter(line));

            for (let i = 0; i < lines.length; i++) {
                contours[elevation].push(lines[i])     // Перебираем каждый полигон и пушим его в словарь
            }
        }

        // ЛИНИЯ
        else {
            const line = removeThirdParameter(featureCoordinates);
            contours[elevation].push(line);
        }
    }
    return contours
}

export function defineElevation(elevationData, firstPoint, contours) {
    const elevation = elevationData !== undefined
            ? Number(elevationData)               // Если был найден ELEV, то преобразуем его в число
            : (Math.round(firstPoint[2] ?? 0));   // если нет ELEV — берем высоту из третьего числа координат
    if (!contours[elevation]) {contours[elevation] = []}; // Заодно создаем ключ высоты в contours, если такой высоты еще нет
    return elevation
}

// Функция, оставляющая только широту и долготу и убирающая третий параметр (высоту), если он есть
export function removeThirdParameter(linePoints) {
    return linePoints.map(p => [p[0], p[1]])  
}