module.exports = (request, responce, ref, buffer) => {
    const path = request.headers[':path'];
    const plugins = ref.mc.plugins;
    if(path == '/api/plugin-settings/'){
        responce.stream.respond({
            'content-type': 'text/event-stream',
            ':status': 200
        });
        plugins.forEach(element => {
            if(element.settings){
                for (const [key, value] of element.settings._settings.entries()) {
                    responce.stream.write(`data: ${JSON.stringify([element.settings.prefix, key, value])}\n\n`);
                }
                element.settings._streams.push(responce.stream);
                responce.stream.on('end', () => {
                    for (let i = 0; i < element.settings._streams.length; i++) {
                        if(element.settings._streams[i] == responce.stream){
                            element.settings._streams.splice(i);
                        }
                    }
                });
            }
        });
    }
    else{
        plugins.forEach(element => {
            if(element.settings && path.startsWith('/api/plugin-settings/' + element.settings.prefix)){
                if(request.headers[':method'] == 'POST'){
                    element.settings.set(...JSON.parse(buffer));
                    responce.stream.respond({
                        'content-type': 'text/json; charset=utf-8',
                        ':status': 200
                    });
                    responce.stream.end('Changed setting.')
                }
            }
        });
    }
}