'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/incidentsController');

router.get('/recent', ctrl.recentIncidents);

module.exports = router;
