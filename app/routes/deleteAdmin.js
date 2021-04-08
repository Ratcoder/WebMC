const Database = require('../services/database');

module.exports = {
    path: '/api/deleteAdmin',
    method: 'POST',
    accessLevel: 3,
    handler: async (request, responce) => {
        await Database.admins.delete(request.body);
        responce.status(200).text('Admin removed.');
    }
}