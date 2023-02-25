const jwt = require('jwt-simple');
const configFile = require('../config')

const verifyToken = {
    getToken: function(headers) {
        if (headers && headers.authorization) {
            var parted = headers.authorization.split(' ');
            console.log(parted, 'token');
            if (parted.length === 2) {
                return parted[1];
            } else {
                return null;
            }
        } else {
            return null;
        }
    },
    decodeToken: function(headers) {
        return new Promise(async(resolve, reject) => {
            try {
                let token = await this.getToken(headers);
                let decoded = await jwt.decode(token, configFile.secretKey);
                resolve(decoded);
            } catch (error) {
                resolve(false);
            }
        });
    }
}

module.exports = verifyToken;