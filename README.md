# KML to BTE Schematic
* У этого приложения всего одна функция - конвертация KML-файлов (файлов Google Earth с географическими данными) в Minecraft schematic-файлы в проекции BuildTheEarth. Сделано для TeamCIS.
* This app has only one function - converting KML files (Google Earth files with geographic data) into a Minecraft BuildTheEarth projection schematic file. Made for TeamCIS.
## Special thanks
Credits to TerraSketch (https://github.com/Codestian/TerraSketch) for the logic of converting an array of coordinates into a schematic.
Use TerraSketch for outlining in BTE projection!
## Modules used
1. @bte-germany/terraconvert - for converting from latlng to minecraft coordinates
2. prismarine-nbt - for writing NBT data for exporting to .schem format
3. fast-xml-parser - for KML parsing
4. Electron - for writing application