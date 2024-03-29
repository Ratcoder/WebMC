const fs = require('fs').promises;
const child_process = require('child_process');
const os = require('os');
const fetch = require('node-fetch');

(async () => {
    const platform = os.platform() == 'win32' ? 'win' : 'linux';
    const currentManifest = JSON.parse(await fs.readFile('manifest.json'));
    const newManifest = await (await fetch(`https://webmc.ratcoder.com/bin/latest-${platform}/manifest.json`)).json();
    async function diff(newFolder, oldFolder, rootPath = '', downloadFolder = false) {
        for (const key in newFolder) {
            if (Object.hasOwnProperty.call(newFolder, key)) {
                const file = newFolder[key];
                if (typeof file == "object") {
                    if (downloadFolder) {
                        await diff(file, null, rootPath + '/' + key, true);
                    }
                    else if (oldFolder[key] && typeof oldFolder[key] == "object") {
                        await diff(file, oldFolder[key], rootPath + '/' + key);
                    }
                    else {
                        await diff(file, null, rootPath + '/' + key, true);
                    }
                }
                else if (downloadFolder || !oldFolder[key] || oldFolder[key] != newFolder[key]) {
                    // download new file
                    console.log(`${rootPath}/${key}`);
                    await fs.writeFile(`${process.cwd()}${rootPath}/${key}`, await (await fetch(`https://webmc.ratcoder.com/bin/latest-${platform}${rootPath}/${key}`)).text());
                    console.log(`${rootPath}/${key}`);
                }
            }
        }
    }
    await diff(newManifest.files, currentManifest.files);
    await fs.writeFile('manifest.json', JSON.stringify(newManifest));
    await fs.rmdir('temp', { recursive: true });
    process.exit();
})()