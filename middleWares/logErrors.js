

const logErrors = async (data) => {
    try {
        let log = await data.mongoConnection.collection('errors').insertOne(data.err, {upsert: false})
    } catch(err) {
        console.log(err, 'logErrors');
    }
}

module.exports = logErrors;