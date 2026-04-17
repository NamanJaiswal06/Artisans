'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/automationController');

router.get('/cases',                    ctrl.listCases);
router.get('/cases/:caseId',            ctrl.getCase);
router.post('/cases/:caseId/status',    ctrl.setCaseStatus);
router.get('/playbooks',                ctrl.listPlaybooks);
router.post('/playbooks/reload',        ctrl.reloadPlaybooks);

module.exports = router;
