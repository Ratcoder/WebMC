const os = require('os');
const max = os.totalmem().toString();

module.exports = {
    path: '/api/max-memory',
    method: 'GET',
    handler: (request, responce) => {
        responce.status(200).text(max);
    }
}