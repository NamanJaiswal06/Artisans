'use strict';
const express = require('express');
const router = express.Router();
const Auth = require('../controllers/Auth');

router.post('/send-otp',  Auth.sendotp);
router.post('/signup',    Auth.signUphandler);
router.post('/login',     Auth.loginHandler);

module.exports = router;
