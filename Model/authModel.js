const { ObjectId } = require("mongodb");

let authModel = {
    getAllActivities: (conn, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log(data._id, 767);
                let activities = await conn.collection('activities').aggregate(
                    [
                        {
                            $match: { "startDate": { $gt: new Date() } }
                        },
                        {
                            $lookup: {
                                from: 'activityVisitorData',
                                let: {
                                    'actId': '$_id'
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ['$activityId', '$$actId'] },
                                                    { $eq: ['$visitorId', new ObjectId(data._id)] }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: 'visData'
                            }
                        },
                        {
                            $unwind: {
                                path: '$visData',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $sort: {
                                'dateTime': -1
                            }
                        }
                    ]
                ).toArray();
                resolve(activities);
            } catch (err) {
                reject(err);
            }
        })
    },
    getActivityInfo: (conn, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                let userInsert = await conn.collection("activities").aggregate(
                    [
                        {
                            $match: {
                                '_id': data.activityId
                            }
                        },
                        {
                            $lookup: {
                                from: "activityVisitorData",
                                pipeline: [
                                    {
                                        $match: {
                                            "visitorId": data.userId,
                                            "activityId": data.activityId
                                        }
                                    }
                                ],
                                as: 'userActions'
                            }
                        },
                        {
                            $addFields: { 'isVisitor': { $ne: [data.userId, '$userId'] } }
                        },
                        {
                            $unwind: {
                                path: '$userActions',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                let: { userId: '$userId' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$_id", "$$userId"],
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            'name': 1,
                                            'imageUrl': 1,
                                            'city': 1,
                                            'gender': 1,
                                            'age': 1,
                                            'mobile': 1
                                        },
                                    }
                                ],

                                as: "activityCreatedBy"
                            }
                        },
                        {
                            $unwind: {
                                path: '$activityCreatedBy',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                    ]
                ).toArray();
                resolve(userInsert);
            } catch (error) {
                reject(error);
            }
        });
    },
    checkViews: (conn, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                let check = await conn.collection('activities').aggregate(
                    [
                        {
                            $match: {
                                _id: data.activityId
                            }
                        },
                        {
                            $group: {
                                _id: '$_id',
                                views: { $first: '$views' },
                                isMatched: { $first: { $eq: ['$userId', data.userId] } },
                                inviteCount: { $first: '$inviteCount' },
                                activityInfo: { '$push': '$$ROOT' },
                            }
                        }
                    ]
                ).toArray()
                resolve(check);
            } catch (err) {
                reject(err)
            }
        })
    },
    updateSingleDoc: (conn, collectionName, updateData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let update = await conn.collection(collectionName).updateOne(updateData.match,
                    {
                        $set: updateData.data
                    },
                    {
                        upsert: updateData.upsert
                    }
                )
                resolve(update);
            } catch (err) {
                reject(err)
            }
        })
    },
    findOne: (conn, collectionName, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                let doc = await conn.collection(collectionName).findOne(data);
                resolve(doc);
            } catch (err) {
                reject(err)
            }
        })
    },
    getInvitesInfo: (conn, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                let invites = await conn.collection('activities').aggregate(
                    [
                        {
                            $match: {
                                "_id": data.activityId,
                                "startDate": { $gt: new Date() }
                            }
                        },
                        {
                            $lookup: {
                                from: "activityVisitorData",
                                let: { actId: '$_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            isVisitor: true,
                                            joined: true,
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$activityId", "$$actId"] },
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: 'users',
                                            let: { 'userId': '$visitorId' },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $eq: ['$_id', '$$userId']
                                                        }
                                                    }
                                                },
                                            ],
                                            as: 'userInfo'
                                        }
                                    }
                                ],
                                as: 'activityInfo'
                            }
                        },
                    ]
                ).toArray()
                resolve(invites)
            } catch (err) {
                reject(err)
            }
        })
    },

    getSearchData: (conn, collection, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                const query = [
                    {
                        $match: {
                            $expr: {
                                $or: [],
                            },
                            startDate: { $gte: new Date(), $lte: data.date },
                        }
                    },
                    {
                        $lookup: {
                            from: 'activityVisitorData',
                            let: {
                                'actId': '$_id'
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$activityId', '$$actId'] },
                                                { $eq: ['$visitorId', data._id] }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: 'visData'
                        }
                    },
                    {
                        $unwind: {
                            path: '$visData',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $sort: {
                            'dateTime': -1
                        }
                    }
                ]
                if (data.location !== "") {
                    query[0].$match['location.description'] = { '$regex': data.location, $options: 'i' };
                }
                if (data.count !== "") {
                    query[0].$match.$expr.$or.push({ $eq: ['$count', data.count] })
                }
                if (data.time !== "") {
                    query[0].$match.$expr.$or.push({ $eq: ['$timeFrame', data.time] })
                }
                if (data.age !== "") {
                    query[0].$match.$expr.$or.push({ $eq: ['$age', data.age] })
                }
                if (data.gender !== "") {
                    query[0].$match.$expr.$or.push({ $eq: ['$gender', data.gender] })
                }
                if (data.category !== "") {
                    query[0].$match.$expr.$or.push({ $eq: ['$activityType', data.category] })
                }
                if (data.activity !== "") {
                    query[0].$match.$expr.$or.push({ $eq: ['$activityName', data.activity] })
                }
                if (data.count == "single") {
                    query[0].$match.$expr.$or.push({ $lte: ['$count', 1] })
                } else {
                    query[0].$match.$expr.$or.push({ $gt: ['$count', 1] })
                }
                let searchData = await conn.collection(collection).aggregate(query).toArray();
                resolve(searchData);
            } catch (err) {
                reject(err);
            }
        })
    }
}

module.exports = authModel;