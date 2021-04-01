const Database = require('../services/database');
const Events = require('../services/events');

const connections = [];
Events.on('players_newPlayer', player => {
    connections.forEach(connection => {
        connection.write(`data: ${JSON.stringify(player)}\n\n`);
    });
});

module.exports = {
    path: '/api/player-managment/players',
    method: 'GET',
    accessLevel: 1,
    handler: async (request, responce) => {
        connections.push(responce.status(200).eventstream());
        (await Database.players.getAll()).forEach((element) => {
            responce.write(`data: ${JSON.stringify(element)}\n\n`);
        });
    }
}