'use strict';
/**
 * Supply Chain Detector — JS port of narip/detection/supply_chain.py
 * Python: OneClassSVM + IsolationForest.
 * JS: outlier heuristic proxies.
 */

const { clamp01 } = require('../features/extraction');

function isolationScore(features) {
  const mean = features.reduce((a, b) => a + b, 0) / features.length;
  const variance = features.reduce((s, f) => s + (f - mean) ** 2, 0) / features.length;
  return clamp01(mean * 0.6 + Math.sqrt(variance) * 0.4);
}

function oneClassSvmProxy(features) {
  // Sigmoid-based distance from "normal" cluster at origin
  const distSq = features.reduce((s, f) => s + f * f, 0);
  const score = -distSq; // SVM score_samples: more negative = more outlier
  return 1 / (1 + Math.exp(score)); // oc_n: lower SVM score → higher risk
}

class SupplyChainDetector {
  constructor() {
    this._modelsUsed = ['one_class_svm', 'isolation_forest'];
  }

  /**
   * @param {number[]} features [version_changed, traffic_anomaly, egress_ratio_n]
   * @param {object}   signal   SupplyChainSignal
   */
  score(features, signal = null) {
    const iso = isolationScore(features);
    const ocN = oneClassSvmProxy(features);
    const risk = clamp01(0.5 * iso + 0.5 * ocN);

    const affected = [];
    if (signal && signal.version_old !== signal.version_new && signal.version_old && signal.version_new) {
      affected.push(signal.component_id || signal.componentId);
    }
    if (risk > 0.55) {
      affected.push(`vendor_egress_anomaly:${signal ? (signal.component_id || signal.componentId || 'unknown') : 'unknown'}`);
    }

    return {
      compromise_risk: risk,
      affected_components: [...new Set(affected)],
      models_used: this._modelsUsed,
      feature_vector: features,
    };
  }
}

module.exports = { SupplyChainDetector };
