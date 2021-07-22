const fs = require('fs');
const util = require('util');
const copyFile = util.promisify(fs.copyFile);
const mkdir =  util.promisify(fs.mkdir);
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const child_process = require('child_process');
const crypto = require('crypto');
const os = require('os');

// clear build folder
fs.rmdirSync('build', { recursive: true });
fs.mkdirSync('build');

child_process.execSync('npm i');
child_process.execSync('npm run build', { cwd: './svelte'});
(async () => {
    await Promise.allSettled([
        copyFolder('app', 'build/app'),
        copyFolder('svelte/public', 'build/public'),
        copyFolder('node_modules', 'build/node_modules'),
        os.platform() == 'win32' ? copyFile('start_webmc.bat', 'build/start_webmc.bat') : copyFile('start_webmc.sh', 'build/start_webmc.sh'),
        copyFile('package.json', 'build/package.json'),
        copyFile('package-lock.json', 'build/package-lock.json'),
        copyFile('LICENCE', 'build/LICENCE'),
        copyFile('README.md', 'build/README.md'),
    ]);
    writeFile('build/manifest.json', JSON.stringify({
        node: os.platform() == 'win32' ? 'https://nodejs.org/dist/v14.17.3/node-v14.17.3-win-x64.zip' : 'https://nodejs.org/dist/v14.17.3/node-v14.17.3-linux-x64.tar.xz',
        files: await checksumFolder('build'),
    }));
})()


async function copyFolder(source, dest) {
    await mkdir(dest);
    const files = await readdir(source);
    files.forEach(file => {
        if (fs.lstatSync(`${source}/${file}`).isDirectory()) {
            copyFolder(`${source}/${file}`, `${dest}/${file}`)
        }
        else {
            copyFile(`${source}/${file}`, `${dest}/${file}`);
        }
    });
}
async function checksumFolder(folder) {
    const tree = {};
    const files = await readdir(folder);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (fs.lstatSync(`${folder}/${file}`).isDirectory()) {
            tree[file] = await checksumFolder(`${folder}/${file}`);
        }
        else {
            const fileData = await readFile(`${folder}/${file}`);
            const md5 = crypto.createHash('md5').update(fileData).digest('hex');
            tree[file] = md5;
        }
    }
    return tree;
}