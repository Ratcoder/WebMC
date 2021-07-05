const Database = require('../services/database');
const Events = require('../services/events');

const connections = [];
Events.on('players_newPlayer', player => {
    connections.forEach(connection => {
        connection.write(`data: ${JSON.stringify(player)}\n\n`);
    });
});
Events.on('Players_isOnline_changed', async (name, isOnline) => {
    const player = await Database.players.get(name);
    player.isOnline = isOnline;
    connections.forEach(connection => {
        connection.write(`data: ${JSON.stringify(player)}\n\n`);
    });
});

module.exports = {
    path: '/api/player-managment/players',
    method: 'GET',
    accessLevel: 1,
    handler: async (request, response) => {
        connections.push(response.status(200).eventstream());
        response._response.stream.on('end', () => {
            connections.splice(connections.indexOf(response));
        });
        (await Database.players.getAll()).forEach((element) => {
            response.write(`data: ${JSON.stringify(element)}\n\n`);
        });
    }
}