# KML to BTE Schematic
У этого приложения одна функция - конвертация KML-файлов (файлов Google Earth с географическими данными) в Minecraft schematic-файл. Схематик создается в проекции BuildTheEarth.
Сделано для TeamCIS.
This application has one function - converting KML files (Google Earth files with geographic data) into a Minecraft schematic file. The schematic is created in the BuildTheEarth projection.
Made for TeamCIS.
## Special thanks
Credits to TerraSketch (https://github.com/Codestian/TerraSketch) for the logic of converting an array of coordinates into a schematic.
Use TerraSketch for outlining in BTE projection!
## Modules used
1. @bte-germany/terraconvert - for converting from latlng to minecraft coordinates
2. prismarine-nbt - for writing NBT data for exporting to .schem format
3. Electron - for writing desktop application