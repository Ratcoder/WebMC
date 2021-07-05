const Events = require("./events");
const Minecraft = require("./minecraft");
const Database = require('./database');
const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

const connectedBannedPlayersIntervals = new Map();

Events.on('minecraft_logs_playerConnected', async (name, xuid) => {
    let player = await Database.players.get(name);

    if (!player) {
        add(name, await Database.settings.get('defaultPlayerPermissionLevel'));
    }
    else {
        if (!player.xuid) {
            player.xuid = xuid;
            await Database.players.update(name, player);
            await writePermissionsFile();
        }
        if (player.xuid != xuid) {
            connectedBannedPlayersIntervals.set(
                name, 
                setInterval(() => {
                    Minecraft.process.stdin.write(`kick ${name} Your xuid does not match.\n`);
                }, 1000)
            );
        }
        else if (player.ban) {
            connectedBannedPlayersIntervals.set(
                name, 
                setInterval(() => {
                    Minecraft.process.stdin.write(`kick ${name} You have been banned: ${player.ban.reason}\n`);
                }, 1000)
            );
        }
    }

    Events.emit('Players_isOnline_changed', name, true);
});

Events.on('minecraft_logs_playerDisconnected', (name, xuid) => {
    clearInterval(connectedBannedPlayersIntervals.get(name));
    connectedBannedPlayersIntervals.delete(name);
    Events.emit('Players_isOnline_changed', name, false);
});

async function writeWhitelist() {
    const whitelistFile = [];
    const players = await Database.players.getAll();
    players.forEach(el => {
        if(!el.ban){
            whitelistFile.push({
                name: el.name,
                xuid: el.xuid,
                permission: el.permission
            });
        }
    });
    await writeFile('mc/bedrock-server/whitelist.json', JSON.stringify(whitelistFile));
    Minecraft.process.stdin.write('whitelist reload\n');
}
async function writePermissionsFile() {
    const players = await Database.players.getAll();
    const permissionsFile = players.filter(el => el.xuid).map(el => {
        return {
            xuid: el.xuid,
            permission: el.permission
        }
    });
    await writeFile('mc/bedrock-server/permissions.json', JSON.stringify(permissionsFile));
    Minecraft.process.stdin.write('permission reload\n');
}

async function pardon(name) {
    const player = await Database.players.get(name);
    player.ban = false;
    await Database.players.update(name, player);
    await writeWhitelist();
}
async function ban(name, ban) {
    const player = await Database.players.get(name);
    player.ban = ban;
    Database.players.update(name, player);
    Minecraft.process.stdin.write(`kick ${player.name} You have been banned: ${player.ban.reason}\n`);
    await writeWhitelist();
}
async function changePermission(name, permission) {
    const player = await Database.players.get(name);
    player.permission = permission;
    Database.players.update(name, player);

    const players = await Database.players.getAll();
    await writePermissionsFile();
}
async function add(name, permission) {
    const player = await Database.players.insert({name, permission});
    Events.emit('players_newPlayer', player);
    await writeWhitelist();
}

const PlayersService = {
    pardon,
    ban,
    changePermission,
    add
}
module.exports = PlayersService;