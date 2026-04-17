'use strict';
/**
 * OTP Fraud Detector — JS port of narip/detection/otp.py
 * Python: Autoencoder proxy (reconstruction error) + KNN.
 * JS: equivalent heuristics.
 */

const { clamp01 } = require('../features/extraction');

function autoencoderProxy(features) {
  // Reconstruction error: squared distance from origin (mean-centre proxy)
  const reconErr = features.reduce((s, f) => s + f * f, 0) / features.length;
  const lrLinear = features.reduce((a, b) => a + b, 0) / features.length - 0.3;
  const lrP = 1 / (1 + Math.exp(-lrLinear * 4));
  return clamp01(reconErr * 2 + lrP * 0.3);
}

function knnAnomalyScore(features) {
  // Distance to "normal" reference centroid at origin
  const dist = Math.sqrt(features.reduce((s, f) => s + f * f, 0));
  return clamp01(dist / (Math.sqrt(features.length) + 1e-9));
}

class OTPFraudDetector {
  constructor() {
    this._modelsUsed = ['autoencoder_reconstruction_proxy', 'knn'];
  }

  /**
   * @param {number[]} features [dwell_n, flight_n, geo, fp_entropy]
   */
  score(features) {
    const aeScore = autoencoderProxy(features);
    const knnS = knnAnomalyScore(features);
    const takeoverP = clamp01(0.45 * aeScore + 0.55 * knnS);
    const behavioralAnomaly = clamp01(0.6 * aeScore + 0.4 * knnS);
    return {
      otp_takeover_probability: takeoverP,
      behavioral_anomaly_score: behavioralAnomaly,
      models_used: this._modelsUsed,
      feature_vector: features,
    };
  }
}

module.exports = { OTPFraudDetector };
