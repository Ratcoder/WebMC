const Minecraft = require('./minecraft');

const os = require('os');
const Datastore = require('nedb');
const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

const playerDatabase = new Datastore({ filename: 'db/players', autoload: true });

const players = {
    get(xuid){
        return new Promise((resolve, reject) => {
            playerDatabase.findOne({_id: xuid}, (err, doc) => {
                resolve(doc);
            });
        });
    },
    insert(player){
        return new Promise((resolve, reject) => {
            player._id = player.xuid;
            playerDatabase.insert(player, (err, newDoc) => {
                resolve(newDoc);
            });
        });
    },
    update(xuid, player){
        return new Promise((resolve, reject) => {
            playerDatabase.update({ _id: xuid }, player, {}, function (err, numReplaced) {
                resolve(numReplaced);
            });
        });
    },
    getAll(){
        return new Promise((resolve, reject) => {
            playerDatabase.find({}, (err, docs) => {
                resolve(docs || []);
            });
        });
    }
}

if(!fs.existsSync('db/settings.json')){
    fs.writeFileSync('db/settings.json', '{}');
}
const settingsJSON = JSON.parse(fs.readFileSync('db/settings.json'));
const defaultSettings = require('../defaultSettings');
const gameRules = [
    'commandBlocksEnabled',
    'commandBlocksEnabled',
    'commandBlockOutput',
    'doDaylightCycle',
    'doEntityDrops',
    'doFireTick',
    'doInsomnia',
    'doImmediateRespawn',
    'doMobLoot',
    'doMobSpawning',
    'doTileDrops',
    'doWeatherCycle',
    'drowningDamage',
    'fallDamage',
    'fireDamage',
    'keepInventory',
    'maxCommandChainLength',
    'mobGriefing',
    'naturalRegeneration',
    'pvp',
    'randomTickSpeed',
    'sendCommandFeedback',
    'showCoordinates',
    'showDeathMessages',
    'spawnRadius',
    'tntExplodes',
    'showTags'
]
const serverProperties = {
    defaultGamemode: 'gamemode',
    forceGamemode: 'force-gamemode',
    difficulty: 'difficulty',
    serverName: 'server-name',
    maxPlayers: 'max-players',
    serverPort: 'server-port',
    serverPortv6: 'server-portv6',
    levelType: 'level-type',
    levelSeed: 'level-seed',
    onlineMode: 'online-mode',
    whitelist: 'white-list',
    cheats: 'allow-cheats',
    maxViewDistance: 'view-distance',
    playerIdleTimeout: 'player-idle-timeout',
    maxThreads: 'max-threads',
    simulationDistance: 'tick-distance',
    defaultPlayerPermissionLevel: 'default-player-permission-level',
    texturepackRequired: 'texturepack-required',
    contentLogFileEnabled: 'content-log-file-enabled',
    compressionThreshold: 'compression-threshold',
    serverAuthoritativeMovement: 'server-authoritative-movement',
    playerMovementScoreTheshold: 'player-movement-score-threshold',
    playerMovementDistanceTheshold: 'player-movement-distance-threshold',
    playerMovementDurationTheshold: 'player-movement-duration-threshold-in-ms',
    correctPlayerMovement: 'correct-player-movement'
}
const settings = {
    get(key){
        return settingsJSON[key];
    },
    async set(key, value){
        settingsJSON[key] = value;

        if(gameRules.find((el) => el == element[0])){
            Minecraft.process.stdin.write(`gamerule ${key} ${value}`)
        }
        await writeFile('db/settings.json', JSON.stringify(settingsJSON));
        if(serverProperties[element[0]]){
            Minecraft.sceduleOffJob(writeServerProperties, 'updating settings');
        }
        return value;
    },
    getAll(){
        let result = [];
        for (const key in settingsJSON) {
            if (Object.hasOwnProperty.call(settingsJSON, key)) {
                const value = settingsJSON[key];
                result.push({key, value});
            }
        }
        return result;
    },
    async bulkSet(sets){
        let serverPropertiesNeedsUpdating = false;
        sets.forEach(element => {
            if(settingsJSON[element[0]] != element[1]){
                settingsJSON[element[0]] = element[1];
                if(gameRules.find((el) => el == element[0])){
                    Minecraft.process.stdin.write(`gamerule ${element[0]} ${element[1]}\n`)
                }
                if(serverProperties[element[0]]){
                    serverPropertiesNeedsUpdating = true;
                }
            }
        });
        await writeFile('db/settings.json', JSON.stringify(settingsJSON));
        if(serverPropertiesNeedsUpdating){
            Minecraft.sceduleOffJob(writeServerProperties, 'updating settings');
        }
    }
}
async function writeServerProperties(){
    let propertiesFile = '';
    for (const key in serverProperties) {
        if (Object.hasOwnProperty.call(serverProperties, key)) {
            propertiesFile += `${serverProperties[key]}=${settingsJSON[key] ?? defaultSettings[key]}${os.EOL}`
        }
    }
    propertiesFile += 'level-name=bedrock_level';
    await writeFile('mc/bedrock-server/server.properties', propertiesFile);
}

const Database = {
    players,
    settings
}
module.exports = Database;