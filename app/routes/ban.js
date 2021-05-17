const Players = require('../services/players');

module.exports = {
    path: '/api/player-managment/ban',
    method: 'POST',
    accessLevel: 1,
    handler: (request, responce) => {
        const body = JSON.parse(request.body);
        Players.ban(body.name, {
            reason: body.reason,
            until: body.until
        });
        responce.status(200).text('Banned Player');
    }
}