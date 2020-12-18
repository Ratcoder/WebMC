const schedule = require('node-schedule');
const fs = require('fs');

module.exports = function(server, startAdminServer){
    // makes a tsl certificate
    function generateSSLCert(){
        console.log('Generating SSL certificate...')

        const selfsigned = require('selfsigned');
        var attrs = [{ name: 'commonName', value: 'a server' }];
        var pems = selfsigned.generate(attrs, {
            keySize: 2048, // the size for the private key in bits (default: 1024)
            days: 60, // how long till expiry of the signed certificate (default: 365)
            algorithm: 'sha256', // sign the certificate with specified algorithm (default: 'sha1')
            extensions: [{ name: 'basicConstraints', cA: true }], // certificate extensions array
            pkcs7: true, // include PKCS#7 as part of the output (default: false)
        });
        fs.writeFileSync('cert/private', pems.private, ()=>{

        });
        fs.writeFileSync('cert/cert', pems.cert, ()=>{

        });
        fs.writeFileSync('cert/date', Date.now(), ()=>{

        });
    }
    // every month renew the certificate
    schedule.scheduleJob('0 0 0 * *', function(){
        generateSSLCert();
        server.close();
        startAdminServer();
    });
    // do we need to renew it right away?
    try{
        // has it been more than a month since the last time we made it?
        if (Date.now() - fs.readFileSync('cert/date') > 1000 * 60 * 60 * 24 * 30){
            // then yes
            generateSSLCert();
        }
    }
    catch(err){
        // we couldn't read the file, so yes
        generateSSLCert();
    }
}