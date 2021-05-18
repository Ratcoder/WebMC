const Events = require('../services/events');

const connections = [];

let currentRestart;
let currentStop;
setInterval(() => {
    if(currentRestart) currentRestart.time--;
    if(currentStop) currentStop.time--;
}, 1000);
Events.on('minecraft_restarting', data => {
    currentRestart = data;
    connections.forEach(connection => {
        connection.write(`data: ${JSON.stringify({type: 'restart', time: data.time, reason: data.reason})}\n\n`);
    });
});
Events.on('minecraft_stopping', data => {
    currentStop = data;
    connections.forEach(connection => {
        connection.write(`data: ${JSON.stringify({type: 'stop', time: data.time})}\n\n`)
    });
});
Events.on('minecraft_logs_started', () => {
    currentRestart = null;
    connections.forEach(connection => {
        connection.write(`data: ${JSON.stringify({type: 'started'})}\n\n`);
    });
});
let status;
Events.on('minecraft_status', (newStatus) => {
    status = newStatus;
    connections.forEach(connection => {
        connection.write(`data: ${JSON.stringify({type: 'status', status})}\n\n`);
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
        if(currentStop) responce.write(`data: ${JSON.stringify({type: 'stop', time: currentStop.time})}\n\n`)
        responce.write(`data: ${JSON.stringify({type: 'status', status})}\n\n`);
    }
}