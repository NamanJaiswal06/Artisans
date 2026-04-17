'use strict';
/**
 * Detection module controllers — /v1/detect
 * Port of narip/api/routes_modules.py
 */
const Metrics = require('../services/metrics');
const { getPipeline } = require('../services/pipeline');

exports.detectPhishing = (req, res) => {
  try {
    Metrics.module('phishing');
    const pipe = getPipeline();
    const email = req.body;
    const f = pipe.features.phishingFromEmail(email);
    const result = pipe.phishingD.score(f, email);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.detectBEC = (req, res) => {
  try {
    Metrics.module('bec');
    const pipe = getPipeline();
    const f = pipe.features.becFromEmail(req.body);
    res.json(pipe.becD.score(f));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.detectWireFraud = (req, res) => {
  try {
    Metrics.module('wire_fraud');
    const pipe = getPipeline();
    const txn = req.body;
    const f = pipe.features.wireFromTransaction(txn);
    res.json(pipe.wireD.score(f, txn.sender_account || txn.senderAccount, txn.recipient_account || txn.recipientAccount));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.detectSupplyChain = (req, res) => {
  try {
    Metrics.module('supply_chain');
    const pipe = getPipeline();
    const signal = req.body;
    const f = pipe.features.supplyChain(signal);
    res.json(pipe.supplyD.score(f, signal));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.detectOTPFraud = (req, res) => {
  try {
    Metrics.module('otp_fraud');
    const pipe = getPipeline();
    const f = pipe.features.otpSession(req.body);
    res.json(pipe.otpD.score(f));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.detectATO = (req, res) => {
  try {
    Metrics.module('account_takeover');
    const pipe = getPipeline();
    const f = pipe.features.atoTelemetry(req.body);
    res.json(pipe.atoD.score(f));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.detectLateral = (req, res) => {
  try {
    Metrics.module('lateral_exfil');
    const pipe = getPipeline();
    const flows = req.body; // array
    const f = pipe.features.lateralFromFlows(flows);
    res.json(pipe.lateralD.score(f, flows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
