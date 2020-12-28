for /f "delims=" %%A in ('node ./app/scripts/get_mc_dl_url.js') do set "var=%%A"
curl --output ./mc/bedrock-server.zip https://minecraft.azureedge.net/bin-win/bedrock-server-%var%.zip
powershell.exe -NoP -NonI -Command "Expand-Archive -Force './mc/bedrock-server.zip' './mc/bedrock-server/'"