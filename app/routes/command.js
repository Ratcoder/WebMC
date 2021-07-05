const Minecraft = require('../services/minecraft');

module.exports = {
    path: '/api/terminal/command',
    method: 'POST',
    handler: (request, response) => {
        Minecraft.process.stdin.write(request.body);
        response.status(200).text('Command run.');
    }
}