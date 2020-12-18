const fs = require('fs');
const jwt = require('jsonwebtoken');
const authorize = require('./authorize.js');
const authenticate = require('./authenticate.js');
const bcrypt = require('bcrypt');
const customPluginRoute = require('./routes/custom.js');
const saltRounds = 10;

let privateKey;
let admins = new Map();

function route(request, responce, ref){
    const path = request.headers[':path'];
    let plugins = ref.mc.plugins;

    if(path == '/api/display.json'){
        responce.stream.respond({
            'content-type': 'text/json; charset=utf-8',
            ':status': 200
        });
        let pluginViews = [];
        plugins.forEach(element => {
            if(element.display) pluginViews.push(element.display);
        });
        responce.stream.end(JSON.stringify(pluginViews));
    }
    else if(path.startsWith('/api/graphs/')){
        
        let pluginGraphs = [];
        plugins.forEach(element => {
            if(element.display && element.display.graphs) pluginGraphs.push(element);
        });
        let graphPath = path.substring(12).split("/");
        let pluginID = parseInt(graphPath[0]);
        let graphID = parseInt(graphPath[1]);
        if(pluginID >= pluginGraphs.length || graphID >= pluginGraphs[pluginID].display.graphs.length){
            responce.stream.respond({
                'content-type': 'text/json; charset=utf-8',
                ':status': 400
            });
        }
        else{
            responce.stream.respond({
                'content-type': 'text/json; charset=utf-8',
                ':status': 200
            });
            responce.stream.end(JSON.stringify(pluginGraphs[pluginID].getGraph(graphID)));
        }
        
    }
    else{
        // make a buffer to hold the body of the request
        let buffer = '';
        responce.stream.on('data', (data) => {
            buffer += '' + data;
        });

        responce.stream.on('end', () => {
            if(path == '/api/login' && request.headers[':method'] == 'POST'){
                authenticate(buffer, privateKey, admins)
                    .then(token => {
                        responce.stream.respond({
                            'content-type': 'text/plain; charset=utf-8',
                            'Set-Cookie': [`jwt=${token}; Secure; HttpOnly`],
                            ':status': 200
                        });
                        responce.stream.end('Logged in.');
                    })
                    .catch(err => {
                        responce.stream.respond({
                            'content-type': 'text/plain; charset=utf-8',
                            ':status': 401
                        });
                        responce.stream.end('Incorrect name or password.')
                    });
                return;
            }
            let loggedIn;
            authorize(request.headers['cookie'], privateKey).then(auth => {
                loggedIn = auth;
                if(!loggedIn){
                    responce.stream.respond({
                        'content-type': 'text/plain; charset=utf-8',
                        ':status': 401
                    });
                    responce.stream.end("Not authorized.")
                }
                else{
                    plugins.forEach(element => {
                        if(element.http){
                            if(path.startsWith('/api/' + element.http.prefix + '/')){
                                if(request.headers[':method'] == 'POST'){
                                    for (const key in element.http.post) {
                                        if (element.http.post.hasOwnProperty(key)) {
                                            const route = element.http.post[key];
                                            if(path.startsWith('/api/' + element.http.prefix + '/' + key)){
                                                route(request, responce, buffer);
                                            }
                                        }
                                    }
                                }
                                else{
                                    for (const key in element.http.get) {
                                        if (element.http.get.hasOwnProperty(key)) {
                                            const route = element.http.get[key];
                                            if(path.startsWith('/api/' + element.http.prefix + '/' + key)){
                                                route(request, responce, buffer);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            });

            //ref.mc.server.stdin.write(buffer);
            
        });
    }
}

module.exports = function(key){
    privateKey = key;
    // fs.readFile('settings/admins.json', (err, data) => {
    //     JSON.parse(data).forEach(admin => {
    //         admins.set(admin.name, admin.password);
    //     });
    // });
    bcrypt.hash('password', saltRounds, function(err, hash) {
        admins.set('Ratcoder', hash);
    });
    return route;
}