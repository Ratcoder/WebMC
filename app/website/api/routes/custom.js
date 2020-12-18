module.exports = (request, responce, buffer) => {
    plugins.forEach(element => {
        if(element.http){
            if(path.startsWith('/api/' + element.http.prefix + '/')){
                if(request.headers[':method'] == 'POST'){
                    for (const key in element.http.post) {
                        if (element.http.post.hasOwnProperty(key)) {
                            const route = element.http.post[key];
                            if(path.startsWith('/api/' + element.http.prefix + '/' + key)){
                                route(request, responce, buffer);
                            }
                        }
                    }
                }
                else{
                    for (const key in element.http.get) {
                        if (element.http.get.hasOwnProperty(key)) {
                            const route = element.http.get[key];
                            if(path.startsWith('/api/' + element.http.prefix + '/' + key)){
                                route(request, responce, buffer);
                            }
                        }
                    }
                }
            }
        }
    });
}