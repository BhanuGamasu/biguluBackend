const auth = require('express').Router();
const authController = require('../Controller/authController');
const tokenValidator = require('../middleWares/verifyToken')

auth.post('/login', authController.login);
auth.post('/createActivity', tokenValidator.verify, authController.createActivity);
auth.get('/getAllActivities', tokenValidator.verify, authController.getAllActivities);
module.exports = auth;