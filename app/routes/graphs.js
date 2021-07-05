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
    accessLevel: 1,
    handler: async (request, response) => {
        connections.push(response.status(200).eventstream());
        Graphs.cpu.forEach(data => {
            response.write(`data: cpu ${JSON.stringify(data)}\n\n`);
        });
        Graphs.ram.forEach(data => {
            response.write(`data: ram ${JSON.stringify(data)}\n\n`);
        });
        Graphs.players.forEach(data => {
            response.write(`data: players ${JSON.stringify(data)}\n\n`);
        });
        response._response.stream.on('end', () => {
            connections.splice(connections.indexOf(response));
        });
    }
}