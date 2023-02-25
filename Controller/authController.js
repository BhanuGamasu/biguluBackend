const jwt = require('jwt-simple');
const configFile = require('../config');


const authController = {
    login: async (req, res) => {
        try{
            // const {email} = req.body;
            console.log(req.body);
            let insert = await req.mongoConnection.collection('users').insertOne(req.body);
            let inserted = await req.mongoConnection.collection('users').find({email: req.body.email}).limit(1).toArray();
            let Jwttoken = jwt.encode(inserted[0], configFile.secretKey);
            if (insert) {
                res.status(200).send({success: true, code: 200, data: Jwttoken, message: 'success'})
            } else {
                res.status(400).send({success: false, code: 400, data: insert, message: 'something went wrong'})
            }
            console.log(req.body, 7676);
            // res.status(200).send({success: true, code: 200, data: email, message: 'success'})
        } catch(err) {
            console.log(err, 8787);
            res.send({success: false, code: 500, data: err, message: 'something went wrong'})
        }
    },
    createActivity: async (req, res) => {
        try {
            let {data, location, activityType, date, time, genderChoice, age, maxPeople, aboutActivity} = req.body;
            let user = await req.mongoConnection.collection('users').find({email: data.email}).toArray();
            if (user.length > 0){
                let activity = {
                    location,
                    activityType,
                    date,
                    time,
                    dateTime: new Date(),
                    genderChoice,
                    age,
                    maxPeople,
                    aboutActivity,
                    userId: user[0]._id
                }
                let insert = await req.mongoConnection.collection('activities').insertOne(activity);
                console.log(insert, 4343);
                if (insert) {
                    res.status(200).send({success: true, code: 200, user: req.decodeInfo, data: insert, message: 'success'})
                }else {
                    res.status(400).send({success: false, code: 400, data: insert, message: 'something went wrong'})
                }
            } else {
                console.log(user, data, 34242);
                res.status(400).send({success: false, code: 400, data: user, message: 'something went wrong'})
            }
        } catch(err) {

            res.status(500).send({success: false, code: 500, data: err, message: 'something went wrong'})
        }
    },

    getAllActivities: async (req, res) => {
        try {
            let activities = await req.mongoConnection.collection('activities').find({}).toArray();
            res.status(200).send({success: true, code: 200, data: activities, message: 'success'})
        } catch(err) {
            res.status(500).send({success: false, code: 500, data: err, message: 'something went wrong'})
        }
    }
}

module.exports = authController;