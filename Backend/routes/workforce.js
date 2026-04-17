'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workforceController');

router.post('/profiles',              ctrl.upsertProfile);
router.get('/profiles/:employeeId',   ctrl.getProfile);
router.post('/phishing/assess',       ctrl.assessPhishing);
router.post('/phishing/simulation',   ctrl.recordSimulation);
router.get('/dashboard/summary',      ctrl.dashboardSummary);
router.get('/roles/taxonomy',         ctrl.rolesTaxonomy);
router.get('/audit/logs',             ctrl.auditLogs);
router.get('/events/recent',          ctrl.recentEvents);

module.exports = router;
