# BTE Schematic Converter
* У этого приложения всего одна функция - конвертация KML и Geojson файлов в Minecraft schematic-файлы, выполненные в проекции BuildTheEarth. Сделано специально для TeamCIS для упрощения создания рельефа, но конвертация геоданных в схематик-файл может пригодиться не только для рельефа.
* This app has only one function - converting KML and Geojson files into a Minecraft BuildTheEarth projection schematic files. Made for TeamCIS to simplify terraforming, but converting geodata to a schematic file can be useful for more than just terrain.
## Поддерживаемые форматы
* Программа поддерживает файлы с расширением ".kml" и ".geojson";
* Выходной файл имеет расширение ".schem" и сохраняется в той же папке, откуда вы импортировали файл;
* Программа должна понимать большинство kml и geojson файлов, генерируемых другими программами, в частности Google Earth Pro и QGis;
* Однако, поддерживаются только геометрические объекты вида LineString (линия) и Polygon (полигон). Другие объекты, такие как MultiPolygon, будут игнорироваться;
* Координаты могут быть как с параметром высоты, так и без него. Если высоты заданы, то программа расположит объекты на соответствующей им высоте в схематике. Если же высот нет, то линии будут на высоте 0.
### Дополнительная информация
* Для файлов изолиний, экспортированных из QGIS, нужно, чтобы аттрибут высоты назывался "ELEV" (это имя по умолчанию);
* KMZ - это тот же KML, но запакованный. Если вы хотите сконвертировать KMZ файл, просто поменяйте его расширение на .zip, а затем распакуйте любым архиватором - в нем будет файл kml. Либо откройте его в Google Earth Pro, ПКМ -> "Сохранить местоположение как" и при сохранении выберите расширение KML.
## Special thanks
Credits to TerraSketch (https://github.com/Codestian/TerraSketch) for the logic of converting an array of coordinates into a schematic.
Use TerraSketch for outlining in BTE projection!
## Modules used
1. @bte-germany/terraconvert - for converting from latlng to minecraft coordinates
2. prismarine-nbt - for writing NBT data for exporting to .schem format
3. fast-xml-parser - for KML parsing
4. Electron - for writing application