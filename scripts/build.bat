rmdir /s /q build
mkdir build
@REM App
xcopy app build\app\ /E
call npm i
xcopy node_modules build\node_modules\ /E
xcopy README.md build\
xcopy package.json build\
xcopy LICENCE build\
xcopy start_webmc.bat build\
@REM Website
cd svelte
call npm run build
cd ..
xcopy svelte\public build\public\ /E
@REM Node.js
curl --output ./build/nodetemp.zip https://nodejs.org/dist/v14.16.1/node-v14.16.1-win-x64.zip
powershell.exe -NoP -NonI -Command "Expand-Archive -Force './build/nodetemp.zip' './build/nodetemp/'"
move ".\build\nodetemp\node-v14.16.1-win-x64" ".\build\node"
rmdir build\nodetemp
del build\nodetemp.zip
powershell.exe -NoP -NonI -Command "Compress-Archive -Force './build/*' './build/dist.zip'"