const Players = require('../services/players');

module.exports = {
    path: '/api/player-managment/add',
    method: 'POST',
    accessLevel: 1,
    handler: (request, response) => {
        const body = JSON.parse(request.body);
        Players.add(body.name, body.permission);
    }
}