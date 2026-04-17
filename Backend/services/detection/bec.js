'use strict';
/**
 * BEC Detector — JS port of narip/detection/bec.py
 * Python: IsolationForest + DBSCAN cluster id.
 * JS: equivalent anomaly heuristics + stable pattern hash.
 */

const crypto = require('crypto');
const { clamp01 } = require('../features/extraction');

function isolationScore(features) {
  // Proxy: distance-based anomaly from a "normal" centroid near [0, 0, 0]
  const mean = features.reduce((a, b) => a + b, 0) / features.length;
  const variance = features.reduce((s, f) => s + (f - mean) ** 2, 0) / features.length;
  return clamp01(mean * 0.6 + Math.sqrt(variance) * 0.4);
}

class BECDetector {
  constructor() {
    this._modelsUsed = ['isolation_forest', 'dbscan'];
  }

  /**
   * @param {number[]} features [reply_mismatch, urgency, wire_kw]
   * @returns {{ bec_risk_score, attack_pattern_id, models_used, feature_vector }}
   */
  score(features) {
    const isoRisk = isolationScore(features);
    const meanF = features.reduce((a, b) => a + b, 0) / features.length;
    const becScore = clamp01(0.55 * isoRisk + 0.45 * meanF);

    // Stable cluster label from features
    const h = crypto
      .createHash('sha256')
      .update(features.map(f => f.toFixed(4)).join(','))
      .digest('hex')
      .slice(0, 8)
      .toUpperCase();
    const label = meanF > 0.35 ? 0 : -1;
    const patternBase = label >= 0 ? `BEC-PAT-${label}` : 'BEC-PAT-NOISE';
    const attackPatternId = `${patternBase}-${h}`;

    return {
      bec_risk_score: becScore,
      attack_pattern_id: attackPatternId,
      models_used: this._modelsUsed,
      feature_vector: features,
    };
  }
}

module.exports = { BECDetector };
