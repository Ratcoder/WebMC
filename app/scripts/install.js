const Database = require('../services/database');
const bcrypt = require('bcrypt');
const saltRounds = 10;

let admin = {name: process.argv[2], password: process.argv[3], level: 3};

bcrypt.hash(admin.password, saltRounds, async (err, hash) => {
    admin.password = hash;
    await Database.admins.insert(admin);
});