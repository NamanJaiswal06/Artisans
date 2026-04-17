'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/detectController');

// POST /v1/detect/phishing
router.post('/phishing',            ctrl.detectPhishing);
// POST /v1/detect/bec
router.post('/bec',                 ctrl.detectBEC);
// POST /v1/detect/wire-fraud
router.post('/wire-fraud',          ctrl.detectWireFraud);
// POST /v1/detect/supply-chain
router.post('/supply-chain',        ctrl.detectSupplyChain);
// POST /v1/detect/otp-fraud
router.post('/otp-fraud',           ctrl.detectOTPFraud);
// POST /v1/detect/account-takeover
router.post('/account-takeover',    ctrl.detectATO);
// POST /v1/detect/lateral-exfiltration
router.post('/lateral-exfiltration', ctrl.detectLateral);

module.exports = router;
