const Datastore = require('nedb');

const adminDatabase = new Datastore({ filename: 'db/admins', autoload: true });
const admins = {
    get(name){
        return new Promise((resolve, reject) => {
            adminDatabase.findOne({_id: name}, (err, doc) => {
                resolve(doc);
            });
        });
    },
    insert(admin){
        return new Promise((resolve, reject) => {
            admin._id = admin.name;
            adminDatabase.insert(admin, (err, newDoc) => {
                resolve(newDoc);
            });
        });
    },
    update(name, admin){
        return new Promise((resolve, reject) => {
            adminDatabase.update({ _id: name }, admin, {}, function (err, numReplaced) {
                resolve(numReplaced);
            });
        });
    },
    getAll(){
        return new Promise((resolve, reject) => {
            adminDatabase.find({}, (err, docs) => {
                resolve(docs || []);
            });
        });
    },
    delete(name){
        return new Promise((resolve, reject) => {
            adminDatabase.remove({_id: name}, (err, numRemoved) => {
                resolve(numRemoved || []);
            });
        });
    }
}

module.exports = admins;