class OnlinePlayerCount{
    graph = []
    playersOnline = 0
    
    init(referances){
        this.graph.push({players: this.playersOnline, _t: Date.now()});
        referances.mcEvents.on('playerConnected', () => {
            this.playersOnline++;
            this.graph.push({players: this.playersOnline, _t: Date.now()});
            this.graphConnections.forEach(element => {
                element.write(`data: ${JSON.stringify(this.graph[this.graph.length - 1])}\n\n`);
            });
        });
        referances.mcEvents.on('playerDisconnected', () => {
            this.playersOnline--;
            this.graph.push({players: this.playersOnline, _t: Date.now()});
            this.graphConnections.forEach(element => {
                element.write(`data: ${JSON.stringify(this.graph[this.graph.length - 1])}\n\n`);
            });
        });
    }

    getGraph(number){
        return this.graph;
    }

    display = {
        graphs:[
            {
                title: "Online Players",
                url: '/api/player-counter/graph',
                limit: 10,
                fields: [
                    {
                        title: "Online Players",
                        property: "players"
                    }
                ]
            }
        ]
    }


    graphConnections = [];
    http = {
        prefix: 'player-counter',
        get: {
            'graph': (req, res, body) => {
                res.stream.respond({
                    'content-type': 'text/event-stream',
                    'cache-controll': 'no-cache',
                    ':status': 200
                });
                // res.stream.write('data: ' + this.logs + '\n\n');
                this.graph.forEach(element => {
                    res.stream.write(`data: ${JSON.stringify(element)}\n\n`);
                });
                res.stream.on('end', () => {
                    for (let i = 0; i < this.graphConnections.length; i++) {
                        if(this.graphConnections[i] == res.stream){
                            this.graphConnections.splice[i];
                        }
                    }
                });

                this.graphConnections.push(res.stream);
            }
        }
    }
}

module.exports = OnlinePlayerCount;