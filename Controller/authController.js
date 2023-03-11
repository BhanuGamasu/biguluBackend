const jwt = require('jwt-simple');
const configFile = require('../config');
const authModel = require('../Model/authModel')
const { ObjectId } = require('mongodb');
// const objectId = new mongo.ObjectId;


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
            let user = await req.mongoConnection.collection('users').find({email: req.decodeInfo.email}).toArray();
            console.log(req.decodeInfo, 76876);
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
                    views: 0,
                    userId: new ObjectId(req.decodeInfo._id)
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
            console.log(err, 382);
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
    },
    getActivityData: async (req, res) => {
        try{
            let {body, decodeInfo} = req;
            let data = {
                activityId: new ObjectId(body.activityId),
                userId: new ObjectId(decodeInfo._id),
            }
            let isViewUpdate = await authModel.checkViews(req.mongoConnection, data);
            if (!isViewUpdate[0].isMatched) {
                let updateData = {
                    data: {views: (isViewUpdate[0].views + 1)},
                    upsert: false,
                    match: {'_id': isViewUpdate[0]._id}
                }
                let updateViews = await authModel.updateSingleDoc(req.mongoConnection, 'activities', updateData)
            }
            let activity = await authModel.getActivityInfo(req.mongoConnection, data);
            res.status(200).send({success: true, code: 200, data: activity, message: 'success'})
        } catch (err) {
            console.log(err);
            res.status(500).send({success: false, code: 500, data: err, message: 'something went wrong'})
        }
    },
    updateActivity: async (req, res) => {
        try {
            let {body, decodeInfo} = req;
            let data = {
                activityId: new ObjectId(body.activityId),
                userId: new ObjectId(decodeInfo._id),
            }
            let isViewUpdate = await authModel.checkViews(req.mongoConnection, data);
            // if (isViewUpdate[0].isMatched) {
                let {key, value, activityId} = body;
                let updateDoc = {
                    // ...isViewUpdate[0].activityInfo[0],
                    match: {
                        visitorId: data.userId,
                        activityId: data.activityId,
                    },
                    data: {
                        [key]: value,
                        isVisitor: !isViewUpdate[0].isMatched, 
                    },
                    upsert: true
                }
                let updateViews = await authModel.updateSingleDoc(req.mongoConnection, 'activityVisitorData', updateDoc);
                // let visData = await authModel.findOne(req.mongoConnection, 'activityVisitorData', updateDoc.match )
                let activity = await authModel.getActivityInfo(req.mongoConnection, data);
                res.status(200).send({success: true, code: 200, data: activity, message: 'success'})
            // }
        } catch (err) {
            console.log(err);
            res.status(500).send({success: false, code: 500, data: err, message: 'something went wrong'})
        }
    }
}

module.exports = authController;