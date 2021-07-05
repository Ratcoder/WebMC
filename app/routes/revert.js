const Backups = require('../services/backups');

module.exports = {
    path: '/api/revert',
    method: 'POST',
    handler: (request, response) => {
        Backups.startRevert(request.body);
        response.status(200).text('Revert Started!');
    }
}