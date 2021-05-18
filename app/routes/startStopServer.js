const Minecraft = require('../services/minecraft');

module.exports = {
    path: '/api/status',
    method: 'POST',
    handler: async (request, responce) => {
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
                Minecraft.sceduleOffJob(async () => {}, '');
            }
            else{
                await Minecraft.stop();
                Minecraft.start();
            }
        }
        responce.status(200).text('');
    }
}