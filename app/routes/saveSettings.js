const Database = require('../services/database');

module.exports = {
    path: '/api/settings',
    method: 'POST',
    handler: async (request, responce) => {
        const settings = JSON.parse(request.body);
        Database.settings.bulkSet(settings);
        responce.status(200).text('Settings Saved!');
    }
}