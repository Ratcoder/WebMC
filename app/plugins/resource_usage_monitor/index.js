const pidusage = require('pidusage');
const os = require('os');
const child_process = require('child_process');

class PerformanceLogs{
    totalSystemMemory = os.totalmem();
    ramGraph = [];
    cpuGraph = [];
    numberOfCores = os.cpus().length;
    lastIdleTotal = os.cpus().reduce((a, b) => a + b.times.idle, 0);
    lastIdleTimestamp = Date.now()
    pids = []

    constructor(settings, referances){
        this.pids.push(process.pid);
        this.pids.push(referances.mcServer.pid);
        if(process.platform == 'win32'){
            this.pids.push(parseInt(child_process.execSync('wmic PROCESS WHERE ParentProcessId=' + referances.mcServer.pid + ' GET ProcessId').toString().substring('ProcessId\r\n'.length)));
        }
        else{
            console.log(referances.mcServer.pid);
            this.pids.push(parseInt(child_process.execSync('pgrep -P ' + referances.mcServer.pid).toString()));
        }
    }

    intervals = [
        [
            () => {

                pidusage(this.pids, (err, statsAll) => {
                    let stats = {cpu:0, memory:0, timestamp: statsAll[this.pids[0]].timestamp};
                    for(let key in statsAll){
                        const stat = statsAll[key.toString()];
                        stats.memory += stat.memory;
                        stats.cpu += stat.cpu;
                    }
                    let mem = stats.memory + process.memoryUsage().heapTotal;
                    this.ramGraph.push({memory: mem, otherMemory: this.totalSystemMemory - os.freemem() - mem, _t: stats.timestamp});
                    let idleTotal = os.cpus().reduce((a, b) => a + b.times.idle, 0);
                    const now = Date.now();
                    this.cpuGraph.push({cpu: stats.cpu / this.numberOfCores, otherCpu: 100 - 100 * ((idleTotal - this.lastIdleTotal) / (now - this.lastIdleTimestamp)) / this.numberOfCores - stats.cpu / this.numberOfCores, _t: stats.timestamp});
                    this.lastIdleTotal = idleTotal;
                    this.lastIdleTimestamp = now;
                    this.ramConnections.forEach(element => {
                        element.write(`data: ${JSON.stringify(this.ramGraph[this.ramGraph.length - 1])}\n\n`);
                    });
                    this.cpuConnections.forEach(element => {
                        element.write(`data: ${JSON.stringify(this.cpuGraph[this.cpuGraph.length - 1])}\n\n`);
                    });
                    if(this.ramGraph.length > 60){
                        this.ramGraph.shift();
                        this.cpuGraph.shift();
                    }
                });
            },
            1000
        ]
    ]

    getGraph(number){
        if(number == 0){
            return this.ramGraph;
        }
        else{
            return this.cpuGraph;
        }
    }

    display = {
        graphs:[
            {
                title: "Ram Usage",
                limit: this.totalSystemMemory,
                url: '/api/resource-usage-monitor/ram',
                unit: "bytes",
                fields: [
                    {
                        title: "Other",
                        property: "otherMemory"
                    },
                    {
                        title: "Server",
                        property: "memory"
                    }
                ]
            },
            {
                title: "CPU Usage",
                limit: 100,
                url: '/api/resource-usage-monitor/cpu',
                unit: "percent",
                fields: [
                    {
                        title: "Other",
                        property: "otherCpu"
                    },
                    {
                        title: "Server",
                        property: "cpu"
                    }
                ]
            }
        ]
    }

    ramConnections = [];
    cpuConnections = [];
    http = {
        prefix: 'resource-usage-monitor',
        get: {
            'ram': (req, res, body) => {
                res.stream.respond({
                    'content-type': 'text/event-stream',
                    'cache-controll': 'no-cache',
                    ':status': 200
                });
                // res.stream.write('data: ' + this.logs + '\n\n');
                this.ramGraph.forEach(element => {
                    res.stream.write(`data: ${JSON.stringify(element)}\n\n`);
                });
                res.stream.on('end', () => {
                    for (let i = 0; i < this.ramConnections.length; i++) {
                        if(this.ramConnections[i] == res.stream){
                            this.ramConnections.splice[i];
                        }
                    }
                });

                this.ramConnections.push(res.stream);
            },
            'cpu': (req, res, body) => {
                res.stream.respond({
                    'content-type': 'text/event-stream',
                    'cache-controll': 'no-cache',
                    ':status': 200
                });
                // res.stream.write('data: ' + this.logs + '\n\n');
                this.cpuGraph.forEach(element => {
                    res.stream.write(`data: ${JSON.stringify(element)}\n\n`);
                });
                res.stream.on('end', () => {
                    for (let i = 0; i < this.cpuConnections.length; i++) {
                        if(this.cpuConnections[i] == res.stream){
                            this.cpuConnections.splice[i];
                        }
                    }
                });

                this.cpuConnections.push(res.stream);
            }
        }
    }
}

module.exports = PerformanceLogs;