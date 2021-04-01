const Database = require('../services/database');

module.exports = {
    path: '/api/admins',
    method: 'POST',
    accessLevel: 3,
    handler: async (request, responce) => {
        const json = await JSON.parse(request.body);
        await Database.admins.insert(json);
        responce.status(200).text('Admin added.')
    }
}