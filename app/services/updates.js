const child_process = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const node_schedule = require('node-schedule');
const fetch = require('node-fetch');
const Minecraft = require('./minecraft');
const currentVersion = '0.1.2';

if (process.argv.find(el => el == '--dev')) {
    return;
}

checkForUpdates();
node_schedule.scheduleJob('0 0 * * *', checkForUpdates); // Every day at midnight

function checkForUpdates() {
    if (getLatestVersion() != currentVersion) {
        Minecraft.scheduleOffJob(async () => {
            fs.mkdirSync('temp');
            fs.copyFileSync('app/scripts/update_standalone.js', 'temp/update_standalone.js');
            if (os.platform() == 'win32') {
                fs.writeFileSync('temp/update.bat', '@node\\node.exe temp\\update_standalone.js');
                child_process.spawn(__dirname + '/../../temp/update.bat', ['temp/update_standalone.js'], { detached: true });
            }
            else {
                fs.writeFileSync('temp/update.sh', '@node\\node temp\\update_standalone.js');
                child_process.spawn(__dirname + '/../../temp/update.sh', [], { detached: true });
            }
            process.exit();
        }, "updating WebMC");
    }
}

async function getLatestVersion(){
    const res = await fetch('https://webmc.ratcoder.com/bin/version.txt');
    const text = await res.text();
    return text;
}