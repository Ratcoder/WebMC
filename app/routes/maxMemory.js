const os = require('os');
const max = os.totalmem().toString();

module.exports = {
    path: '/api/max-memory',
    method: 'GET',
    accessLevel: 1,
    handler: (request, response) => {
        response.status(200).text(max);
    }
}