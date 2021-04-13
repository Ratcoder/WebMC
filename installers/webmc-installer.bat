curl --output ./nodetemp.zip https://nodejs.org/dist/v14.16.1/node-v14.16.1-win-x64.zip
powershell.exe -NoP -NonI -Command "Expand-Archive -Force './nodetemp.zip' './nodetemp/'"
move ".\nodetemp\node-v14.16.1-win-x64" ".\node"
rmdir nodetemp
del nodetemp.zip