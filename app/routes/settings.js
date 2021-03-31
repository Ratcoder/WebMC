const Database = require('../services/database');

module.exports = {
    path: '/api/settings',
    method: 'GET',
    handler: async (request, responce) => {
        responce.status(200).json(await Database.settings.getAll());
    }
}