const child_process = require('child_process');
const fs = require('fs');
const os = require('os');

child_process.execSync('npm i');
child_process.execSync('npm i', { cwd: './svelte'});
child_process.execSync('npm run build', { cwd: './svelte'});
fs.writeFileSync('.uninstalled', '0');

if (os.platform() == 'win32') {
    child_process.execSync('curl --output ./build/nodetemp.zip https://nodejs.org/dist/v14.16.1/node-v14.16.1-win-x64.zip');
    child_process.execSync('powershell.exe -NoP -NonI -Command "Expand-Archive -Force \'./build/nodetemp.zip\' \'./build/nodetemp/\'"');
    child_process.execSync('move ".\\build\\nodetemp\\node-v14.16.1-win-x64" ".\\build\\node"');
    child_process.execSync('rmdir build\\nodetemp');
    child_process.execSync('del build\\nodetemp.zip');
    child_process.execSync('powershell.exe -NoP -NonI -Command "Compress-Archive -Force \'./build/*\' \'./build/dist.zip\'"');
}
else {
    child_process.execSync('curl --output nodetemp.tar.xz https://nodejs.org/dist/v14.17.0/node-v14.17.0-linux-x64.tar.xz');
    child_process.execSync('mkdir nodetemp');
    child_process.execSync('tar xf nodetemp.tar.xz -C nodetemp');
    child_process.execSync('mkdir node');
    child_process.execSync('mv nodetemp/node-v14.17.0-linux-x64/* node');
    child_process.execSync('rm -r nodetemp');
    child_process.execSync('rm nodetemp.tar.xz');
}