const Database = require('../services/database');

module.exports = {
    path: '/api/admins',
    method: 'GET',
    accessLevel: 1,
    handler: async (request, responce) => {
        const adminsUnfiltered = await Database.admins.getAll();
        const admins = [];
        adminsUnfiltered.forEach(element => {
            admins.push({name: element.name, level: element.level, isYou: request.token.name == element.name})
        });
        responce.status(200).json(admins);
    }
}