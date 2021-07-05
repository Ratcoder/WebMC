const Players = require('../services/players');

module.exports = {
    path: '/api/player-managment/pardon',
    method: 'POST',
    accessLevel: 1,
    handler: (request, response) => {
        const body = JSON.parse(request.body);
        Players.pardon(body.name);
        response.status(200).text('Banned Player');
    }
}