const child_process = require('child_process');
const EventEmitter = require('events');
const os = require('os');

module.exports = function(){
    let mcServer;
    let mcServerEventEmitter = new EventEmitter();
    let mcServerStringBuffer = '';
    let mcLogs = '';
    let plugins = [];
    let intervals = [];
    
    startMcServer();
    function startMcServer(){
        console.log('Starting server...');
        // spawn the child process
        //mcServer = child_process.spawn((process.platform == 'win32') ? 'mc/bedrock-server/bedrock_server.exe' : (__dirname + '/../../start_mc_server.sh'));
        mcServer = child_process.spawn(__dirname + '/../../start_mc_server.' + ((process.platform == 'win32') ? 'bat' : 'sh'));
        mcServer.on('spawn', () => {
            // Load the plugins
            console.log('Loading plugins...');
            plugins = [];
            intervals = [];
            // get the path to each one
            let normalizedPath = require("path").join(__dirname, "../plugins");
            require("fs").readdirSync(normalizedPath).forEach(function(file) {
                try{
                    // import the plugin class
                    const pc = require("../plugins/" + file);
                    // make an instance
                    let plugin = new pc({}, {mcServer: mcServer, mcEvents: mcServerEventEmitter});
                    plugin.settings = {
                        get(setting){
                            return this._settings.get(setting);
                        },
                        set(setting, value){
                            this.onChange(setting, value);
                            this._streams.forEach(element => {
                                element.write(`data: ${this.prefix}/${setting} ${value}`);
                            });
                            return this._settings.set(setting, value);
                        },
                        onChange(setting, value){},
                        prefix: plugin.http.prefix,
                        _settings: new Map(),
                        _streams: []
                    }
                    // add it to the array of plugins
                    plugins.push(plugin);
                    // run its init function, if it has one
                    if(plugin.init) plugin.init();
                    // get each of its intervals
                    if(plugin.intervals){
                        plugin.intervals.forEach(element => {
                            // start them and save the interval id to the intervals array (so we can stop them later)
                            intervals.push(setInterval(...element));
                        });
                    }
                }
                catch(err){
                    console.log(err)
                }
                
            });
            console.log('Server started sucsessfully.');
        });
        mcServer.stdout.setEncoding('utf8');
        mcServer.stdout.on('data', (data) => {
            // add this data to the "buffer" (the ''+ is to convert it into a string)
            mcServerStringBuffer+=''+data;
            mcLogs+=''+data;
            if(mcLogs.length > 500){
                mcLogs.logs = mcLogs.substring(mcLogs.length - 500);
            }
            // do we have a linebreak?
            if(mcServerStringBuffer.includes(os.EOL)){
                // yes, so we have at least one full line
                // split up all the lines
                let logs = mcServerStringBuffer.split(os.EOL);
                // loop through all the full lines (not the last)
                for(let i = 0;i < logs.length - 1;i++){
                    processMcServerLog(logs[i]);
                }
                // set the buffer to be the last line (the incomplete one)
                mcServerStringBuffer = logs[logs.length-1];
            }
        });
        mcServer.on('exit', (code, signal) => {
            // was it a crash?
            if(code !== 0 || true){
                console.log('Minecraft server crashed: ' + code);
                // clear all the intervals
                intervals.forEach(element => {
                    clearInterval(element);
                });
                // restart the mc server
                startMcServer();
            }
        });
        

        
        mcServerEventEmitter = new EventEmitter();
        mcServerEventEmitter.on('quit',()=>{
            mcServerStringBuffer = '';
            mcLogs = '';
            console.log('Quiting');
            intervals.forEach(element => {
                clearInterval(element);
            });
        })

        mcServer.emit('spawn');
    }
    
    // setTimeout(()=>{mcServer.stdin.write('stop\u000A')},1000);
    
    function processMcServerLog(log){
        console.log(log);
        mcServerEventEmitter.emit('log', log);
        if(log.startsWith('[')){
            //log = log.substring(27);
            if(log.startsWith('[INFO] Player connected: ')){
                const split = log.substring(25).split(', xuid: ');
                mcServerEventEmitter.emit('playerConnected', split[0], split[1])
            }
            else if(log.startsWith('[INFO] Player disconnected: ')){
                const split = log.substring(28).split(', xuid: ');
                mcServerEventEmitter.emit('playerDisconnected', split[0], split[1])
            }
        }
        else if(log.startsWith('Kicked ')){
            const split = log.substring(7).split(' from the game: ');
            mcServerEventEmitter.emit('playerKicked', split[0], split[1])
        }
        else if(log == 'Quit correctly'){
            mcServerEventEmitter.emit('quit');
        }
    }

    function getLogs(){
        return mcLogs;
    }
    return {
        server: mcServer,
        plugins,
        getLogs
    };
}