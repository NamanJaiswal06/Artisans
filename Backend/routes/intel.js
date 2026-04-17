'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/intelController');

router.post('/indicators', ctrl.loadIndicators);

module.exports = router;
