import { XMLParser } from "fast-xml-parser";

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
            (d) => d['@_name'] === 'ELEV'
        )?.['#text'];

        let geometries = [];

        // 1. Если есть LineString напрямую
        if (placemark.LineString) {
            geometries.push({ type: 'LineString', data: placemark.LineString });
        }

        // 2. Если есть Polygon напрямую
        if (placemark.Polygon) {
            geometries.push({ type: 'Polygon', data: placemark.Polygon });
        }

        // 3. Если есть MultiGeometry
        if (placemark.MultiGeometry) {
            const multi = placemark.MultiGeometry;
        
            if (multi.LineString) {
                const lines = Array.isArray(multi.LineString) ? multi.LineString : [multi.LineString];
                geometries.push(...lines.map(line => ({ type: 'LineString', data: line })));
            }

            if (multi.Polygon) {
                const polys = Array.isArray(multi.Polygon) ? multi.Polygon : [multi.Polygon];
                geometries.push(...polys.map(poly => ({ type: 'Polygon', data: poly })));
            }
        }

        // Обрабатываем каждый или один геометрический объект
        for (const {type, data} of geometries) {
            let geometriesCoords = []

            if (type === 'LineString') {
                const lsCoords = data.coordinates
                if (lsCoords) { geometriesCoords.push(lsCoords.trim()) };

            } if (type == 'Polygon') {
                const polyCoords = data.outerBoundaryIs.LinearRing.coordinates;
                if (polyCoords) { geometriesCoords.push(polyCoords.trim()) };
                
                const inners = data.innerBoundaryIs;
                if (inners) {
                    const innerArray = Array.isArray(inners) ? inners : [inners];
                    for (const inner of innerArray) {
                        const innerCoords = inner.LinearRing?.coordinates;
                        if (innerCoords) { geometriesCoords.push(innerCoords.trim()) };
                    }
                }
            }
            if (!geometriesCoords) continue;

            for (let i = 0; i < geometriesCoords.length; i++) {
                const points = geometriesCoords[i]
                .split(/\s+/)                              // Разделение точек по пробелам и переносам строки
                .map(line => line.split(',').map(Number))  // Разделение широты, долготы (и если есть - высоты) по запятой
            
                const elevation = defineElevation(elevationData, points[0], contours)

                const linePoints = removeThirdParameter(points);      // Оставляем в списке координат точек линии все кроме высоты
                contours[elevation].push(linePoints);                 // Пушим значение в словарь
            }
            
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
        if (featureType == 'Polygon') {
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