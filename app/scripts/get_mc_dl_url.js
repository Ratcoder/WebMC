const fetch = require('node-fetch');
fetch('https://www.minecraft.net/en-us/download/server/bedrock')
    .then(res => res.text())
    .then(text => {
        const url = text.split('https://minecraft.azureedge.net/bin-linux/bedrock-server-')[1].split('.zip')[0];
        console.log(url);
    })