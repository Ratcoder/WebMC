module.exports = (request, responce, ref, buffer) => {
    const path = request.headers[':path'];
    const plugins = ref.mc.plugins;
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
            else{
                
            }
        }
    });
}