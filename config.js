require('dotenv').config();

module.exports = {
    db_url: process.env.ENV_db_url,
    port: process.env.ENV_port
}

