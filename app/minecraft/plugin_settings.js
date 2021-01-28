const fs = require('fs');
function getDefault(arr){
    let settings = [];
    arr.forEach(setting => {
        if(setting.type == 'section'){
            settings.push(...getDefault(setting.fields));
        }
        else if(setting.type == 'section'){
            settings.push(...getDefault(setting.fields));
        }
        else if(typeof setting.default !== 'undefined'){
            settings.push([setting.setting, setting.default]);
        }
    });
    return settings;
};


module.exports = (plugin, path) => {
    plugin.settings = {
        get(setting){
            return this._settings.get(setting);
        },
        set(setting, value){
            let result = this._settings.set(setting, value);
            fs.writeFile(this._path,  JSON.stringify(Array.from(this._settings)), (err) => {
                console.log(err);
            });
            this.onChange(setting, value);
            this._streams.forEach(element => {element.write(`data: ${JSON.stringify([this.prefix, setting, value])}\n\n`);});
            return result;
        },
        onChange(setting, value){},
        prefix: plugin.http.prefix,
        _settings: new Map(),
        _streams: [],
        _path: path
    }
    if(!fs.existsSync(plugin.settings._path)){
        fs.writeFileSync(plugin.settings._path, JSON.stringify(getDefault(plugin.display.settings)));
    }
    else{
        plugin.settings._settings = new Map(JSON.parse(fs.readFileSync(plugin.settings._path)));
    }
}