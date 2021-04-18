const Minecraft = require('./minecraft');
const Events = require('./events');

const pidusage = require('pidusage');
const os = require('os');
const child_process = require('child_process');

let serverOn = false;
const cpuGraph = [];
const ramGraph = [];
const playerGraph = [];

let pids = [];

function findPids(){
    pids = [];
    pids.push(process.pid);
    pids.push(Minecraft.process.pid);
    // if(process.platform == 'win32'){
    //     pids.push(parseInt(child_process.execSync('wmic PROCESS WHERE ParentProcessId=' + Minecraft.process.pid + ' GET ProcessId').toString().substring('ProcessId\r\n'.length)));
    // }
    if(process.platform != 'win32'){
        pids.push(parseInt(child_process.execSync('pgrep -P ' + Minecraft.process.pid).toString()));
    }
}
Events.on('minecraft_logs_started', () => {
    findPids();
    serverOn = true;
});
Events.on('minecraft_quit', () => {
    console.log('quiting')
    serverOn = false;
});

let lastIdleTotal = 0;
let lastIdleTimestamp = 0;
const numberOfCores = os.cpus().length;
const totalSystemMemory = os.totalmem();

setInterval(() => {
    if(serverOn && pids.length > 0){
        pidusage(pids, (err, statsAll) => {
            if(err){
                console.log(err);
                return;
            }
            let stats = {cpu:0, memory:0, timestamp: statsAll[pids[0]].timestamp};
            for(let key in statsAll){
                const stat = statsAll[key.toString()];
                stats.memory += stat.memory;
                stats.cpu += stat.cpu;
            }
            let mem = stats.memory + process.memoryUsage().heapTotal;
            const ramData = {data: [mem, totalSystemMemory - os.freemem() - mem], _t: stats.timestamp};
            Events.emit('graph_data_ram', ramData);
            ramGraph.push(ramData);
            let idleTotal = os.cpus().reduce((a, b) => a + b.times.idle, 0);
            const now = Date.now();
            const cpuData = {data: [stats.cpu / numberOfCores, 100 - 100 * ((idleTotal - lastIdleTotal) / (now - lastIdleTimestamp)) / numberOfCores - stats.cpu / numberOfCores], _t: stats.timestamp};
            Events.emit('graph_data_cpu', cpuData);
            cpuGraph.push(cpuData);
            lastIdleTotal = idleTotal;
            lastIdleTimestamp = now;
            if(ramGraph.length > 60){
                ramGraph.shift();
                cpuGraph.shift();
            }
        });
    }
}, 1000);

let players = 0;
updatePlayerGraph();
Events.on('minecraft_logs_playerConnected', () => {
    players++;
    updatePlayerGraph();
});
Events.on('minecraft_logs_playerDisconnected', () => {
    players--;
    updatePlayerGraph();
});
function updatePlayerGraph(){
    const data = {data: [players], _t: Date.now()};
    playerGraph.push(data);
    Events.emit('graph_data_players', data);
}

const GraphsService = {
    cpu: cpuGraph,
    ram: ramGraph,
    players: playerGraph
}
module.exports = GraphsService;