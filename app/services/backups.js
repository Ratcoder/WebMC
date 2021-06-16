const Minecraft = require('./minecraft');
const node_schedule = require('node-schedule')
const fs = require('fs');
const util = require('util');
const mkdir =  util.promisify(fs.mkdir);
const rmdir = util.promisify(fs.rmdir);
const copyFile = util.promisify(fs.copyFile);
const truncate = util.promisify(fs.truncate);
const readdir = util.promisify(fs.readdir);

let backups = [];
fs.readdir('mc/backups', (err, files) => {
    if(err){
        fs.mkdirSync('mc/backups');
    }
    else{
        files.forEach(file => {
            backups.push(file);
        });
    }
});

function startBackup(){
    Minecraft.sceduleOffJob(backup, 'a backup');
}
node_schedule.scheduleJob('0 0 * * *', startBackup);
async function backup(){
    const date = Date.now();
    await copyFolder(`mc/bedrock-server/worlds/bedrock_level`, `mc/backups/${date}`);
    backups.push(date);
    return date;
}
async function copyFolder(source, dest){
    await mkdir(dest);
    const files = await readdir(source);
    files.forEach(file => {
        if(fs.lstatSync(`${source}/${file}`).isDirectory()){
            copyFolder(`${source}/${file}`, `${dest}/${file}`)
        }
        else{
            copyFile(`${source}/${file}`, `${dest}/${file}`);
        }
    });
}

function startRevert(path){
    Minecraft.sceduleOffJob(async () => {
        await revert(path);
    }, 'reverting to a backup');
}
async function revert(path){
    await rmdir('mc/bedrock-server/worlds/bedrock_level', {recursive: true});
    await copyFolder(`mc/backups/${path}`, 'mc/bedrock-server/worlds/bedrock_level');
}

const BackupsService = {
    backups,
    startBackup,
    startRevert,
    backup,
    revert
};
module.exports = BackupsService;