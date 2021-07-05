const Database = require('../services/database');

module.exports = {
    path: '/api/admins',
    method: 'GET',
    accessLevel: 1,
    handler: async (request, response) => {
        const adminsUnfiltered = await Database.admins.getAll();
        const admins = [];
        adminsUnfiltered.forEach(element => {
            admins.push({name: element.name, level: element.level, isYou: request.token.name == element.name})
        });
        response.status(200).json(admins);
    }
}