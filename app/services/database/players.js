const Datastore = require('nedb');
const fs = require('fs');
const util = require('util');

if(!fs.existsSync('db')) fs.mkdirSync('db');

const playerDatabase = new Datastore({ filename: 'db/players', autoload: true });

const players = {
    get(name){
        return new Promise((resolve, reject) => {
            playerDatabase.findOne({_id: name}, (err, doc) => {
                resolve(doc);
            });
        });
    },
    insert(player){
        return new Promise((resolve, reject) => {
            player._id = player.name;
            playerDatabase.insert(player, (err, newDoc) => {
                resolve(newDoc);
            });
        });
    },
    update(name, player){
        return new Promise((resolve, reject) => {
            playerDatabase.update({ _id: name }, player, {}, function (err, numReplaced) {
                resolve(numReplaced);
            });
        });
    },
    getAll(){
        return new Promise((resolve, reject) => {
            playerDatabase.find({}, (err, docs) => {
                resolve(docs || []);
            });
        });
    }
}

module.exports = players;