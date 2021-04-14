const Datastore = require('nedb');
const fs = require('fs');
const util = require('util');

if(!fs.existsSync('db')) fs.mkdirSync('db');

const playerDatabase = new Datastore({ filename: 'db/players', autoload: true });

const players = {
    get(xuid){
        return new Promise((resolve, reject) => {
            playerDatabase.findOne({_id: xuid}, (err, doc) => {
                resolve(doc);
            });
        });
    },
    insert(player){
        return new Promise((resolve, reject) => {
            player._id = player.xuid;
            playerDatabase.insert(player, (err, newDoc) => {
                resolve(newDoc);
            });
        });
    },
    update(xuid, player){
        return new Promise((resolve, reject) => {
            playerDatabase.update({ _id: xuid }, player, {}, function (err, numReplaced) {
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