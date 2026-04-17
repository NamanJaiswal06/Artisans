'use strict';
/**
 * Unified Risk Score controllers — /v1/risk
 * Port of narip/api/routes_scoring.py
 */
const Metrics = require('../services/metrics');
const { getPipeline } = require('../services/pipeline');
const { getBroker }   = require('../services/incidentBroker');

exports.unifiedScore = async (req, res) => {
  const t0 = Date.now();
  try {
    const pipe = getPipeline();
    const { email, transaction, flows, otp, account, supply } = req.body;
    const result = pipe.runUnified({ email, transaction, flows: flows || [], otp, account, supply });
    Metrics.eventResult(true);
    res.json(result);
  } catch (err) {
    Metrics.eventResult(false);
    res.status(500).json({ error: err.message });
  } finally {
    Metrics.observeLatency('unified_score', (Date.now() - t0) / 1000);
  }
};

exports.unifiedScoreBatch = async (req, res) => {
  const t0 = Date.now();
  try {
    const pipe = getPipeline();
    const items = req.body.items || [];
    const out = items.map(item =>
      pipe.runUnified({
        email: item.email, transaction: item.transaction,
        flows: item.flows || [], otp: item.otp, account: item.account, supply: item.supply,
      })
    );
    Metrics.eventResult(true);
    res.json(out);
  } catch (err) {
    Metrics.eventResult(false);
    res.status(500).json({ error: err.message });
  } finally {
    Metrics.observeLatency('unified_score_batch', (Date.now() - t0) / 1000);
  }
};

exports.riskSnapshot = (req, res) => {
  try {
    const pipe = getPipeline();
    res.json(pipe.runUnified());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.scoreAndPublish = async (req, res) => {
  try {
    const pipe = getPipeline();
    const broker = getBroker();
    const { email, transaction, flows, otp, account, supply } = req.body;
    const result = pipe.runUnified({ email, transaction, flows: flows || [], otp, account, supply });
    let published = false;
    if (result.enterprise_risk_score >= 60) {
      await broker.publish('incident.high_risk', {
        score: result.enterprise_risk_score,
        audit_reference: result.audit_reference,
      });
      published = true;
    }
    res.json({ unified: result, published });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
