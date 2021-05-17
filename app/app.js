const fs = require('fs');

console.log('Welcome to WebMC!\nWebMC is running at this url: https://localhost:14142');
if(process.argv[2] != 'dev') console.log = () => {};

require('./server');
fs.readdirSync('./app/services').forEach(file => require('./services/' + file));