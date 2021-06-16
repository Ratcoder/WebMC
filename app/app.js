const fs = require('fs');

const lc = "\x1b[32m";
const rc = "\x1b[0m";

const log = console.log;
function updateDisplay(status) {
    let statusTexts = {
        'online':        '│              online              │',
        'offline':       '│              offline             │',
        'restarting':    '│            restarting            │',
        'shutting-down': '│           shutting-down          │',
        'starting':      '│             starting             │'
    };

    log(`
        ${lc}┌──────────────────────────────────┐
        ${lc}│                                  │
        ${lc}│        ${rc}\x1b[1mWelcome to WebMC!${rc}${lc}         │
        ${lc}│                                  │
        ${lc}│   ${rc}WebMC is running at this url:${lc}  │
        ${lc}│      ${rc}https://localhost:14142${lc}     │
        ${lc}│                                  │
        ${lc}${statusTexts[status]}
        ${lc}│                                  │
        ${lc}└──────────────────────────────────┘`
    );
}

if (!process.argv.find('--dev')) {
    updateDisplay('offline');
    const Events = require('./services/events')
    Events.on('minecraft_status', status => {
        console.clear();
        updateDisplay(status);
    });
    console.log = () => {};
}
require('./server');
fs.readdirSync('./app/services').forEach(file => require('./services/' + file));