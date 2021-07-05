const Database = require('../services/database');

module.exports = {
    path: '/api/settings',
    method: 'GET',
    accessLevel: 1,
    handler: async (request, response) => {
        response.status(200).json(await Database.settings.getAll());
    }
}