const http2 = require('http2');
const fs = require('fs');
const child_process = require('child_process');
const util = require('util');
const os = require('os');
const exec = util.promisify(child_process.exec);
const SSL = require('./ssl');
const Admins = require('./services/database/admins');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
const saltRounds = 10;
function generateOneTimeCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
    let code = '';
    for (let i = 0; i < 16; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
const oneTimeCode = generateOneTimeCode();

const lc = "\x1b[32m";
const rc = "\x1b[0m";

console.log(`
    ${lc}┌──────────────────────────────────────┐
    ${lc}│                                      │
    ${lc}│          ${rc}\x1b[1mWelcome to WebMC!${rc}${lc}           │
    ${lc}│                                      │
    ${lc}│     ${rc}WebMC is running at this url:${lc}    │
    ${lc}│        ${rc}https://localhost:14142${lc}       │
    ${lc}│                                      │
    ${lc}│      ${rc}Use this one time code to${lc}       │
    ${lc}│       ${rc}finish setting up WebMC:${lc}       │
    ${lc}│                                      │
    ${lc}│           ${rc}${oneTimeCode}${lc}           │
    ${lc}│                                      │
    ${lc}└──────────────────────────────────────┘`
);
console.log = () => {};

if(!fs.existsSync('db')) fs.mkdirSync('db');
if(!fs.existsSync('db/cert')) fs.mkdirSync('db/cert');
SSL.generateSSLCert();

const key = fs.readFileSync('db/cert/private');
server = http2.createSecureServer({
    key: key,
    cert: fs.readFileSync('db/cert/cert'),
    allowHTTP1: true
});

const sockets = new Set();
server.on('connection', (socket) => {
    sockets.add(socket)
    socket.on('close', () => {
        sockets.delete(socket);
    })
});

let step = fs.readFileSync('.uninstalled') || '0';
if (parseInt(step) > 1) require('./services/minecraft');

const isDev = process.argv.find(el => el == '--dev');
const public = isDev ? 'svelte/public' : 'public';
server.on('request', (request, response) => {
    const path = request.headers[':path'];
    // make a buffer to hold the body of the request
    let buffer = '';
    response.stream.on('data', (data) => {
        buffer += '' + data;
    });
    response.stream.on('end', () => {
        if (path == '/') {
            response.stream.respondWithFile(`${public}/setup.html`, {}, {onError: (err)=>{console.log(err)}});
            return;
        }
        else if (path == '/setup-ping') {
            response.stream.respond({
                'content-type': 'text/plain; charset=utf-8',
                ':status': 200
            });
            response.stream.end('');
            return;
        }
        else if (path == '/test-code') {
            if (buffer == oneTimeCode) {
                response.stream.respond({
                    'content-type': 'text/plain; charset=utf-8',
                    ':status': 200
                });
                response.stream.end(step);
                return;
            }
            else {
                response.stream.respond({
                    'content-type': 'text/plain; charset=utf-8',
                    ':status': 403
                });
                response.stream.end('Incorrect Code');
                return;
            }
        }
        else if (path == '/ip-info') {
            if (buffer == oneTimeCode) {
                if (os.platform() == 'win32') {
                    child_process.exec('ipconfig', async (error, stdout, stderr) => {
                        response.stream.respond({
                            'content-type': 'application/json; charset=utf-8',
                            ':status': 200
                        });
                        response.stream.end(JSON.stringify({
                            gateway: stdout.split('Default Gateway . . . . . . . . . : ')[1].split(os.EOL)[0],
                            localip: stdout.split('IPv4 Address. . . . . . . . . . . : ')[1].split(os.EOL)[0],
                            publicip: await (await fetch('https://api.ipify.org')).text(),
                        }));
                    });
                }
                else {
                    child_process.exec('hostname -I', (error, stdout_ip, stderr) => {
                        child_process.exec('ip route | grep "default"', async (error, stdout_gateway, stderr) => {
                            response.stream.respond({
                                'content-type': 'application/json; charset=utf-8',
                                ':status': 200
                            });
                            response.stream.end(JSON.stringify({
                                gateway: stdout_gateway.split(' ')[2],
                                localip: stdout_ip,
                                publicip: await (await fetch('https://api.ipify.org')).text(),
                            }));
                        });
                    });
                }
                return;
            }
            else {
                response.stream.respond({
                    'content-type': 'text/plain; charset=utf-8',
                    ':status': 403
                });
                response.stream.end('Incorrect Code');
                return;
            }
        }
        else if (path == '/set-login' && step == '0') {
            try {
                let req = JSON.parse(buffer);
                if (req.code != oneTimeCode) {
                    response.stream.respond({
                        'content-type': 'text/plain; charset=utf-8',
                        ':status': 403
                    });
                    response.stream.end('Incorrect Code');
                    return;
                }
                if (!req.username || !req.password) {
                    response.stream.respond({
                        'content-type': 'text/plain; charset=utf-8',
                        ':status': 400
                    });
                    response.stream.end('');
                    return;
                }

                let admin = {name: req.username, password: req.password, level: 3};
                
                bcrypt.hash(admin.password, saltRounds, async (err, hash) => {
                    admin.password = hash;
                    Admins.insert(admin).then(() => {
                        response.stream.respond({
                            'content-type': 'text/plain; charset=utf-8',
                            ':status': 200
                        });
                        response.stream.end('OK');
                        step = '1';
                        fs.writeFileSync('.uninstalled', '1');
                    });
                });
                return;
            }
            catch {
                response.stream.respond({
                    'content-type': 'text/plain; charset=utf-8',
                    ':status': 400
                });
                response.stream.end('');
                return;
            }
        }
        else if (path == '/agreed-to-eula' && step == '1') {
            if (buffer != oneTimeCode) {
                response.stream.respond({
                    'content-type': 'text/plain; charset=utf-8',
                    ':status': 403
                });
                response.stream.end('Incorrect Code');
                return;
            }
            response.stream.respond({
                'content-type': 'text/plain; charset=utf-8',
                ':status': 200
            });
            response.stream.end('');
            (async () => {
                if (!fs.existsSync('mc')) fs.mkdirSync('mc');
                await exec(__dirname + '/scripts/update_mc_server.' + ((process.platform == 'win32') ? 'bat' : 'sh'));
                require('./services/minecraft');
                step = '2';
                await fs.promises.writeFile('.uninstalled', '2');
            })();
            return;
        }
        else if (path == '/finish' && step == '2') {
            if (buffer != oneTimeCode) {
                response.stream.respond({
                    'content-type': 'text/plain; charset=utf-8',
                    ':status': 403
                });
                response.stream.end('Incorrect Code');
                return;
            }
            response.stream.respond({
                'content-type': 'text/plain; charset=utf-8',
                ':status': 200
            });
            response.stream.end('');
            (async () => {
                await require('./services/minecraft').stop();
                fs.unlinkSync('.uninstalled');
                server.close();
                sockets.forEach(s => s.destroy());
                process.exit();
            })();
            return;
        }
        response.stream.respond({
            'content-type': 'text/plain; charset=utf-8',
            ':status': 404
        });
        response.stream.end('Not Found');
    });
});

server.listen(14142);