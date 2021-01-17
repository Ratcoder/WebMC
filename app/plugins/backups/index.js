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
        this.display.settings[0].fields[2].fields.unshift({
            name: new Date(parseInt(save)).toLocaleString(),
            type: 'button',
            url: '/api/backups/restore/' + save,
            warn: {
                text: 'Are you sure you want to revert to this backup? All progress in the world after the backup will be lost forever.'
            }
        });
        this.http.post['restore/' + save] = (req, res, body) => {
            this.restore(save);
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
        this.addRestoreButton(date);
        console.log('Backup done!');
        if(this.settings.get('announceBackups')){
            this.mcServer.stdin.write(`say §lBackup taken at: ${new Date(parseInt(date)).toLocaleString()}\n`);
        }
    }
    startBackup(){
        if(this.settings.get('announceBackups')){
            this.mcServer.stdin.write('say §lTaking a backup...\n');
        }
        this.mcServer.stdin.write('save hold\n');
        this.interval = setInterval(() => {
            this.mcServer.stdin.write('save query\n');
        }, 1000);
    }
    restore = async function restore(date){
        console.log('Restoring...');
        this.mcServer.stdin.write(`say §l§cReverting to the backup taken at: ${new Date(parseInt(date)).toLocaleString()}\n`);
        this.mcServer.stdin.write('say §l§cReverting in 60 seconds\n');
        await this.sleep(30000);
        this.mcServer.stdin.write('say §l§cReverting in 30 seconds\n');
        await this.sleep(20000);
        for(let i = 10; i > 0; i--){
            this.mcServer.stdin.write(`say §l§cReverting in ${i} seconds\n`);
            await this.sleep(1000);
        }
        this.mcServer.stdin.write(`say §l§cReverting!\n`);
        const path = `mc/backups/${date}`;
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
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    display = {
        settings: [
            {
                tab: 'backups',
                type: 'spread',
                fields: [
                    {
                        name: 'Announce Backups In Chat',
                        type: 'bool',
                        setting: 'announceBackups'
                    },
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
            },
            {
                type: 'tab',
                name: 'Backups',
                id: 'backups',
                priority: 0
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