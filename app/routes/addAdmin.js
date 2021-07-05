const Database = require('../services/database');
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = {
    path: '/api/admins',
    method: 'POST',
    accessLevel: 3,
    handler: async (request, response) => {
        const json = await JSON.parse(request.body);
        bcrypt.hash(json.password, saltRounds, async (err, hash) => {
            json.password = hash;
            await Database.admins.insert(json);
            response.status(200).text('Admin added.')
        });
    }
}