const fs = require('fs');

require('./server');
fs.readdirSync('./app/services').forEach(file => require('./services/' + file));