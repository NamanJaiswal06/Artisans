'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/integrationsController');

router.get('/adapters',                    ctrl.adaptersList);
router.get('/adapters/:name/health',       ctrl.adapterHealth);
router.post('/adapters/:name/ingest',      ctrl.adapterIngest);

module.exports = router;
