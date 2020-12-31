const node_schedule = require('node-schedule')
const fs = require('fs');
const util = require('util');
const mkdir =  util.promisify(fs.mkdir);
const rmdir = util.promisify(fs.rmdir);
const copyFile = util.promisify(fs.copyFile);
const truncate = util.promisify(fs.truncate);
const readdir = util.promisify(fs.readdir);

module.exports = class Backups{
    interval;
    constructor(settings, referances){
        this.mcServer = referances.mcServer;
        this.stop = referances.stop;
        this.start = referances.start;
        this.backup = this.backup.bind(this)
        referances.mcEvents.on('dataSaved', this.backup);
        referances.mcEvents.on('quit', () => {
            this.backupJob.cancel();
        });
    }
    init(){
        this.backupJob = node_schedule.scheduleJob('0 0 * * *', () => {
            this.startBackup();
        });
        fs.readdir('mc/backups', (err, files) => {
            files.forEach(file => this.addRestoreButton(file));
        });
    }

    addRestoreButton(save){
        this.display.settings[0].fields[1].fields.unshift({
            name: new Date(parseInt(save)).toLocaleString(),
            type: 'button',
            url: '/api/backups/restore/' + save
        });
        this.http.post['restore/' + save] = (req, res, body) => {
            console.log('restoring');
            this.restore(`mc/backups/${save}`);
        }
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
        this.mcServer.stdin.write('save resume\n');
        console.log('Backup done!');
        this.addRestoreButton(date);
    }
    startBackup(){
        this.mcServer.stdin.write('save hold\n');
        this.interval = setInterval(() => {
            this.mcServer.stdin.write('save query\n');
        }, 1000);
    }
    restore = async function restore(path){
        await this.stop();
        await rmdir('mc/worlds/bedrock_level', {recursive: true});
        await mkdir('mc/worlds/bedrock_level');
        await mkdir('mc/worlds/bedrock_level/db');
        const topFiles = await readdir(path);
        const dbFiles = await readdir(path + '/db');
        for (let i = 0; i < topFiles.length; i++) {
            if(!fs.lstatSync(`${path}/${topFiles[i]}`).isDirectory()){
                await copyFile(`${path}/${topFiles[i]}`, `mc/worlds/bedrock_level/${topFiles[i]}`);
            }
        }
        for (let i = 0; i < dbFiles.length; i++) {
            await copyFile(`${path}/db/${dbFiles[i]}`, `mc/worlds/bedrock_level/db/${dbFiles[i]}`);
        }
        this.start();
    }

    display = {
        settings: [
            {
                name: 'Backups',
                type: 'section',
                fields: [
                    {
                        name: 'Take Backup',
                        type: 'button',
                        url: '/api/backups/backup'
                    },
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
        prefix: 'backups',
        post: {
            'backup': (req, res, body) => {
                this.startBackup();
            }
        }
    }
}