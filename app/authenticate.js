const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Database = require('./services/database');

/**
 * Tries to log a user in.
 * @param {string} body - The body of the http request that was sent.
 * @param {string} privateKey - The private key used for JWT.
 * @param {Map} Admins - A map of admins with names as keys and passwords as values.
 * @returns {Promise<string>} Returns a promise that gives the JWT token on successful login. On a failed login, the promise throws an error.
 */
module.exports = function authenticate(body, privateKey){
    return new Promise((resolve, reject) => {
        let data;
        try{
            data = JSON.parse(body);
        }
        catch{
            reject('Invalid body.')
        }

        Database.admins.get(data.name)
            .then(admin => {
                if(!admin || !data.password) {
                    bcrypt.compare(data.password, 'password', () => {
                        reject('Name or password incorrect.')
                    });
                    return;
                }

                bcrypt.compare(data.password, admin.password, (err, result) => {
                    if(err || !result) reject('Name or password incorrect.');

                    jwt.sign({ name: data.name, level: admin.level }, privateKey, { expiresIn: 1000*60*30 }, function(err, token) {
                        if(err) reject(err);
                        resolve(token);
                    });
                });
            });
    });
}