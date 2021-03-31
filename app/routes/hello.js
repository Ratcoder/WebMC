const Minecraft = require('../services/minecraft');

module.exports = {
    path: '/',
    handler: (request, responce) => {
        responce.status(200).text(Minecraft.process.pid.toString());
    }
}