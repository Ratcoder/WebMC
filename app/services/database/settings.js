const Events = require('../events');

const os = require('os');
const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

if(!fs.existsSync('db/settings.json')){
    fs.writeFileSync('db/settings.json', '{}');
}
const settingsJSON = JSON.parse(fs.readFileSync('db/settings.json'));
const defaultSettings = require('../../defaultSettings');
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
    tickDistance: 'tick-distance',
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
            Events.emit('settings.gameruleChanged', key, value);
        }
        await writeFile('db/settings.json', JSON.stringify(settingsJSON));
        if(serverProperties[element[0]]){
            Events.emit('settings.serverPropertiesChanged');
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
                    Events.emit('settings.gameruleChanged', element[0], element[1]);
                }
                if(serverProperties[element[0]]){
                    serverPropertiesNeedsUpdating = true;
                }
            }
        });
        await writeFile('db/settings.json', JSON.stringify(settingsJSON));
        if(serverPropertiesNeedsUpdating){
            Events.emit('settings.serverPropertiesChanged');
        }
    },
    getServerProperties(){
        let propertiesFile = '';
        for (const key in serverProperties) {
            if (Object.hasOwnProperty.call(serverProperties, key)) {
                propertiesFile += `${serverProperties[key]}=${settingsJSON[key] ?? defaultSettings[key]}${os.EOL}`
            }
        }
        propertiesFile += 'level-name=bedrock_level';
        return propertiesFile;
    }
}

module.exports = settings;