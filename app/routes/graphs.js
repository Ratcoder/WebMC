const Graphs = require('../services/graphs');
const Events = require('../services/events');

const connections = [];
Events.on('graph_data_ram', data => {
    connections.forEach(connection => {
        connection.write(`data: ram ${JSON.stringify(data)}\n\n`);
    });
});
Events.on('graph_data_cpu', data => {
    connections.forEach(connection => {
        connection.write(`data: cpu ${JSON.stringify(data)}\n\n`);
    });
});
Events.on('graph_data_players', data => {
    connections.forEach(connection => {
        connection.write(`data: players ${JSON.stringify(data)}\n\n`);
    });
});

module.exports = {
    path: '/api/graphs',
    method: 'GET',
    handler: async (request, responce) => {
        connections.push(responce.status(200).eventstream());
        Graphs.cpu.forEach(data => {
            responce.write(`data: cpu ${JSON.stringify(data)}\n\n`);
        });
        Graphs.ram.forEach(data => {
            responce.write(`data: ram ${JSON.stringify(data)}\n\n`);
        });
        Graphs.players.forEach(data => {
            responce.write(`data: players ${JSON.stringify(data)}\n\n`);
        });
    }
}