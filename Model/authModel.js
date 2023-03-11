let authModel = {
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
                                views: {$first: '$views'},
                                isMatched: {$first: {$eq: ['$userId', data.userId]}},
                                activityInfo: {'$push': '$$ROOT'}
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
        return new Promise( async (resolve, reject) => {
            try {
                let doc = await conn.collection(collectionName).findOne(data);
                resolve(doc);
            } catch (err) {
                reject(err)
            }
        })
    }
}

module.exports = authModel;