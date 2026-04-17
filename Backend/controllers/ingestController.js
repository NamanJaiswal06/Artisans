'use strict';
const Metrics = require('../services/metrics');
const { getOrchestrator } = require('../services/ingestOrchestrator');
const { falconEventToCanonical } = require('../services/security/falcon');
const { splunkHecToCanonical }    = require('../services/security/cim');
const settings = require('../config/settings');

exports.ingestFalcon = async (req, res) => {
  const t0 = Date.now();
  try {
    const canonical = falconEventToCanonical(req.body);
    const result = await getOrchestrator().scoreCanonical(canonical);
    Metrics.ingest('falcon', true);
    res.json(result);
  } catch (err) {
    Metrics.ingest('falcon', false);
    res.status(500).json({ error: err.message });
  } finally {
    Metrics.observeLatency('ingest_falcon', (Date.now() - t0) / 1000);
  }
};

exports.ingestSplunk = async (req, res) => {
  const t0 = Date.now();
  try {
    // Validate Splunk HEC token if configured
    if (settings.splunkHecToken) {
      const expected = `Splunk ${settings.splunkHecToken}`;
      if (req.headers['authorization'] !== expected) {
        return res.status(401).json({ error: 'invalid or missing HEC token' });
      }
    }
    const canonical = splunkHecToCanonical(req.body);
    const result = await getOrchestrator().scoreCanonical(canonical);
    Metrics.ingest('splunk', true);
    res.json(result);
  } catch (err) {
    Metrics.ingest('splunk', false);
    res.status(500).json({ error: err.message });
  } finally {
    Metrics.observeLatency('ingest_splunk', (Date.now() - t0) / 1000);
  }
};

exports.normalizeFalcon = (req, res) => {
  try { res.json(falconEventToCanonical(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

exports.normalizeSplunk = (req, res) => {
  try { res.json(splunkHecToCanonical(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
};
