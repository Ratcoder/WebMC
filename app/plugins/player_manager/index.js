const fs = require('fs');
const path = require('path');

module.exports = class PlayerManager{
    connectedBannedPlayersIntervals = new Map();
    players = new Map();
    defaultPermission = 'member';
    hasChangesToSave = false;
    isSaving = false;

    constructor(settings, referances){
        this.referances = referances;
        const playersPath = path.join(__dirname, '../../../settings/players.json');
        if(!fs.existsSync(playersPath)){
            fs.writeFileSync('settings/players.json', '[]');
        }
        require(playersPath).forEach(player => {
            this.players.set(player.name, player);
        });

        referances.mcEvents.on('playerConnected', (name, xuid) => {
            let playerInList = false;

            let player = this.players.get(name);
            if(!player){
                this.players.set(name, {name, xuid, permission: this.defaultPermission});
            }
            else if(player.ban){
                this.connectedBannedPlayersIntervals.set(name, 
                    setInterval(() => {
                        referances.mcServer.stdin.write(`kick ${name} You have been banned until ${element.ban.until}: ${element.ban.reason}\n`);
                }, 1000));

            }
        });

        referances.mcEvents.on('playerDisconnected', (name, xuid) => {
            this.connectedBannedPlayersIntervals.delete(name);
        });
    }

    tryToSave(){
        this.save();
        return;
        if(this.isSaving){
            this.hasChangesToSave = true;
        }
        else{
            this.hasChangesToSave = false;
            this.save();
        }
    }
    save(){
        this.isSaving = true;
        try{
            fs.writeFile('settings/players.json', JSON.stringify(Array.from(this.players.values())), () => {
                this.isSaving = false;
            });
        }
        catch(err){
            console.log(err);
        }
        try{
            let permissions = [];
            Array.from(this.players.values()).forEach((element) => {
                permissions.push({xuid: element.xuid, permission: element.permission})
            });
            fs.writeFile('mc/bedrock-server/permissions.json', JSON.stringify(permissions), () => {
                this.referances.mcServer.stdin.write(`permission reload\n`);
            });
        }
        catch(err){
            console.log(err);
        }
    }

    playerConnections = []

    http = {
        prefix: 'player-managment',
        get: {
            'players': (req, res, body) => {
                res.stream.respond({
                    'content-type': 'text/event-stream',
                    'cache-controll': 'no-cache',
                    ':status': 200
                });
                this.players.forEach((element) => {
                    res.stream.write(`data: ${JSON.stringify(element)}\n\n`);
                });

                let connectionId = this.playerConnections.push(res.stream) - 1;
                res.stream.on('end', () => {
                    this.playerConnections.splice[connectionId];
                });
            }
        },
        post: {
            'permission': (req, res, body) => {
                const permission = JSON.parse(body);

                let player = this.players.get(permission.name);
                player.permission = permission.permission;
                this.playerConnections.forEach(element => {
                    element.write(`data: ${JSON.stringify(player)}\n\n`);
                });

                this.tryToSave();

                res.stream.respond({
                    'content-type': 'text/plain; charset=utf-8',
                    ':status': 200
                });
                res.end(`Player is now a ${permission.permission}.`);
            },
            'ban': (req, res, body) => {
                const ban = JSON.parse(body);
                let player = this.players.get(ban.name);
                player.ban = {until: ban.until, reason: ban.reason};
                this.referances.mcServer.stdin.write(`kick ${ban.name} You have been banned until ${ban.until}: ${ban.reason}\n`);
                this.playerConnections.forEach(element => {
                    element.write(`data: ${JSON.stringify(player)}\n\n`);
                });

                this.tryToSave();

                res.stream.respond({
                    'content-type': 'text/plain; charset=utf-8',
                    ':status': 200
                });
                res.end('Player pardoned.');
            },
            'pardon': (req, res, body) => {
                const pardon = JSON.parse(body);
                let player = this.players.get(pardon.name);
                player.ban = false;

                this.playerConnections.forEach(element => {
                    element.write(`data: ${JSON.stringify(player)}\n\n`);
                });
                this.tryToSave();

                res.stream.respond({
                    'content-type': 'text/plain; charset=utf-8',
                    ':status': 200
                });
                res.end('Player pardoned.');
            }
        }
    }
}