const Minecraft = require('../services/minecraft');

module.exports = {
    path: '/',
    handler: (request, response) => {
        response.status(200).text(Minecraft.process.pid.toString());
    }
}