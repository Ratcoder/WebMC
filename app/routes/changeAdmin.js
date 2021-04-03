const Database = require('../services/database');
const bcrypt = require('bcrypt');
const util = require('util');
const saltRounds = 10;
const hash = util.promisify(bcrypt.hash);

module.exports = {
    path: '/api/changeAdmin',
    method: 'POST',
    accessLevel: 1,
    handler: async (request, responce) => {
        const json = await JSON.parse(request.body);
        let player = await Database.admins.get(json.name);
        if(json.password){
            if(request.token.level != 3 && request.token.name != json.name){
                responce.status(403).text('Forbidden.')
                return;
            }
            player.password = await hash(json.password, saltRounds);
            responce.setHeader('Set-Cookie', [`jwt=; Secure; HttpOnly`])
        }
        if(json.level){
            if(request.token.level != 3){
                responce.status(403).text('Forbidden.')
                return;
            }
            player.level = json.level;
        }
        await Database.admins.update(json.name, player);
        responce.status(200).text('Admin changed.')
    }
}