const fetch = require('node-fetch');
fetch('https://webmc.ratcoder.com/bin/minecraft_version.txt')
    .then(res => res.text())
    .then(text => console.log(text))