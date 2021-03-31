const Database = require('../services/database');
const Events = require('../services/events');

let logStore = "";

const connections = [];
Events.on('minecraft_logs', log => {
    logStore += 'data: ' + log + '\n\n';
    connections.forEach(connection => {
        connection.write(`data: ${log}\n\n`);
    });
});

module.exports = {
    path: '/api/terminal/logs',
    method: 'GET',
    handler: async (request, responce) => {
        const newConnection = responce.status(200).eventstream();
        newConnection.write(logStore);
        connections.push(newConnection);
    }
}