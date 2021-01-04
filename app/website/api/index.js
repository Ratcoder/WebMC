const fs = require('fs');
const jwt = require('jsonwebtoken');
const authorize = require('./authorize.js');
const authenticate = require('./authenticate.js');
const bcrypt = require('bcrypt');
const customPluginRoute = require('./routes/custom.js');
const pluginSettingsRoute = require('./routes/plugin_settings.js');
const saltRounds = 10;

let privateKey;
let admins = new Map();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function restart60(ref){
    ref.mc.server.stdin.write('say §l§9Restarting in 60 seconds\n');
    await sleep(30000);
    ref.mc.server.stdin.write('say §l§9Restarting in 30 seconds\n');
    await sleep(20000);
    for(let i = 10; i > 0; i--){
        ref.mc.server.stdin.write(`say §l§9Restarting in ${i} seconds\n`);
        await sleep(1000);
    }
    ref.mc.server.stdin.write(`say §l§9Restarting!\n`);
    await ref.mc.stop();
    ref.mc.start();
}

function route(request, responce, ref){
    const path = request.headers[':path'];
    let plugins = ref.mc.plugins;

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
                else if(path == '/api/restart-mc'){
                    console.log('Restarting mc...')
                    restart60(ref);
                    responce.stream.respond({
                        'content-type': 'text/json; charset=utf-8',
                        ':status': 200
                    });
                    responce.stream.end(JSON.stringify({
                        text: 'Server will restart in 60s.'
                    }));
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
                else if(path.startsWith('/api/plugin-settings')){
                    pluginSettingsRoute(request, responce, ref, buffer);
                }
                else{
                    customPluginRoute(request, responce, ref, buffer);
                }
            }
        });

        //ref.mc.server.stdin.write(buffer);
        
    });
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