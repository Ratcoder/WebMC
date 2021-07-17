const Backups = require('./backups');
const Minecraft = require('./minecraft');
const Events = require('./events');
const node_schedule = require('node-schedule')
const fetch = require('node-fetch');
const fs = require('fs');
const child_process = require('child_process');
const util = require('util');
const mkdir =  util.promisify(fs.mkdir);
const rmdir = util.promisify(fs.rmdir);
const copyFile = util.promisify(fs.copyFile);
const exec = util.promisify(child_process.exec);

let runningVersion;

Events.on('minecraft_logs_version', (version) => {
    runningVersion = version;
    Events.once('minecraft_logs_started', () => {
        checkForUpdate();
    })
});

node_schedule.scheduleJob('0 0 * * *', checkForUpdate);

async function getLatestVersion(){
    const res = await fetch('https://webmc.ratcoder.com/minecraft_version.txt');
    const text = await res.text();
    return text;
}

async function update(){
    const date = await Backups.backup();
    if(!fs.existsSync('mc/temp')) await mkdir('mc/temp');
    await copyFile('mc/bedrock-server/server.properties', 'mc/temp/server.properties');
    await copyFile('mc/bedrock-server/whitelist.json', 'mc/temp/whitelist.json');
    await copyFile('mc/bedrock-server/permissions.json', 'mc/temp/permissions.json');
    await exec(__dirname + '/../scripts/update_mc_server.' + ((process.platform == 'win32') ? 'bat' : 'sh'));
    await copyFile('mc/temp/server.properties', 'mc/bedrock-server/server.properties');
    await copyFile('mc/temp/whitelist.json', 'mc/bedrock-server/whitelist.json');
    await copyFile('mc/temp/permissions.json', 'mc/bedrock-server/permissions.json');
    await rmdir('mc/temp', { recursive: true });
    await Backups.revert(date);
}

async function checkForUpdate(){
    if(runningVersion != await getLatestVersion()){
        console.log('Minecraft Server outdated!');
        Minecraft.sceduleOffJob(update, 'updating server');
    }
}

const MinecraftUpdatesService = {
    checkForUpdate
};
module.exports = MinecraftUpdatesService;