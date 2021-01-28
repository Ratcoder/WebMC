module.exports = class Terminal{
    terminalConnections = [];
    logs = '';

    init(referances){
        this.referances = referances;

        referances.mcEvents.on('log', (log) => {
            this.logs += log + '\n';
            this.terminalConnections.forEach(element => {
                element.write(`data: ${log}\n\n`)
            });
        });
    }

    http = {
        prefix: 'terminal',
        get: {
            'logs': (req, res, body) => {
                res.stream.respond({
                    'content-type': 'text/event-stream',
                    'cache-controll': 'no-cache',
                    ':status': 200
                });
                //res.stream.write('data: ' + this.logs + '\n\n');
                this.logs.split('\n').forEach(element => {
                    if(element.length > 0) res.stream.write(`data: ${element}\n\n`);
                });
                res.stream.on('end', () => {
                    for (let i = 0; i < this.terminalConnections.length; i++) {
                        if(this.terminalConnections[i] == res.stream){
                            this.terminalConnections.splice[i];
                        }
                    }
                });

                this.terminalConnections.push(res.stream);
            }
        },
        post: {
            'command': (req, res, body) => {
                this.referances.mcServer.stdin.write(body)
                res.stream.respond({
                    'content-type': 'text/plain; charset=utf-8',
                    ':status': 200
                });
                res.end(`Command sent.`);
            }
        }
    }
}