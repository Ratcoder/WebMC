const Events = require("./events");
const Minecraft = require("./minecraft");
const Database = require('./database');

const connectedBannedPlayersIntervals = new Map();

Events.on('minecraft_logs_playerConnected', async (name, xuid) => {
    let player = await Database.players.get(xuid);

    if(!player){
        await Database.players.insert({name, xuid, permission: 'member'});
        Events.emit('players_newPlayer', {name, xuid, permission: 'member'});
    }
    else if(player.ban){
        connectedBannedPlayersIntervals.set(name, 
            setInterval(() => {
                Minecraft.process.stdin.write(`kick ${name} You have been banned.\n`);
        }, 1000));
    }
});

Events.on('minecraft_logs_playerDisconnected', (name, xuid) => {
    clearInterval(connectedBannedPlayersIntervals.get(name));
    connectedBannedPlayersIntervals.delete(name);
});

async function pardon(xuid){
    const player = await Database.players.get(xuid);
    player.ban = false;
    await Database.players.update(xuid, player);
}
async function ban(xuid, ban){
    const player = await Database.players.get(xuid);
    player.ban = ban;
    Database.players.update(xuid, player);
}
async function changePermission(xuid, permission){
    const player = await Database.players.get(xuid);
    player.permission = permission;
    Database.players.update(xuid, player);
}

const PlayersService = {
    pardon,
    ban,
    changePermission
}
module.exports = PlayersService;