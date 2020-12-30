const node_schedule = require('node-schedule')
const fs = require('fs');
const util = require('util');
const mkdir =  util.promisify(fs.mkdir);
const copyFile =  util.promisify(fs.copyFile);
const truncate =  util.promisify(fs.truncate);

module.exports = class Backups{
    interval;
    constructor(settings, referances){
        this.mcServer = referances.mcServer;
        this.backup = this.backup.bind(this)
        referances.mcEvents.on('dataSaved', this.backup);
    }
    init(){
        node_schedule.scheduleJob('0 0 * * *', () => {
            this.mcServer.stdin.write('save hold\n');
            this.interval = setInterval(() => {
                this.mcServer.stdin.write('save query\n');
            }, 1000);
        });
        fs.readdir('mc/backups', (err, files) => {
            files.forEach(file => {
                this.display.settings[0].fields[0].fields.push({
                    name: new Date(parseInt(file)).toLocaleString(),
                    type: 'button',
                    url: '/api/backups/' + file
                });
            });
        });
    }

    backup = async function backup(event){
        console.log('Taking a backup...');
        clearInterval(this.interval);
        const date = Date.now();
        const path = 'mc/backups/' + date;
        await mkdir(path);
        await mkdir(`${path}/db`);
        for(let i = 0; i < event.length; i++){
            const element = event[i];
            const shortPath = element[0].substring('../../worlds/bedrock_level/'.length);
            await copyFile(`mc/worlds/bedrock_level/${shortPath}`, `${path}/${shortPath}`);
            await truncate(`${path}/${shortPath}`, parseInt(element[1]));
        }
        console.log(this.mcServer)
        this.mcServer.stdin.write('save resume\n');
        console.log('Backup done!');
        this.display.settings[0].fields[0].fields.push({
            name: date.toLocaleString(),
            type: 'button',
            url: '/api/backups/' + date
        });
    }

    display = {
        settings: [
            {
                name: 'Backups',
                type: 'section',
                fields: [
                    {
                        name: 'Roll Back',
                        type: 'section',
                        fields: [
                        ]
                    }
                ]
            }
        ]
    }

    http = {
        prefix: 'backups'
    }
}