const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = class MinecraftSettings{
    constructor(settings, referances){
        this.mcServer = referances.mcServer;
    }
    init(){
        this.settings.onChange = (setting, value) => {
            if(setting.startsWith('server.properties.')){
                let serverProperties = 'level-name=../../worlds/bedrock_level' + os.EOL;
                for(set of this.settings._settings.entries()){
                    if(set[0].startsWith('server.properties.')){
                        serverProperties += `${set[0].substring(18)}=${set[1]}${os.EOL}`;
                    }
                }
                fs.writeFile('mc/bedrock-server/server.properties', serverProperties, (err) => {
                    this.mcServer.stdin.write('reload\n');
                });
            }
        };
    }

    display = {
        settings: [
            {
                name: 'Minecraft Settings',
                type: 'section',
                fields: [
                    {
                        name: 'Server Name',
                        desc: 'Used as the server name',
                        type: 'string',
                        setting: 'server.properties.server-name'
                    },
                    {
                        name: 'Seed',
                        desc: 'Use to randomize the world',
                        type: 'string',
                        setting: 'server.properties.level-seed'
                    },
                    {
                        name: 'Max View Distance',
                        desc: 'The maximum allowed view distance in number of chunks.',
                        type: 'int',
                        range:{
                            min: 0
                        },
                        setting: 'server.properties.view-distance'
                    },
                    {
                        name: 'Tick Distance',
                        desc: 'The world will be ticked this many chunks away from any player.',
                        type: 'int',
                        range:{
                            min: 4,
                            max: 12
                        },
                        setting: 'server.properties.tick-distance'
                    },
                    {
                        name: 'Max Threads',
                        desc: 'Maximum number of threads the server will try to use. If set to 0, it will use as many as possible.',
                        type: 'int',
                        range: {
                            min: 0
                        },
                        setting: 'server.properties.max-threads'
                    },
                    
                    {
                        name: 'Texturepack Required',
                        desc: 'Force clients to use texture packs in the current world',
                        type: 'bool',
                        setting: 'server.properties.texturepack-required'
                    },
                    {
                        name: 'Content Log File Enabled',
                        desc: 'Enables logging content errors to a file',
                        type: 'bool',
                        setting: 'server.properties.content-log-file-enabled'
                    }
                ]
            },
            {
                name: 'Gamerules',
                type: 'section',
                fields: [
                    {
                        name: 'Gamemode',
                        desc: 'Sets the game mode for new players.',
                        type: 'enum',
                        enum: ['survival', 'creative', 'adventure'],
                        setting: 'server.properties.'
                    },
                    {
                        name: 'Difficulty',
                        desc: 'Sets the difficulty of the world.',
                        type: 'enum',
                        enum: ['easy', 'normal', 'hard'],
                        setting: 'server.properties.'
                    },
                    {
                        name: 'Cheats',
                        desc: 'If true then cheats like commands can be used.',
                        type: 'bool',
                        setting: 'server.properties.'
                    },
                    {
                        name: 'Default Player Permission Level',
                        desc: 'Permission level for new players joining for the first time.',
                        type: 'enum',
                        enum: ["visitor", "member", "operator"],
                        setting: 'server.properties.'
                    }
                ]
            },
            {
                name: 'Minecraft Networking',
                type: 'section',
                fields: [
                    {
                        name: 'Port',
                        desc: 'Which IPv4 port the server should listen to.',
                        type: 'int',
                        range:{
                            min: 1,
                            max: 65535
                        },
                        setting: 'server.properties.server-port'
                    },
                    {
                        name: 'IPv6 Port',
                        desc: 'Which IPv6 port the server should listen to.',
                        type: 'int',
                        range:{
                            min: 1,
                            max: 65535
                        },
                        setting: 'server.properties.server-portv6'
                    },
                    {
                        name: 'Compression Threshold',
                        desc: 'Determines the smallest size of raw network payload to compress',
                        type: 'int',
                        range: {
                            min: 0,
                            max: 65535
                        },
                        setting: 'server.properties.compression-threshold'
                    }
                ]
            },
            {
                name: 'Player Permissions',
                type: 'section',
                fields:[
                    {
                        name: 'Max Players',
                        desc: 'The maximum number of players that can play on the server.',
                        type: 'int',
                        range:{
                            min: 0
                        },
                        setting: 'server.properties.max-players'
                    },
                    {
                        name: 'Online Mode',
                        desc: 'If true then all connected players must be authenticated to Xbox Live.\nClients connecting to remote (non-LAN) servers will always require Xbox Live authentication regardless of this setting.\nIf the server accepts connections from the Internet, then it\'s highly recommended to enable online-mode.',
                        type: 'bool',
                        setting: 'server.properties.online-mode'
                    },
                    {
                        name: 'White List',
                        desc: 'If true then all connected players must be listed in the separate whitelist.json file.',
                        type: 'bool',
                        setting: 'server.properties.white-list'
                    },
                    {
                        name: 'Player Idle Timeout',
                        desc: 'After a player has idled for this many minutes they will be kicked. If set to 0, players can idle indefinitely.',
                        type: 'int',
                        range:{
                            min: 0
                        },
                        setting: 'server.properties.player-idle-timeout'
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
                                setting: 'server.properties.server-authoritative-movement'
                            },
                            {
                                name: 'Player Movement Score Threshold',
                                desc: 'The number of incongruent time intervals needed before abnormal behavior is reported.\nDisabled by server-authoritative-movement.',
                                type: 'int',
                                setting: 'server.properties.player-movement-score-threshold'
                            },
                            {
                                name: 'Player Movement Distance Threshold',
                                desc: 'The difference between server and client positions that needs to be exceeded before abnormal behavior is detected.\nDisabled by server-authoritative-movement.',
                                type: 'float',
                                setting: 'server.properties.player-movement-distance-threshold'
                            },
                            {
                                name: 'Player Movement Durtion Threshold (in ms)',
                                desc: 'The duration of time the server and client positions can be out of sync (as defined by player-movement-distance-threshold)\nbefore the abnormal movement score is incremented. This value is defined in milliseconds.\nDisabled by server-authoritative-movement.',
                                type: 'int',
                                setting: 'server.properties.player-movement-duration-threshold-in-ms'
                            },
                            {
                                name: 'Correct Player Movement',
                                desc: 'If true, the client position will get corrected to the server position if the movement score exceeds the threshold.',
                                type: 'bool',
                                setting: 'server.properties.correct-player-movement'
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