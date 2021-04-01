const Players = require('../services/players');

module.exports = {
    path: '/api/player-managment/permission',
    method: 'POST',
    accessLevel: 1,
    handler: (request, responce) => {
        const player = JSON.parse(request.body);
        Players.changePermission(player.xuid, player.permission);
        responce.status(200).text('Permissions changed');
    }
}