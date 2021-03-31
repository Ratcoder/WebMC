const Backups = require('../services/backups');

module.exports = {
    path: '/api/backup',
    method: 'POST',
    handler: (request, responce) => {
        Backups.startBackup();
        responce.status(200).text('Backup Started!');
    }
}