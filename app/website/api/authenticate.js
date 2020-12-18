const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * Tries to log a user in.
 * @param {string} body - The body of the http request that was sent.
 * @param {string} privateKey - The private key used for JWT.
 * @param {Map} Admins - A map of admins with names as keys and passwords as values.
 * @returns {Promise<string>} Returns a promise that gives the JWT token on successful login. On a failed login, the promise throws an error.
 */
module.exports = function authenticate(body, privateKey, admins){
    return new Promise((resolve, reject) => {
        let data;
        try{
            data = JSON.parse(body);
        }
        catch{
            reject('Invalid body.')
        }
        
        let passwordHash = admins.get(data.name);
        if(!passwordHash || !data.password) reject('Name or password incorrect.')

        bcrypt.compare(data.password, passwordHash, function(err, result) {
            if(err || !result) reject('Name or password incorrect.');

            jwt.sign({ name: data.name }, privateKey, { expiresIn: 1000*60*30 }, function(err, token) {
                if(err) reject(err);
                resolve(token);
            });
        });
    });
}