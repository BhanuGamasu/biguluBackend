const {MongoClient} = require('mongodb');
const configUrl = require('./config');

module.exports = async function() {
    return new Promise(async(resolve, reject) => {
        connect().then((database) => {
            console.log('db connected');
            resolve(database);
        }).catch(err => {
            reject(err)
        })
    });
}

connect = async () => {
    let databaseName = "bigulu";
    // if (configUrl.mode != "prod") {
    //     databaseName = "stagingWahr";
    // }
    console.log(databaseName,configUrl.db_url, 13);
    var conn = await MongoClient.connect(configUrl.db_url)
    return conn.db(databaseName)
    // return new Promise((resolve, reject) => {
    //     MongoClient.connect(configUrl.db_url, { useNewUrlParser: true, useUnifiedTopology: true }, async(err, client) => {
    //         if (err) {
    //             console.log(err);
    //             resolve(false)
    //             process.exit(1);
    //         } else {
    //             mongoConnection = client.db(databaseName);
    //             console.log(mongoConnection, '999');
    //             resolve(mongoConnection);
                
    //         }
    //     });
    // });
}

// connect mongodb in node js?
