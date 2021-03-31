const fs = require('fs');
const os = require('os');
const http2 = require('http2');
// const pluginSettings = require('./minecraft/plugin_settings.js');
// const static = require('./website/static.js');
const SSL = require('./ssl');
const authorize = require('./authorize');
const authenticate = require('./authenticate');
const bcrypt = require('bcrypt');

const routes = fs.readdirSync('./app/routes').map(file => require('./routes/' + file));


if(!fs.existsSync('cert/private')) SSL.generateSSLCert()

let admins = new Map();
const saltRounds = 10;
bcrypt.hash('password', saltRounds, function(err, hash) {
    admins.set('Ratcoder', hash);
});

let server;
function startAdminServer(){
    console.log('Starting website...');
    // make the server
    const key = fs.readFileSync('cert/private');
    server = http2.createSecureServer({
        key: key,
        cert: fs.readFileSync('cert/cert'),
        allowHTTP1: true
    });
    // log any errors
    server.on('error', (err) => console.error(err));
    // this is for responces
    server.on('request', (request, responce) => {
        const path = request.headers[':path'];
        // make a buffer to hold the body of the request
        let buffer = '';
        responce.stream.on('data', (data) => {
            buffer += '' + data;
        });
        responce.stream.on('end', () => {
            if(path.endsWith('/')){
                responce.stream.respondWithFile('svelte/public/index.html');
                return;
            }
            console.log(`svelte/public${path}`);
            if(fs.existsSync(`svelte/public${path}`)){
                if(path.endsWith('.svg')){
                    responce.stream.respondWithFile(`svelte/public${path}`, {
                        ':status': 200,
                        'Content-Type': 'image/svg+xml; charset=utf-8'
                    });
                    return;
                }
                else{
                    responce.stream.respondWithFile(`svelte/public${path}`);
                    return;
                }
            }

            if(path == '/api/login'){
                authenticate(buffer, key, admins)
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

            let found = false;
            for (let i = 0; i < routes.length; i++) {
                if(routes[i].path == path && routes[i].method == request.method){
                    if(!routes[i].public){
                        authorize(request.headers.cookie, key).then(result => {
                            if(result){
                                routes[i].handler(
                                    {
                                        headers: request.headers,
                                        body: buffer
                                    },
                                    new Responce(responce)
                                );
                            }
                            else{
                                responce.stream.respond({
                                    'content-type': 'text/plain; charset=utf-8',
                                    ':status': 401
                                });
                                responce.stream.end('Unauthorized');
                            }
                        });
                        found = true;
                        break;
                    }
                    else{
                        routes[i].handler(
                            {
                                headers: request.headers,
                                body: buffer
                            },
                            new Responce(responce)
                        );
                        found = true;
                    }
                    break;
                }
            }
            if(!found){
                responce.stream.respond({
                    'content-type': 'text/plain; charset=utf-8',
                    ':status': 404
                });
                responce.stream.end('Not Found');
            }
        });

        // if(!path){
        //     console.log('No path in http request!');
        // }
        // else if(path.startsWith('/api')){
        //     api(request, responce, {mc:{plugins, stop, start, server: mcServer}});
        // }
        // else{
        //     static(request, responce);
        // }
    });
    

    // listen on the default https port (443)
    server.listen(3000);
    console.log('Website started.');
}
startAdminServer();
SSL.watch(server, startAdminServer);

class Responce{
    _status = 200;

    constructor(responce){
        this.responce = responce;
    }
    status(status){
        this._status = status;
        return this;
    }
    json(json){
        this.responce.stream.respond({
            'content-type': 'application/json; charset=utf-8',
            ':status': this._status
        });
        this.responce.stream.end(JSON.stringify(json));
    }
    text(text){
        this.responce.stream.respond({
            'content-type': 'text/plain; charset=utf-8',
            ':status': this._status
        });
        this.responce.stream.end(text);
    }
    eventstream(){
        this.responce.stream.respond({
            'content-type': 'text/event-stream',
            'cache-controll': 'no-cache',
            ':status': this._status
        });
        return this;
    }
    write(data){
        this.responce.stream.write(data);
    }
}