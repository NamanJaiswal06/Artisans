'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/riskController');

router.post('/score',               ctrl.unifiedScore);
router.post('/score/batch',         ctrl.unifiedScoreBatch);
router.get('/snapshot',             ctrl.riskSnapshot);
router.post('/score/publish-incident', ctrl.scoreAndPublish);

module.exports = router;
