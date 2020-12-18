const jwt = require('jsonwebtoken');

/**
 * Checks if a user is allowed to make a request.
 * @param {string} cookie - The cookie header on the request.
 * @param {string} privateKey - The private key for JWT.
 * @returns {Promise<bool>} Wheather the user is authorized.
 */
module.exports = function authorize(cookie, privateKey){
    return new Promise((resolve, reject) => {
        try{
            const token = cookie.substring(4).split(';')[0];
            let passed = true;
            jwt.verify(token, privateKey, function(err, decoded) {
                if(err){
                    passed = false;
                }
                resolve(passed);
            });
        }
        catch{
            resolve(false);
        }
    });
}