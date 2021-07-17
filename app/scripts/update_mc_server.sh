curl --output ./mc/bedrock-server.zip "https://minecraft.azureedge.net/bin-linux/bedrock-server-$(curl --silent https://webmc.ratcoder.com/minecraft_version.txt).zip"
rm -r mc/bedrock-server/
mkdir mc/bedrock-server/
unzip -o ./mc/bedrock-server.zip -d ./mc/bedrock-server/
chmod +x ./mc/bedrock-server/bedrock_server
mkdir ./mc/bedrock-server/worlds