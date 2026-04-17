'use strict';
/**
 * ATO Detector — JS port of narip/detection/ato.py
 * Python: LSTM autoencoder proxy + IsolationForest.
 * JS: equivalent heuristic proxies.
 */

const { clamp01, entropy } = require('../features/extraction');

function isolationScore(features) {
  const mean = features.reduce((a, b) => a + b, 0) / features.length;
  const variance = features.reduce((s, f) => s + (f - mean) ** 2, 0) / features.length;
  return clamp01(mean * 0.6 + Math.sqrt(variance) * 0.4);
}

function lstmAutoencoderProxy(features) {
  // Sequence proxy: logistic on linear combination (same as train_placeholder_binary)
  const linear = features.reduce((a, b) => a + b, 0) / features.length - 0.35;
  return 1 / (1 + Math.exp(-linear * 4));
}

class ATODetector {
  constructor() {
    this._modelsUsed = ['lstm_autoencoder_proxy', 'isolation_forest'];
  }

  /**
   * @param {number[]} features [access_spike, priv, dev_change_proxy]
   */
  score(features) {
    const seqProxy = lstmAutoencoderProxy(features);
    const iso = isolationScore(features);
    const atoRisk = clamp01(0.5 * seqProxy + 0.5 * iso);
    const confidence = clamp01(0.55 + Math.abs(atoRisk - 0.5));
    return {
      ato_risk: atoRisk,
      confidence,
      models_used: this._modelsUsed,
      feature_vector: features,
    };
  }
}

module.exports = { ATODetector };
