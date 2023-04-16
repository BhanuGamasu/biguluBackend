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
    checkUser: async (req, res) => {
        try {
            // let {user} = req.body;
            console.log();
            let user = await req.mongoConnection.collection('users').find({email: req.body.email}).limit(1).toArray();
            if (user.length > 0) {
                let Jwttoken = jwt.encode(user[0], configFile.secretKey);
                res.status(200).send({success: true, code: 200, data: Jwttoken, message: 'success'})
            } else {
                res.status(200).send({success: true, code: 200, data: 'new', message: 'success'})
            }
        } catch(err) {
            console.log(err, 122);
            res.send({success: false, code: 500, data: err, message: 'something went wrong'})
        }
    },
    createActivity: async (req, res) => {
        try {
            let activity = req.body;
            let user = await req.mongoConnection.collection('users').find({email: req.decodeInfo.email}).toArray();
            console.log(req.decodeInfo, 76876);
            if (user.length > 0){
                activity = Object.assign(activity, {dateTime: new Date(), userId: new ObjectId(req.decodeInfo._id), startDate: new Date(activity.startDate), endDate: new Date(activity.endDate)});
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
            console.log(isViewUpdate, body.activityId, decodeInfo._id);
            if (!isViewUpdate[0].isMatched) {
                let updateData = {
                    data: {views: (isViewUpdate[0].views + 1)},
                    upsert: false,
                    match: {'_id': isViewUpdate[0]._id}
                }
                let updateViews = await authModel.updateSingleDoc(req.mongoConnection, 'activities', updateData)
            }
            let activity = await authModel.getActivityInfo(req.mongoConnection, data);
            let updateDoc = {
                match: {
                    activityId: new ObjectId(body.activityId),
                    visitorId: new ObjectId(decodeInfo._id),
                },
                data: {
                    activityId: new ObjectId(body.activityId),
                    visitorId: new ObjectId(decodeInfo._id),
                    isVisitor: !isViewUpdate[0].isMatched,
                    lastSeen: new Date()
                },
                upsert: true
            }
            let updateLastSeen = await authModel.updateSingleDoc(req.mongoConnection, 'activityVisitorData', updateDoc);
            res.status(200).send({success: true, code: 200, data: activity, message: 'success'})
        } catch (err) {
            console.log(err);
            res.status(500).send({success: false, code: 500, data: err, message: 'something went wrong'})
        }
    },
    deleteActivity: async (req, res) => {
        try {
            let deleteUser = await req.mongoConnection.collection('activities').deleteOne({_id: new ObjectId(req.body.id)});
            if (deleteUser) {
                res.status(200).send({success: true, code: 200, data: deleteUser, message: 'success'})
            } else {
                res.status(400).send({success: false, code: 400, data: deleteUser, message: 'something went wrong'})
            }
        } catch (err) {
            console.log(err);
            res.status(500).send({success: false, code: 500, data: err, message: 'something went wrong'})
        }
    },
    getProfile: async (req, res) => {
        try {
            let user = await req.mongoConnection.collection('users').find({_id: new ObjectId(req.body.id)}).toArray();
            console.log(req.body.id, 76765);
            if (user.length > 0) {
                user = user[0];
                delete user.authentication;
                res.status(200).send({success: true, code: 200, data: user, message: 'success'})
            } else {
                res.status(400).send({success: false, code: 400, data: user, message: 'something went wrong'})
            }
        } catch(err) {
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
                if (key == 'joined') {
                    let inviteCount = isViewUpdate[0]?.inviteCount | 0;
                    updateDoc.match = {_id: data.activityId};
                    updateDoc.data = {inviteCount: value? inviteCount + 1: inviteCount - 1}
                    updateDoc.upsert = false;
                    if (value) {
                        updateDoc.data.inviteSendDate = new Date();
                    } else {
                        updateDoc.data.inviteCancelledDate = new Date();
                        updateDoc.data.inviteCancelledBy = 'self';
                    }
                    let updateCount = await authModel.updateSingleDoc(req.mongoConnection, 'activities', updateDoc);
                    // updateDoc.data.inviteCount = value? inviteCount + 1: inviteCount - 1;
                }
                // let visData = await authModel.findOne(req.mongoConnection, 'activityVisitorData', updateDoc.match )
                let activity = await authModel.getActivityInfo(req.mongoConnection, data);
                res.status(200).send({success: true, code: 200, data: activity, message: 'success'})
            // }
        } catch (err) {
            console.log(err);
            res.status(500).send({success: false, code: 500, data: err, message: 'something went wrong'})
        }
    },
    getInvites: async(req, res) => {
        try {
            let {body, decodeInfo} = req;
            let data = {
                activityId: new ObjectId(body.activityId),
                userId: new ObjectId(decodeInfo._id),
            }

            let getActivityInvites = await authModel.getInvitesInfo(req.mongoConnection, data);
            let acceptedCount = 0;
            let cancelledCount = 0;
            if (getActivityInvites.length) {
                getActivityInvites[0].activityInfo.forEach(element => {
                    if (element.accepted) {
                        acceptedCount += 1;
                    } else if (element.cancelled) {
                        cancelledCount += 1;
                    }
                });
                getActivityInvites[0].acceptedCount = acceptedCount;
                getActivityInvites[0].cancelledCount = cancelledCount;
                res.status(200).send({success: true, code: 200, data: getActivityInvites, message: 'success'})
            } else {
                res.status(400).send({success: true, code: 400, data: getActivityInvites, message: 'something went wrong'})
            }
            console.log(getActivityInvites, 565);
        } catch(err) {
            console.log(err);
            res.status(500).send({success: false, code: 500, data: err, message: 'something went wrong'})
        }
    }
}

module.exports = authController;