const auth = require('express').Router();
const authController = require('../Controller/authController');
const tokenValidator = require('../middleWares/verifyToken')

auth.post('/login', authController.login);
auth.post('/checkUser', authController.checkUser)
auth.post('/createActivity', tokenValidator.verify, authController.createActivity);
auth.post('/getAcivityInfo', tokenValidator.verify, authController.getActivityData);
auth.post('/deleteActivity', tokenValidator.verify, authController.deleteActivity);
auth.post('/getProfile', tokenValidator.verify, authController.getProfile);
auth.post('/updateActivity', tokenValidator.verify, authController.updateActivity);
auth.get('/getAllActivities', tokenValidator.verify, authController.getAllActivities);
auth.post('/invites', tokenValidator.verify, authController.getInvites);
auth.post('/acceptInfo', tokenValidator.verify, authController.acceptInfo);
auth.post('/updateAcceptInfo', tokenValidator.verify, authController.updateAcceptInfo);
auth.post('/getFilterData', tokenValidator.verify, authController.getFilterData);


module.exports = auth;