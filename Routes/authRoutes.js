const auth = require('express').Router();
const authController = require('../Controller/authController');

auth.post('/login', authController.login);
auth.post('/createActivity', authController.createActivity);
auth.get('/getAllActivities', authController.getAllActivities);
module.exports = auth;