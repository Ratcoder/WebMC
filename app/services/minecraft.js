const child_process = require('child_process');
const os = require("os");
const path = require('path');
const Events = require("./events");

const minecraftService = {
    process,
    buffer:'',
    sceduleOffJob
}

function startMCServer(){
    logStore = "";
    if(process.platform == 'win32'){
        minecraftService.process = child_process.spawn(path.resolve('mc/bedrock-server/bedrock_server.exe'));
    }
    else{
        minecraftService.process = child_process.spawn(path.resolve('app/scripts/start_mc_server.sh'));
    }
    
    minecraftService.process.stdout.setEncoding('utf8');
    minecraftService.process.stdout.on('data', (data) => {
        // add this data to the "buffer" (the ''+ is to convert it into a string)
        minecraftService.buffer += data + '';
        // do we have a linebreak?
        if(minecraftService.buffer.includes(os.EOL)){
            // yes, so we have at least one full line
            // split up all the lines
            let logs = minecraftService.buffer.split(os.EOL);
            // loop through all the full lines (not the last)
            for(let i = 0; i < logs.length - 1; i++){
                logStore += logs[i];
                console.log(logs[i]);
                processMcServerLog(logs[i]);
            }
            // set the buffer to be the last line (the incomplete one)
            minecraftService.buffer = logs[logs.length-1];
        }
    });

    minecraftService.process.on('exit', (code, signal) => {
        // was it a crash?
        if(code !== 0){
            startMCServer();
        }
    });
}
startMCServer();

let nextLineIsSavedFiles = false;
function processMcServerLog(log){
    if(os.platform == 'win32' && (log.endsWith('cd mc/bedrock-server ') || log.endsWith('bedrock_server.exe'))){
        return;
    }
    Events.emit('minecraft_logs', log);
    if(nextLineIsSavedFiles){
        Events.emit('minecraft_logs_dataSaved', log.split(', ').map(el => el.split(':')))
        console.log(log.split(', ').map(el => el.split(':')));
        nextLineIsSavedFiles = false;
    }
    else if(log.startsWith('[')){
        //log = log.substring(27);
        if(log.startsWith('[INFO] Player connected: ')){
            const split = log.substring(25).split(', xuid: ');
            Events.emit('minecraft_logs_playerConnected', split[0], split[1])
        }
        else if(log.startsWith('[INFO] Player disconnected: ')){
            const split = log.substring(28).split(', xuid: ');
            Events.emit('minecraft_logs_playerDisconnected', split[0], split[1])
        }
        else if(log == '[INFO] Server started.'){
            Events.emit('minecraft_logs_started')
        }
        else if(log.substring(27).startsWith('Version 1.')){
            Events.emit('minecraft_logs_version', log.substring(35));
        }
    }
    else if(log.startsWith('Kicked ')){
        const split = log.substring(7).split(' from the game: ');
        Events.emit('minecraft_logs_playerKicked', split[0], split[1])
    }
    else if(log.startsWith('Data saved. Files are now ready to be copied.')){
        nextLineIsSavedFiles = true;
    }
    else if(log == 'Quit correctly'){
        Events.emit('minecraft_quit');
    }
}

let offJobs = [];
let shuttingDown = false;
function sceduleOffJob(job, reason){
    offJobs.push(job);
    if(!shuttingDown){
        shuttingDown = true;
        shutDown(reason);
    }
}
async function shutDown(reason){
    Events.emit('minecraft_restarting', {reason, time: 60});
    minecraftService.process.stdin.write(`say Server restarting in 60 seconds for: ${reason}\n`);
    await sleep(30 * 1000);
    minecraftService.process.stdin.write('say Server restarting in 30 seconds\n');
    await sleep(15 * 1000);
    minecraftService.process.stdin.write('say Server restarting in 15 seconds\n');
    await sleep(5 * 1000);
    for(let i = 10; i > 0; i--){
        minecraftService.process.stdin.write(`say Server restarting in ${i} seconds\n`);
        await sleep(1000);
    }
    minecraftService.process.stdin.write('stop\n');
    await (new Promise((resolve, reject) => {
        minecraftService.process.once('exit', () => {
            resolve();
        })
    }));
    while(offJobs.length > 0){
        await offJobs[0]();
        offJobs.splice(0, 1);
    }
    shuttingDown = false;
    startMCServer();
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


module.exports = minecraftService;