const Database = require('../services/database');

module.exports = {
    path: '/api/deleteAdmin',
    method: 'POST',
    accessLevel: 3,
    handler: async (request, response) => {
        await Database.admins.delete(request.body);
        response.status(200).text('Admin removed.');
    }
}