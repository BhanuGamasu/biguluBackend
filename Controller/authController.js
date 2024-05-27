const jwt = require('jwt-simple');
const configFile = require('../config');
const authModel = require('../Model/authModel')
const { ObjectId } = require('mongodb');
const { GridFSBucket } = require('mongodb');
const logErrors = require('../middleWares/logErrors')

// const objectId = new mongo.ObjectId;
var moment = require('moment')


const authController = {
    login: async (req, res) => {
        try {
            // const {email} = req.body;
            let insert;
            if (req.body._id) {
                delete req.body._id
                req.body.newUser = false;
                insert = await req.mongoConnection.collection('users').updateOne({ email: req.body.email }, { $set: req.body }, { upsert: false });
            } else {
                insert = await req.mongoConnection.collection('users').insertOne(req.body);
            }
            let inserted = await req.mongoConnection.collection('users').find({ email: req.body.email }).limit(1).toArray();
            let Jwttoken = jwt.encode(inserted[0], configFile.secretKey);
            console.log("testttt");
            if (insert) {
                res.status(200).send({ success: true, code: 200, data: Jwttoken, message: 'success' })
            } else {
                res.status(400).send({ success: false, code: 400, data: insert, message: 'something went wrong' })
            }
            // res.status(200).send({success: true, code: 200, data: email, message: 'success'})
        } catch (err) {
            console.log(err, 8787);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },
    checkUser: async (req, res) => {
        try {
            // let {user} = req.body;
            let user = await req.mongoConnection.collection('users').find({ email: req.body.email }).limit(1).toArray();
            if (user.length > 0) {
                let Jwttoken = jwt.encode(user[0], configFile.secretKey);
                res.status(200).send({ success: true, code: 200, data: { Jwttoken, data: user[0] }, message: 'success' })
            } else {
                req.body.newUser = true;
                let insertUser = await req.mongoConnection.collection('users').insertOne(req.body);
                let userData = await req.mongoConnection.collection('users').find({ _id: insertUser.insertedId }).toArray();
                let Jwttoken = jwt.encode(userData[0], configFile.secretKey);
                if (userData) {
                    res.status(200).send({ success: true, code: 200, data: { Jwttoken, data: userData[0] }, message: 'success' })
                } else {
                    res.status(400).send({ success: false, code: 400, data: insertUser, message: 'something went wrong' })
                }
            }
        } catch (err) {
            console.log(err, 122);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },
    createActivity: async (req, res) => {
        try {
            let activity = req.body;
            let user = await req.mongoConnection.collection('users').find({ email: req.decodeInfo.email }).toArray();
            let hours = new Date(activity.startDate).getHours();

            let timeFrame = ((6 <= hours) && (hours <= 11)) ? 'morning' : ((12 <= hours) && (hours <= 17)) ? 'afternoon' : ((18 <= hours) && (hours <= 5)) ? 'evening' : '';
            activity.timeFrame = timeFrame;
            activity.count = parseInt(activity.count)
            if (user.length > 0) {
                activity = Object.assign(activity, { activityCancelled: false, acceptedCount: 0, cancelledCount: 0, dateTime: new Date(), userId: new ObjectId(req.decodeInfo._id), startDate: new Date(activity.startDate), endDate: activity.endDate == "" ? "" : new Date(activity.endDate) });
                let insert = await req.mongoConnection.collection('activities').insertOne(activity);
                if (insert.acknowledged) {
                    let visData = {
                        "activityId": insert.insertedId,
                        "visitorId": new ObjectId(req.decodeInfo._id),
                        "isVisitor": false,
                        "lastSeen": new Date(),
                        "favorite": false
                    }
                    let insertVisData = await req.mongoConnection.collection('activityVisitorData').insertOne(visData);
                    if (insertVisData.acknowledged) {
                        res.status(200).send({ success: true, code: 200, user: req.decodeInfo, data: insert, message: 'success' })
                    } else {
                        res.status(400).send({ success: false, code: 400, data: insert, message: 'something went wrong' })
                    }
                } else {
                    res.status(400).send({ success: false, code: 400, data: insert, message: 'something went wrong' })
                }
            } else {
                res.status(400).send({ success: false, code: 400, data: user, message: 'something went wrong' })
            }
        } catch (err) {
            console.log(err, 382);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },

    editActivity: async (req, res) => {
        try {
            let activity = req.body;
            let id = new ObjectId(activity._id);
            delete activity._id
            activity.startDate = new Date(activity.startDate);
            activity.endDate = activity.endDate == "" ? "" : new Date(activity.endDate);
            let insert = await req.mongoConnection.collection('activities').updateOne({ _id: id }, { $set: activity });
            if (insert) {
                res.status(200).send({ success: true, code: 200, data: insert, message: 'success' })
            } else {
                res.status(400).send({ success: false, code: 400, data: insert, message: 'something went wrong' })
            }
        } catch (err) {
            console.log(err);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },

    getAllActivities: async (req, res) => {
        try {
            let activities = await authModel.getAllActivities(req.mongoConnection, req.decodeInfo);
            res.status(200).send({ success: true, code: 200, data: activities, message: 'success' })
        } catch (err) {
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },
    getActivityData: async (req, res) => {
        try {
            let { body, decodeInfo } = req;
            let data = {
                activityId: new ObjectId(body.activityId),
                userId: new ObjectId(decodeInfo._id),
            }
            let isViewUpdate = await authModel.checkViews(req.mongoConnection, data);
            if (!isViewUpdate[0].isMatched) {
                let updateData = {
                    data: { views: (isViewUpdate[0].views + 1) },
                    upsert: false,
                    match: { '_id': isViewUpdate[0]._id }
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
            res.status(200).send({ success: true, code: 200, data: activity, message: 'success' })
        } catch (err) {
            console.log(err);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },
    deleteActivity: async (req, res) => {
        try {
            let deleteUser = await req.mongoConnection.collection('activities').updateOne({ _id: new ObjectId(req.body.id) }, { $set: { activityCancelled: true } }, { upsert: false });
            if (deleteUser) {
                res.status(200).send({ success: true, code: 200, data: deleteUser, message: 'success' })
            } else {
                res.status(400).send({ success: false, code: 400, data: deleteUser, message: 'something went wrong' })
            }
        } catch (err) {
            console.log(err);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },

    getProfileInfo: async (req, res) => {
        try {

            res.status(200).send({ success: true, code: 200, data: req.decodeInfo, message: 'success' })
        } catch (err) {
            console.log(err);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },
    storeToGridfs: async (req, res, next) => {
        try {
            let { decodeInfo, body } = req;
            const bucket = new GridFSBucket(req.mongoConnection);
            if (decodeInfo.gridfsId) {
                bucket.delete(new ObjectId(decodeInfo.gridfsId), (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                        return;
                    }
                });
            }
            const binaryData = Buffer.from(body.data, 'base64');
            const uploadStream = bucket.openUploadStream('file.txt');
            uploadStream.end(binaryData)
                .on('finish', savedFile => {
                    savedFile['isLink'] = false;
                    let updateUser = req.mongoConnection.collection('users').updateOne({ _id: new ObjectId(decodeInfo._id) }, { $set: { gridfsId: savedFile._id } })
                        .then((file) => {
                            req.gridfsFile = savedFile;
                            res.status(200).send({ success: true, code: 200, gridfsId: savedFile._id });
                        })
                        .catch(err => {
                            return res.status(400).send({ success: false, code: 400, error: err });
                        })
                })
        } catch (err) {
            console.log(err, 676);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'Invalid Authorization' })
        }
    },
    getImage: async (req, res) => {
        try {
            let { gridfsId, body } = req;
            const bucket = new GridFSBucket(req.mongoConnection);
            let buffers = [];
            bucket.openDownloadStream(new ObjectId(body.gridfsId))
                .on('data', chunk => {
                    buffers.push(chunk)
                })
                .on('end', () => {
                    let fbuf = Buffer.concat(buffers);
                    let base64 = fbuf.toString("base64");
                    const finalFileObject = {
                        data: base64
                    }
                    res.status(200).send({ success: true, code: 200, data: finalFileObject, message: 'success' })
                })
        } catch (err) {
            console.log(err);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },
    getCustomActivities: async (req, res) => {
        try {
            let { decodeInfo, body } = req;
            let matchQuery = { "visitorId": new ObjectId(decodeInfo._id), }
            let date = {
                $lte: ["$startDate", new Date()]
            };
            if (body.type == 'cancelled') {
                matchQuery["isVisitor"] = false;
                date = {
                    $lte: ["$startDate", new Date()]
                };
            } else if (body.type == 'favorite') {
                matchQuery["favorite"] = true;
            } else {
                matchQuery["isVisitor"] = false;
            }
            let match = { matchQuery, date }
            let activities = await authModel.getCustomActivity(req.mongoConnection, 'activityVisitorData', match);
            res.status(200).send({ success: true, code: 200, activities, message: 'success' })
        } catch (err) {
            console.log(err);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },
    getProfile: async (req, res) => {
        try {
            let user = await req.mongoConnection.collection('users').find({ _id: new ObjectId(req.body.id) }).toArray();
            if (user.length > 0) {
                user = user[0];
                delete user.authentication;
                res.status(200).send({ success: true, code: 200, data: user, message: 'success' })
            } else {
                res.status(400).send({ success: false, code: 400, data: user, message: 'something went wrong' })
            }
        } catch (err) {
            console.log(err);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },
    updateActivity: async (req, res) => {
        try {
            let { body, decodeInfo } = req;
            let data = {
                activityId: new ObjectId(body.activityId),
                userId: new ObjectId(decodeInfo._id),
            }
            let { key, value, activityId } = body;
            let isViewUpdate = await authModel.checkViews(req.mongoConnection, data);
            if (isViewUpdate[0].isMatched || key == 'favorite') {
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
                res.status(200).send({ success: true, code: 200, data: activity, message: 'success' })
            } else {
                let inviteCount = isViewUpdate[0]?.inviteCount | 0;
                let updateDoc = {};
                updateDoc.match = { _id: data.activityId };
                updateDoc.data = { inviteCount: value ? inviteCount + 1 : inviteCount - 1 }
                updateDoc.upsert = false;
                let updateCount = await authModel.updateSingleDoc(req.mongoConnection, 'activities', updateDoc);
                let updateVisData = {};
                updateVisData.match = { activityId: data.activityId, visitorId: data.userId }
                if (value) {
                    updateVisData.data = { inviteSendDate: new Date(), inviteSent: value, joined: false, status: 'pending' };
                } else {
                    updateVisData.data = { inviteCancelledDate: new Date(), inviteSent: false, joined: false, status: 'selfCancelled' };
                }
                updateVisData.upsert = false;
                let updateVisInfo = await authModel.updateSingleDoc(req.mongoConnection, 'activityVisitorData', updateVisData);
                let activity = await authModel.getActivityInfo(req.mongoConnection, data);
                res.status(200).send({ success: true, code: 200, data: activity, message: 'success' })
                // updateDoc.data.inviteCount = value? inviteCount + 1: inviteCount - 1;
            }
        } catch (err) {
            console.log(err);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },
    getInvites: async (req, res) => {
        try {
            let { body, decodeInfo } = req;
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
                res.status(200).send({ success: true, code: 200, data: getActivityInvites, message: 'success' })
            } else {
                res.status(400).send({ success: true, code: 400, data: getActivityInvites, message: 'something went wrong' })
            }
        } catch (err) {
            console.log(err);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },
    updateAcceptInfo: async (req, res) => {
        try {
            let { type, value, visitorId, activityId } = req.body;
            let activity = await req.mongoConnection.collection('activities').findOne({ _id: new ObjectId(activityId) });
            let visActivityData = await req.mongoConnection.collection('activityVisitorData').findOne({ visitorId: new ObjectId(visitorId), activityId: new ObjectId(activityId) });
            if (value) {
                let acceptedCount = activity.acceptedCount + 1;
                let updateVisData = {};
                updateVisData.match = { visitorId: new ObjectId(visitorId), activityId: new ObjectId(activityId) };
                updateVisData.data = {
                    joined: type == 'accept',
                    acceptedDate: new Date(),
                    status: 'Accepted',
                    cancelledByMaster: false,
                },
                    updateVisData.upsert = false;
                let updateVisInfo = await authModel.updateSingleDoc(req.mongoConnection, 'activityVisitorData', updateVisData);
                if (updateVisInfo) {
                    let updateDoc = {};
                    updateDoc.match = { _id: new ObjectId(activityId) };
                    updateDoc.data = { acceptedCount: acceptedCount };
                    updateDoc.upsert = false;
                    let updateInfo = await authModel.updateSingleDoc(req.mongoConnection, 'activities', updateDoc);
                    if (updateInfo) {
                        let sendData = await req.mongoConnection.collection('activityVisitorData').findOne({ visitorId: new ObjectId(visitorId), activityId: new ObjectId(activityId) });
                        res.status(200).send({ success: true, code: 200, data: sendData, message: 'success' })
                    } else {
                        res.status(400).send({ success: false, code: 400, data: updateInfo, message: 'something went wrong' })
                    }
                } else {
                    res.status(400).send({ success: false, code: 400, data: updateVisInfo, message: 'something went wrong' })
                }
            } else {
                let acceptedCount = visActivityData.accepted ? activity.acceptedCount - 1 : activity.acceptedCount;
                let cancelledCount = activity.cancelledCount + 1;
                let updateDoc = {};
                updateDoc.match = { _id: new ObjectId(activityId) };
                updateDoc.data = { acceptedCount: acceptedCount, cancelledCount: cancelledCount };
                updateDoc.upsert = false;
                let updateInfo = await authModel.updateSingleDoc(req.mongoConnection, 'activities', updateDoc);
                if (updateInfo) {
                    let updateVisData = {};
                    updateVisData.match = { visitorId: new ObjectId(visitorId), activityId: new ObjectId(activityId) };
                    updateVisData.data = {
                        joined: false,
                        cancelledByMaster: type == 'reject',
                        cancelledDate: new Date(),
                        status: 'Rejected',
                    },
                        updateVisData.upsert = false;
                    let updateVisInfo = await authModel.updateSingleDoc(req.mongoConnection, 'activityVisitorData', updateVisData);
                    if (updateVisInfo) {
                        let sendData = await req.mongoConnection.collection('activityVisitorData').findOne({ visitorId: new ObjectId(visitorId), activityId: new ObjectId(activityId) });
                        res.status(200).send({ success: true, code: 200, data: sendData, message: 'success' })
                    } else {
                        res.status(400).send({ success: false, code: 400, data: updateVisInfo, message: 'something went wrong' })
                    }
                } else {
                    res.status(400).send({ success: false, code: 400, data: updateInfo, message: 'something went wrong' })
                }
            }
        } catch (err) {
            console.log(err);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },
    acceptInfo: async (req, res) => {
        try {
            let { visitorId, activityId } = req.body;
            let sendData = await req.mongoConnection.collection('activityVisitorData').findOne({ visitorId: new ObjectId(visitorId), activityId: new ObjectId(activityId) });
            res.status(200).send({ success: true, code: 200, data: sendData, message: 'success' })
        } catch (err) {
            console.log(err);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    },

    getFilterData: async (req, res) => {
        try {
            let body = req.body;
            let date;
            let start = new Date()
            switch (body.date) {
                case 'tomorrow':
                    date = moment();
                    let date2 = moment()
                    start = date2.set({ date: date2.get('date') + 1, hour: 0, minute: 0, second: 0, millisecond: 0, })
                    start = new Date(start)
                    date = date.set({ date: date.get('date') + 2, hour: 0, minute: 0, second: 0, millisecond: 0, })
                    break;
                case 'week':
                    date = moment().day(8);
                    date = date.set({ hour: 0, minute: 0, second: 0, millisecond: 0, })
                    break;
                case 'month':
                    date = moment();
                    date = date.set({ date: date.get('date') + 30, hour: 0, minute: 0, second: 0, millisecond: 0, })
                    break;
                default:
                    date = moment();
                    date = date.set({ hour: 23, minute: 59, second: 59, millisecond: 999, })
                    break;
            }
            body.start = start;
            body.date = new Date(date);
            body._id = req.decodeInfo._id;
            let updateVisInfo = await authModel.getSearchData(req.mongoConnection, 'activities', body);
            res.status(200).send({ success: true, code: 200, data: updateVisInfo, message: 'success' });
        } catch (err) {
            console.log(err, 6363);
            await logErrors({ mongoConnection: req.mongoConnection, err });
            res.status(500).send({ success: false, code: 500, data: err, message: 'something went wrong' })
        }
    }
}

module.exports = authController;