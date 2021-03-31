const Backups = require('../services/backups');

module.exports = {
    path: '/api/backups',
    method: 'GET',
    handler: (request, responce) => {
        responce.status(200).json(Backups.backups);
    }
}