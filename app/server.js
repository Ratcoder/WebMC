const pidusage = require('pidusage');
const schedule = require('node-schedule');
const fs = require('fs');


// ---------- MINECRAFT ----------
let mc = require('./minecraft')();
// ---------- WEBSITE ----------
require('./website')({
    mc
});