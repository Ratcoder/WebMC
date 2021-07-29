const Minecraft = require('../services/minecraft');

module.exports = {
    path: '/api/status',
    method: 'POST',
    handler: async (request, response) => {
        const body = JSON.parse(request.body);
        if(body.type == 'start'){
            Minecraft.start();
        }
        else if(body.type == 'stop'){
            if(body.delay){
                Minecraft.stopDelayed();
            }
            else{
                Minecraft.stop();
            }
        }
        else if(body.type == 'restart'){
            if(body.delay){
                Minecraft.scheduleOffJob(async () => {}, '');
            }
            else{
                await Minecraft.stop();
                Minecraft.start();
            }
        }
        response.status(200).text('');
    }
}