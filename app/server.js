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

const failedAttempts = new Map();

const public = (process.argv[2] == 'dev') ? 'svelte/public' : 'public';

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
                responce.stream.respondWithFile(`${public}/index.html`);
                return;
            }
            console.log(`${request.method} ${path}`);
            if(fs.existsSync(`${public}/${path}`)){
                if(path.endsWith('.svg')){
                    responce.stream.respondWithFile(`${public}/${path}`, {
                        ':status': 200,
                        'Content-Type': 'image/svg+xml; charset=utf-8'
                    });
                    return;
                }
                else{
                    responce.stream.respondWithFile(`${public}/${path}`);
                    return;
                }
            }

            if(path == '/api/login'){
                const attemptKey = `${request.socket.remoteAddress}/${JSON.parse(buffer).name}`;
                const attempt = failedAttempts.get(attemptKey);
                if(attempt && attempt.ban){
                    if(attempt.ban < Date.now()){
                        attempt.ban = false;
                        failedAttempts.delete(attemptKey);
                    }
                    else{
                        responce.stream.respond({
                            'content-type': 'text/plain; charset=utf-8',
                            ':status': 401
                        });
                        responce.stream.end(`banned:${attempt.ban - Date.now()}`);
                        return;
                    }
                }
                authenticate(buffer, key)
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
                        responce.stream.end('Incorrect name or password.');
                        const attempt = failedAttempts.get(attemptKey) || { fails: 0 };
                        attempt.fails ++;
                        if(attempt.fails % 3 == 0){
                            attempt.ban = Date.now() + 60000 * Math.pow(2, attempt.fails / 3);
                        }
                        failedAttempts.set(attemptKey, attempt);
                    });
                return;
            }

            let found = false;
            for (let i = 0; i < routes.length; i++) {
                if(routes[i].path == path && routes[i].method == request.method){
                    if(!routes[i].public){
                        authorize(request.headers.cookie, key, routes[i].accessLevel || 2).then(result => {
                            if(result.passed){
                                routes[i].handler(
                                    {
                                        headers: request.headers,
                                        body: buffer,
                                        token: result.token
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
    

    // listen on the webmc port (14142)
    server.listen(14142);
    console.log('Website started.');
}
startAdminServer();
SSL.watch(server, startAdminServer);

class Responce{
    _headers = {};

    constructor(responce){
        this._responce = responce;
    }
    status(status){
        this.setHeader(':status', status);
        return this;
    }
    json(json){
        this.setHeader('content-type', 'application/json; charset=utf-8');
        this._responce.stream.respond(this._headers);
        this._responce.stream.end(JSON.stringify(json));
    }
    text(text){
        this.setHeader('content-type', 'text/plain; charset=utf-8');
        this._responce.stream.respond(this._headers);
        this._responce.stream.end(text);
    }
    eventstream(){
        this.setHeader('content-type', 'text/event-stream');
        this.setHeader('cache-controll', 'no-cache');
        this._responce.stream.respond(this._headers);
        return this;
    }
    write(data){
        this._responce.stream.write(data);
    }
    setHeader(header, value){
        this._headers[header] = value;
    }
}