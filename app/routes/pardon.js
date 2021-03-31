const Players = require('../services/players');

module.exports = {
    path: '/api/player-managment/pardon',
    method: 'POST',
    handler: (request, responce) => {
        const body = JSON.parse(request.body);
        Players.pardon(body.xuid);
        responce.status(200).text('Banned Player');
    }
}