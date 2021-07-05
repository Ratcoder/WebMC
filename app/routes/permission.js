const Players = require('../services/players');

module.exports = {
    path: '/api/player-managment/permission',
    method: 'POST',
    accessLevel: 1,
    handler: (request, response) => {
        const player = JSON.parse(request.body);
        Players.changePermission(player.name, player.permission);
        response.status(200).text('Permissions changed');
    }
}