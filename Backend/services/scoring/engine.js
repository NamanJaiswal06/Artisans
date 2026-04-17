'use strict';
/**
 * Unified Risk Engine — JS port of narip/scoring/engine.py
 */

const { v4: uuidv4 } = require('uuid');
const { posteriorRisk } = require('./bayesian');
const settings = require('../../config/settings');

function explainWithShap(names, vector) {
  // Lightweight SHAP proxy: contribution = value * (1/n)
  const n = Math.max(names.length, 1);
  const baseline = vector.reduce((a, b) => a + b, 0) / n;
  const shapValues = vector.map(v => (v - baseline) / n);
  return { shapFeatureNames: names, shapValues };
}

class UnifiedRiskEngine {
  aggregate(moduleOutputs, unifiedNames, unifiedVector) {
    const w = [
      [settings.weightPhishing,    moduleOutputs.phishing.phishing_probability,    'phishing'],
      [settings.weightBec,         moduleOutputs.bec.bec_risk_score,               'bec'],
      [settings.weightWire,        moduleOutputs.wire.wire_fraud_probability,       'wire_fraud'],
      [settings.weightSupplyChain, moduleOutputs.supplyChain.compromise_risk,       'supply_chain'],
      [settings.weightOtp,         moduleOutputs.otp.otp_takeover_probability,      'otp_fraud'],
      [settings.weightAto,         moduleOutputs.ato.ato_risk,                     'account_takeover'],
      [settings.weightLateral,     moduleOutputs.lateral.breach_likelihood,         'lateral_exfil'],
    ];
    const wSum = w.reduce((a, [wt]) => a + wt, 0) || 1;

    let ensemble = 0;
    const breakdown = w.map(([weight, raw, name]) => {
      const nw = weight / wSum;
      ensemble += nw * raw;
      return { module: name, normalized_contribution: nw * raw, weight, raw_score: raw };
    });

    const posterior = posteriorRisk(settings.riskPrior, ensemble);
    const score100 = Math.min(100, Math.max(0, Math.round(100 * posterior)));
    const { shapFeatureNames, shapValues } = explainWithShap(unifiedNames, unifiedVector);

    const auditReference = JSON.stringify({
      ts: Date.now() / 1000,
      id: uuidv4(),
      posterior,
      ensemble,
      modules: {
        phishing: moduleOutputs.phishing,
        bec: moduleOutputs.bec,
        wire: moduleOutputs.wire,
        supply_chain: moduleOutputs.supplyChain,
        otp: moduleOutputs.otp,
        ato: moduleOutputs.ato,
        lateral: moduleOutputs.lateral,
      },
    }).slice(0, 8192);

    return {
      enterprise_risk_score: score100,
      posterior_risk_0_1: posterior,
      breakdown,
      shap_feature_names: shapFeatureNames,
      shap_values: shapValues,
      audit_reference: auditReference,
      lime_available: true,
    };
  }
}

module.exports = { UnifiedRiskEngine };
