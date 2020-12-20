const fs = require('fs');
const fetch = require('node-fetch');

/**
 * Responds to requests like a static website server would.
 * @param {*} request - The http2 request.
 * @param {*} responce - The http2 responce
 */
module.exports = function staticServe(request, responce){
    let path = request.headers[':path'];
    // if(path == '/players' || path == '/settings' || path == '/terminal' || path == '/login'){
    //     path = '/';
    // }
    // fetch('http://localhost:5000' + path)
    //     .then(res => res.text())
    //     .then(res => {
    //         if(path.endsWith('.svg')){
    //             responce.stream.respond({
    //                 ':status': 200,
    //                 'Content-Type': 'image/svg+xml; charset=utf-8'
    //             });
    //             responce.stream.end(res.toString());
    //         }
    //         else if(path.endsWith('.png')){
    //             responce.stream.respond({
    //                 ':status': 200,
    //                 'Content-Type': 'image/png'
    //             });
    //             responce.stream.end(res.body.read());
    //         }
    //         else{
    //             responce.stream.respond({
    //                 ':status': 200
    //             });
    //             responce.stream.end(res.toString());
    //         }
    //     })
    // return;

    let file = 'svelte/public' + path;
    // If we are asked for a folder, we will try to send an index.html file inside that folder
    if(file.endsWith('/')){
        file += 'index.html';
    }
    // Does this file not exist?
    if(!fs.existsSync(file)){
        if(path == '/players' || path == '/settings' || path == '/terminal' || path == '/login'){
            responce.stream.respondWithFile('svelte/public/index.html');
            //stream.respondWithFile('svelte/public/index.html');
        }
        else{
            // 404
            responce.stream.respond({
                ':status': 404
            });
            responce.stream.end('Not found');
        }
    }
    // We are good to send the file
    else{
        if(file.endsWith('.svg')){
            responce.stream.respondWithFile(file, {
                ':status': 200,
                'Content-Type': 'image/svg+xml; charset=utf-8'
            });
        }
        else{
            responce.stream.respondWithFile(file);
        }
    }
}