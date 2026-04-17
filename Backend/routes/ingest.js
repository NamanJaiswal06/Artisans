'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ingestController');

router.post('/falcon/event',         ctrl.ingestFalcon);
router.post('/splunk/hec',           ctrl.ingestSplunk);
router.post('/normalize/falcon',     ctrl.normalizeFalcon);
router.post('/normalize/splunk',     ctrl.normalizeSplunk);

module.exports = router;
