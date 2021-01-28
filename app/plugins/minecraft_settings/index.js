const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = class MinecraftSettings{

    preload = this.saveServerProperties;

    init(referances){
        this.mcServer = referances.mcServer;
        this.stop = referances.stop;
        this.start = referances.start;

        this.settings.set('mc-restart-required', false);
        this.settings.onChange = (setting, value) => {
            if(setting.startsWith('server.properties.')){
                this.saveServerProperties();
            }
            else if(setting.startsWith('gamerule.')){
                this.mcServer.stdin.write(`gamerule ${setting.substring(9)} ${value}\n`);
            }
        };
    }

    needsToSaveServerProperties = false;
    savingServerProperties = false;
    saveServerProperties(){
        if(this.savingServerProperties){
            this.needsToSaveServerProperties = true;
        }
        this.savingServerProperties = true;
        this.needsToSaveServerProperties = false;

        let serverProperties = 'level-name=../../worlds/bedrock_level' + os.EOL;
        for(const set of this.settings._settings.entries()){
            if(set[0].startsWith('server.properties.')){
                serverProperties += `${set[0].substring(18)}=${set[1]}${os.EOL}`;
            }
        }
        fs.writeFile('mc/bedrock-server/server.properties', serverProperties, (err) => {
            if(this.needsToSaveServerProperties){
                this.savingServerProperties = false;
                this.saveServerProperties();
            }
        });
    }

    display = {
        settings: [
            {
                type: 'tab',
                name: 'Game Settings',
                id: 'game-settings',
                priority: 2
            },
            {
                type: 'tab',
                name: 'General',
                id: 'general',
                priority: 3
            },
            {
                type: 'tab',
                name: 'Player Permissions',
                id: 'player-permissions',
                priority: 0
            },
            {
                type: 'tab',
                name: 'Advanced',
                id: 'advanced',
                priority: -1
            },
            {
                type: 'spread',
                tab: 'general',
                fields: [
                    {
                        name: 'Server Name',
                        desc: 'Used as the server name',
                        type: 'string',
                        setting: 'server.properties.server-name',
                        default: 'Dedicated Server',
                        mcRestartRequired: true
                    },
                    {
                        name: 'Seed',
                        desc: 'Use to randomize the world',
                        type: 'string',
                        setting: 'server.properties.level-seed',
                        default: '',
                        mcRestartRequired: true
                    }
                ]
            },
            {
                type: 'spread',
                tab: 'game-settings',
                fields: [
                    {
                        name: 'Default Gamemode',
                        desc: 'Sets the game mode for new players.',
                        type: 'enum',
                        enum: ['survival', 'creative', 'adventure'],
                        setting: 'server.properties.gamemode',
                        default: 'survival',
                        mcRestartRequired: true
                    },
                    {
                        name: 'Difficulty',
                        desc: 'Sets the difficulty of the world.',
                        type: 'enum',
                        enum: ['easy', 'normal', 'hard'],
                        setting: 'server.properties.difficulty',
                        default: 'easy',
                        mcRestartRequired: true
                    },
                    {
                        name: 'Default Player Permission Level',
                        desc: 'Permission level for new players joining for the first time.',
                        type: 'enum',
                        enum: ["visitor", "member", "operator"],
                        setting: 'server.properties.default-player-permission-level',
                        default: 'member',
                        mcRestartRequired: true
                    },
                    {
                        name: 'Simulation Distance',
                        desc: 'The world will be ticked this many chunks away from any player.',
                        type: 'int',
                        range:{
                            min: 4,
                            max: 12
                        },
                        setting: 'server.properties.tick-distance',
                        default: 4,
                        mcRestartRequired: true
                    },
                    {
                        name: 'Friendly Fire',
                        desk: '',
                        setting: 'gamerule.pvp',
                        type: 'bool',
                        default: true
                    },
                    {
                        name: 'Show Coordinates',
                        desk: '',
                        setting: 'gamerule.showCoordinates',
                        type: 'bool',
                        default: true
                    },
                    {
                        name: 'Fire Spreads',
                        desk: '',
                        setting: 'gamerule.doFireTick',
                        type: 'bool',
                        default: true
                    },
                    {
                        name: 'TNT Explodes',
                        desk: '',
                        setting: 'gamerule.tntExplodes',
                        type: 'bool',
                        default: true
                    },
                    {
                        name: 'Mob Loot',
                        desk: '',
                        setting: 'gamerule.doMobLoot',
                        type: 'bool',
                        default: true
                    },
                    {
                        name: 'Natural Regeneration',
                        desk: '',
                        setting: 'gamerule.naturalRegeneration',
                        type: 'bool',
                        default: true
                    },
                    {
                        name: 'Tile Drops',
                        desk: '',
                        setting: 'gamerule.doTileDrops',
                        type: 'bool',
                        default: true
                    },
                    {
                        name: 'Immediate Respawn',
                        desk: '',
                        setting: 'gamerule.doImmediateRespawn',
                        type: 'bool',
                        default: false
                    },
                    {
                        name: 'Respawn Radius',
                        desk: '',
                        setting: 'gamerule.spawnRadius',
                        type: 'int',
                        default: 5
                    },
                    {
                        name: 'Cheats',
                        type: 'section',
                        fields: [
                            {
                                name: 'Cheats',
                                desc: 'If true then cheats like commands can be used.',
                                type: 'bool',
                                setting: 'server.properties.allow-cheats',
                                default: false,
                                mcRestartRequired: true
                            },
                            {
                                name: 'Do Daylight Cycle',
                                desk: '',
                                setting: 'gamerule.doDaylightCycle',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Keep Inventory',
                                desk: '',
                                setting: 'gamerule.keepInventory',
                                type: 'bool',
                                default: false
                            },
                            {
                                name: 'Mob Spawning',
                                desk: '',
                                setting: 'gamerule.doMobSpawning',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Mob Griefing',
                                desk: '',
                                setting: 'gamerule.mobGriefing',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Do Entity Drops',
                                desk: '',
                                setting: 'gamerule.doEntityDrops',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Weather Cycle',
                                desk: '',
                                setting: 'gamerule.doWeatherCycle',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Command Blocks Enabled',
                                desk: '',
                                setting: 'gamerule.commandBlocksEnabled',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Random Tick Speed',
                                desk: '',
                                setting: 'gamerule.randomTickSpeed',
                                type: 'int',
                                default: 1
                            },
                            {
                                name: 'Insomnia',
                                desk: '',
                                setting: 'gamerule.doInsomnia',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Drowning Damage',
                                desk: '',
                                setting: 'gamerule.drowningDamage',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Fall Damage',
                                desk: '',
                                setting: 'gamerule.fallDamage',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Fire Damage',
                                desk: '',
                                setting: 'gamerule.fireDamage',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Show Death Messages',
                                desk: '',
                                setting: 'gamerule.showDeathMessages',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Send Command Feedback',
                                desk: '',
                                setting: 'gamerule.sendCommandFeedback',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Command Block Output',
                                desk: '',
                                setting: 'gamerule.commandBlockOutput',
                                type: 'bool',
                                default: true
                            },
                            {
                                name: 'Max Command Chain Length',
                                desk: '',
                                setting: 'gamerule.maxCommandChainLength',
                                type: 'int',
                                default: 65536
                            },
                            {
                                name: 'Show Tags',
                                desk: '',
                                setting: 'gamerule.showTags',
                                type: 'bool',
                                default: true
                            }
                        ]
                    }
                ]
            },
            {
                tab: 'advanced',
                type: 'spread',
                fields: [
                    {
                        name: 'Port',
                        desc: 'Which IPv4 port the server should listen to.',
                        type: 'int',
                        range:{
                            min: 1,
                            max: 65535
                        },
                        setting: 'server.properties.server-port',
                        default: 19132
                    },
                    {
                        name: 'IPv6 Port',
                        desc: 'Which IPv6 port the server should listen to.',
                        type: 'int',
                        range:{
                            min: 1,
                            max: 65535
                        },
                        setting: 'server.properties.server-portv6',
                        default: 19133
                    },
                    {
                        name: 'Compression Threshold',
                        desc: 'Determines the smallest size of raw network payload to compress',
                        type: 'int',
                        range: {
                            min: 0,
                            max: 65535
                        },
                        setting: 'server.properties.compression-threshold',
                        default: 1
                    },
                    {
                        name: 'Max View Distance',
                        desc: 'The maximum allowed view distance in number of chunks.',
                        type: 'int',
                        range:{
                            min: 0
                        },
                        setting: 'server.properties.view-distance',
                        default: 32,
                        mcRestartRequired: true
                    },
                    {
                        name: 'Max Threads',
                        desc: 'Maximum number of threads the server will try to use. If set to 0, it will use as many as possible.',
                        type: 'int',
                        range: {
                            min: 0
                        },
                        setting: 'server.properties.max-threads',
                        default: 8,
                        mcRestartRequired: true
                    },
                    
                    {
                        name: 'Texturepack Required',
                        desc: 'Force clients to use texture packs in the current world',
                        type: 'bool',
                        setting: 'server.properties.texturepack-required',
                        default: false,
                        mcRestartRequired: true
                    },
                    {
                        name: 'Content Log File Enabled',
                        desc: 'Enables logging content errors to a file',
                        type: 'bool',
                        setting: 'server.properties.content-log-file-enabled',
                        default: false,
                        mcRestartRequired: true
                    }
                ]
            },
            {
                tab: 'player-permissions',
                type: 'spread',
                fields:[
                    {
                        name: 'Max Players',
                        desc: 'The maximum number of players that can play on the server.',
                        type: 'int',
                        range:{
                            min: 0
                        },
                        setting: 'server.properties.max-players',
                        default: 10,
                        mcRestartRequired: true
                    },
                    {
                        name: 'Online Mode',
                        desc: 'If true then all connected players must be authenticated to Xbox Live.\nClients connecting to remote (non-LAN) servers will always require Xbox Live authentication regardless of this setting.\nIf the server accepts connections from the Internet, then it\'s highly recommended to enable online-mode.',
                        type: 'bool',
                        setting: 'server.properties.online-mode',
                        default: true,
                        mcRestartRequired: true
                    },
                    {
                        name: 'White List',
                        desc: 'If true then all connected players must be listed in the separate whitelist.json file.',
                        type: 'bool',
                        setting: 'server.properties.white-list',
                        default: false,
                        mcRestartRequired: true
                    },
                    {
                        name: 'Player Idle Timeout',
                        desc: 'After a player has idled for this many minutes they will be kicked. If set to 0, players can idle indefinitely.',
                        type: 'int',
                        range:{
                            min: 0
                        },
                        setting: 'server.properties.player-idle-timeout',
                        default: 30,
                        mcRestartRequired: true
                    },
                    {
                        name: 'Server Authoritative Movement',
                        type: 'section',
                        fields: [
                            {
                                name: 'Server Authoritatative Movement',
                                desc: `Enables server authoritative movement. If "server-auth", the server will replay local user input on the server and send down corrections when the client's position doesn't match the server's.\nCorrections will only happen if correct-player-movement is set to true.`,
                                type: 'enum',
                                enum: ["client-auth", "server-auth"],
                                setting: 'server.properties.server-authoritative-movement',
                                default: 'server-auth',
                                mcRestartRequired: true
                            },
                            {
                                name: 'Player Movement Score Threshold',
                                desc: 'The number of incongruent time intervals needed before abnormal behavior is reported.\nDisabled by server-authoritative-movement.',
                                type: 'int',
                                setting: 'server.properties.player-movement-score-threshold',
                                default: 20,
                                mcRestartRequired: true
                            },
                            {
                                name: 'Player Movement Distance Threshold',
                                desc: 'The difference between server and client positions that needs to be exceeded before abnormal behavior is detected.\nDisabled by server-authoritative-movement.',
                                type: 'float',
                                setting: 'server.properties.player-movement-distance-threshold',
                                default: 0.3,
                                mcRestartRequired: true
                            },
                            {
                                name: 'Player Movement Durtion Threshold (in ms)',
                                desc: 'The duration of time the server and client positions can be out of sync (as defined by player-movement-distance-threshold)\nbefore the abnormal movement score is incremented. This value is defined in milliseconds.\nDisabled by server-authoritative-movement.',
                                type: 'int',
                                setting: 'server.properties.player-movement-duration-threshold-in-ms',
                                default: 500,
                                mcRestartRequired: true
                            },
                            {
                                name: 'Correct Player Movement',
                                desc: 'If true, the client position will get corrected to the server position if the movement score exceeds the threshold.',
                                type: 'bool',
                                setting: 'server.properties.correct-player-movement',
                                default: false,
                                mcRestartRequired: true
                            }
                        ]
                    }
                ]
            }
        ]
    }

    http = {
        prefix: 'minecraft-settings',
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