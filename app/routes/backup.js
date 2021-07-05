const Backups = require('../services/backups');

module.exports = {
    path: '/api/backup',
    method: 'POST',
    handler: (request, response) => {
        Backups.startBackup();
        response.status(200).text('Backup Started!');
    }
}