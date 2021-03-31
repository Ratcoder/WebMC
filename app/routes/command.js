const Minecraft = require('../services/minecraft');

module.exports = {
    path: '/api/terminal/command',
    method: 'POST',
    handler: (request, responce) => {
        Minecraft.process.stdin.write(request.body);
        responce.status(200).text('Command run.');
    }
}