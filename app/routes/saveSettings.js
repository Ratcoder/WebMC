const Database = require('../services/database');

module.exports = {
    path: '/api/settings',
    method: 'POST',
    handler: async (request, response) => {
        const settings = JSON.parse(request.body);
        Database.settings.bulkSet(settings);
        response.status(200).text('Settings Saved!');
    }
}