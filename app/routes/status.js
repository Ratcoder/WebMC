const Events = require('../services/events');

const connections = [];

let currentRestart;
setInterval(() => {
    if(currentRestart) currentRestart.time--;
}, 1000);
Events.on('minecraft_restarting', data => {
    currentRestart = data;
    connections.forEach(connection => {
        connection.write(`data: ${JSON.stringify({type: 'restart', time: data.time, reason: data.reason})}\n\n`);
    });
});
Events.on('minecraft_logs_started', () => {
    currentRestart = null;
    connections.forEach(connection => {
        connection.write(`data: ${JSON.stringify({type: 'started'})}\n\n`);
    });
});

module.exports = {
    path: '/api/status',
    method: 'GET',
    accessLevel: 1,
    handler: async (request, responce) => {
        connections.push(responce.status(200).eventstream());
        responce._responce.stream.on('end', () => {
            connections.splice(connections.indexOf(responce));
        });
        if(currentRestart) responce.write(`data: ${JSON.stringify({type: 'restart', time: currentRestart.time, reason: currentRestart.reason})}\n\n`)
    }
}