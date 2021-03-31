const Backups = require('../services/backups');

module.exports = {
    path: '/api/revert',
    method: 'POST',
    handler: (request, responce) => {
        Backups.startRevert(request.body);
        responce.status(200).text('Revert Started!');
    }
}