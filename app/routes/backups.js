const Backups = require('../services/backups');

module.exports = {
    path: '/api/backups',
    method: 'GET',
    accessLevel: 1,
    handler: (request, responce) => {
        responce.status(200).json(Backups.backups);
    }
}