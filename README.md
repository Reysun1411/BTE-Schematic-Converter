# KML to BTE Schematic
* У этого приложения всего одна функция - конвертация файлов с расширниями KML (файл Google Earth с географическими данными) и Geojson (JSON-файл географических данных) в Minecraft schematic-файлы в проекции BuildTheEarth. Сделано для TeamCIS.
* This app has only one function - converting KML files (Google Earth files with geographic data) into a Minecraft BuildTheEarth projection schematic file. Made for TeamCIS.
## Поддерживаемые форматы
* В KML и Geojson файлах поддерживаются только геометрические объекты вида LineString (линия), Polygon (полигон) и MultiGeometry (если в нем нет других вложенных мультигеометрий). Другие объекты будут игнорироваться;
* Координаты могут быть как с третьим параметром (высота), так и без него. Если высоты заданы, то программа расположит объекты на соответствующей им высоте в схематике. Если же высот нет, то все линии будут на высоте 0;
* Также поддерживаются KML и Geojson файлы, экспортированные из программы QGis. Чтобы сохранялась высота, изолиниям должно быть задано имя атрибута высоты "ELEV" (имя по умолчанию);
* KMZ - это тот же KML, но запакованный. Если вы хотите сконвертировать KMZ файл, просто поменяйте его расширение на .zip, а затем распакуйте любым архиватором. Либо откройте его в Google Earth Pro, ПКМ -> "Сохранить местоположение как" и при сохранении выберите расширение KML.
## Special thanks
Credits to TerraSketch (https://github.com/Codestian/TerraSketch) for the logic of converting an array of coordinates into a schematic.
Use TerraSketch for outlining in BTE projection!
## Modules used
1. @bte-germany/terraconvert - for converting from latlng to minecraft coordinates
2. prismarine-nbt - for writing NBT data for exporting to .schem format
3. fast-xml-parser - for KML parsing
4. Electron - for writing application