(curl --silent https://www.minecraft.net/en-us/download/server/bedrock)|cut -d':' -f 2| while read line ; do
    if [[ "$line" == *"//minecraft.azureedge.net/bin-linux/bedrock-server-"* ]]; then
        echo https:$line|cut -d'"' -f 1
    fi
done