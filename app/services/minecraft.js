const child_process = require('child_process');
const os = require("os");
const path = require('path');
const Events = require("./events");
const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const Settings = require('./database/settings');

const minecraftService = {
    process,
    buffer:'',
    scheduleOffJob: scheduleOffJob,
    status:'offline',
    start,
    stop,
    stopDelayed
}

// On linux, the minecraft server process can get orphaned when the parent dies,
// which stops WebMC from opening it again.
// This checks to see if the bedrock_server is already running and kills it if it is.
if(process.platform != 'win32'){
    try{
        const pids = child_process.execSync('pgrep bedrock_server').toString().split('\n');
        pids.pop();
        pids.forEach(pid => {
            if(child_process.execSync(`readlink -f /proc/${'' + parseInt(pid)}/exe`).toString().startsWith(path.resolve('mc/bedrock-server'))){
                child_process.execSync(`kill ${pid}`);
            }
        });
    }
    catch (err){
        console.log(err);
    }
}

function startMCServer(){
    setStatus('starting');
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
       setStatus('offline');
        // was it a crash?
        if(code !== 0){
            startMCServer();
        }
    });
}

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
            setStatus('online');
            Events.emit('minecraft_logs_started');
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
let isRestarting = false;
function scheduleOffJob(job, reason){
    offJobs.push(job);
    if(!isRestarting){
        isRestarting = true;
        restart(reason);
    }
}
async function restart(reason){
    setStatus("restarting");
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
    if(isRestarting){
        minecraftService.process.stdin.write('stop\n');
        await (new Promise((resolve, reject) => {
            minecraftService.process.once('exit', () => {
                resolve();
            })
        }));
        await doOffJobs();
        isRestarting = false;
        startMCServer();
    }
}
async function doOffJobs(){
    while(offJobs.length > 0){
        await offJobs[0]();
        offJobs.splice(0, 1);
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function setStatus(status){
    minecraftService.status = status;
    Events.emit('minecraft_status', minecraftService.status);
}
function start(){
    if(minecraftService.status == 'offline'){
        startMCServer();
    }
}
async function stop(){
    if(minecraftService.status == 'online' || minecraftService.status == 'restarting' || minecraftService.status == 'shutting-down'){
        minecraftService.process.stdin.write('stop\n');
        isRestarting = false;
        await (new Promise((resolve, reject) => {
            minecraftService.process.once('exit', () => {
                resolve();
            })
        }));
        await doOffJobs();
    }
}
async function stopDelayed(){
    if(minecraftService.status == 'online' || minecraftService.status == 'restarting'){
        setStatus('shutting-down');
        Events.emit('minecraft_stopping', { time: 60 });
        minecraftService.process.stdin.write(`say Server shutting down in 60 seconds\n`);
        await sleep(30 * 1000);
        minecraftService.process.stdin.write('say Server shutting down in 30 seconds\n');
        await sleep(15 * 1000);
        minecraftService.process.stdin.write('say Server shutting down in 15 seconds\n');
        await sleep(5 * 1000);
        for(let i = 10; i > 0; i--){
            minecraftService.process.stdin.write(`say Server shutting down in ${i} seconds\n`);
            await sleep(1000);
        }
        await stop();
    }
}

Events.on('settings.serverPropertiesChanged', () => {
    scheduleOffJob(async () => {
        await writeFile('mc/bedrock-server/server.properties', Settings.getServerProperties());
    }, 'changing settings');
});
Events.on('settings.gameruleChanged', (key, value) => {
    minecraftService.process.stdin.write(`gamerule ${key} ${value}\n`)
});
fs.writeFileSync('mc/bedrock-server/server.properties', Settings.getServerProperties(), () => {});

startMCServer();
module.exports = minecraftService;