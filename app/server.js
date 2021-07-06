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


if(!fs.existsSync('db/cert/private')){
    if(!fs.existsSync('db/cert')) fs.mkdirSync('db/cert');
    SSL.generateSSLCert();
}

const failedAttempts = new Map();

const public = process.argv.find(el => el == '--dev') ? 'svelte/public' : 'public';

let server;
function startAdminServer(){
    console.log('Starting website...');
    // make the server
    const key = fs.readFileSync('db/cert/private');
    server = http2.createSecureServer({
        key: key,
        cert: fs.readFileSync('db/cert/cert'),
        allowHTTP1: true
    });
    // log any errors
    server.on('error', (err) => console.error(err));
    // this is for responses
    server.on('request', (request, response) => {
        const path = request.headers[':path'];
        // make a buffer to hold the body of the request
        let buffer = '';
        response.stream.on('data', (data) => {
            buffer += '' + data;
        });
        response.stream.on('end', () => {
            if(path.endsWith('/')){
                response.stream.respondWithFile(`${public}/index.html`, {}, {onError: (err)=>{console.log(err)}});
                return;
            }
            console.log(`${request.method} ${path}`);
            if(fs.existsSync(`${public}/${path}`)){
                if(path.endsWith('.svg')){
                    response.stream.respondWithFile(`${public}/${path}`, {
                        ':status': 200,
                        'Content-Type': 'image/svg+xml; charset=utf-8'
                    });
                    return;
                }
                else if (path.endsWith('.css')) {
                    response.stream.respondWithFile(`${public}/${path}`, {
                        ':status': 200,
                        'Content-Type': 'text/css; charset=utf-8'
                    });
                    return;
                }
                else{
                    response.stream.respondWithFile(`${public}/${path}`);
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
                        response.stream.respond({
                            'content-type': 'text/plain; charset=utf-8',
                            ':status': 401
                        });
                        response.stream.end(`banned:${attempt.ban - Date.now()}`);
                        return;
                    }
                }
                authenticate(buffer, key)
                    .then(token => {
                        response.stream.respond({
                            'content-type': 'text/plain; charset=utf-8',
                            'Set-Cookie': [`jwt=${token}; Secure; HttpOnly`],
                            ':status': 200
                        });
                        response.stream.end('Logged in.');
                    })
                    .catch(err => {
                        response.stream.respond({
                            'content-type': 'text/plain; charset=utf-8',
                            ':status': 401
                        });
                        response.stream.end('Incorrect name or password.');
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
                                    new Response(response)
                                );
                            }
                            else{
                                response.stream.respond({
                                    'content-type': 'text/plain; charset=utf-8',
                                    ':status': 401
                                });
                                response.stream.end('Unauthorized');
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
                            new Response(response)
                        );
                        found = true;
                    }
                    break;
                }
            }
            if(!found){
                response.stream.respond({
                    'content-type': 'text/plain; charset=utf-8',
                    ':status': 404
                });
                response.stream.end('Not Found');
            }
        });

        // if(!path){
        //     console.log('No path in http request!');
        // }
        // else if(path.startsWith('/api')){
        //     api(request, response, {mc:{plugins, stop, start, server: mcServer}});
        // }
        // else{
        //     static(request, response);
        // }
    });
    

    // listen on the webmc port (14142)
    server.listen(14142);
    console.log('Website started.');
}
startAdminServer();
SSL.watch(server, startAdminServer);

class Response{
    _headers = {};

    constructor(response){
        this._response = response;
    }
    status(status){
        this.setHeader(':status', status);
        return this;
    }
    json(json){
        this.setHeader('content-type', 'application/json; charset=utf-8');
        this._response.stream.respond(this._headers);
        this._response.stream.end(JSON.stringify(json));
    }
    text(text){
        this.setHeader('content-type', 'text/plain; charset=utf-8');
        this._response.stream.respond(this._headers);
        this._response.stream.end(text);
    }
    eventstream(){
        this.setHeader('content-type', 'text/event-stream');
        this.setHeader('cache-control', 'no-cache');
        this._response.stream.respond(this._headers);
        return this;
    }
    write(data){
        this._response.stream.write(data);
    }
    setHeader(header, value){
        this._headers[header] = value;
    }
}