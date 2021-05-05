curl --output ./mc/bedrock-server.zip $(./app/scripts/get_mc_dl_url.sh)
unzip -o ./mc/bedrock-server.zip -d ./mc/bedrock-server/
chmod +x ./mc/bedrock-server/bedrock_server