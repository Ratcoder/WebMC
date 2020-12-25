const schedule = require('node-schedule');
const fs = require('fs');
const static = require('./static.js');
const SSL = require('./ssl');

module.exports = function(ref){
    if(!fs.existsSync('cert/private')) SSL.generateSSLCert()
    // ----- SERVER -----
    const http2 = require('http2');
    var server;
    function startAdminServer(){
        console.log('Starting website...');
        // make the server
        const key = fs.readFileSync('cert/private');
        server = http2.createSecureServer({
            key: key,
            cert: fs.readFileSync('cert/cert'),
            allowHTTP1: true
        });
        const api = require('./api')(key);
        // log any errors
        server.on('error', (err) => console.error(err));
        // this is for responces
        server.on('request', (request, responce) => {
            const path = request.headers[':path'];
            if(!path){
                console.log('No path in http request!');
            }
            else if(path.startsWith('/api')){
                api(request, responce, ref);
            }
            else{
                static(request, responce);
            }
        });
        

        // listen on the default https port (443)
        server.listen(3000);
        console.log('Website started.')
    }
    startAdminServer();

    // ----- SSL -----
    SSL.watch(server, startAdminServer);
}

