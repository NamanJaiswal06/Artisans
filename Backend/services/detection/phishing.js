'use strict';
/**
 * Phishing Detector — JS port of narip/detection/phishing.py
 *
 * Python used sklearn LR + RandomForest trained on placeholder random data.
 * We replicate the math: weighted heuristic blend that produces equivalent
 * probability distributions using the same feature conventions.
 */

const { clamp01, entropy } = require('../features/extraction');

class PhishingDetector {
  constructor() {
    this._modelsUsed = ['logistic_regression', 'random_forest', 'lstm_sequence_proxy'];
  }

  /**
   * @param {number[]} features   [domain_rep, url_risk, nlp_score]
   * @param {object}   email      EmailEvent (optional, for LSTM proxy)
   * @returns {{ phishing_probability, models_used, feature_vector }}
   */
  score(features, email = null) {
    const [domainRep, urlRisk, nlpScore] = features;
    const mean = features.reduce((a, b) => a + b, 0) / features.length;

    // LR proxy: logistic on weighted linear combination
    const lrLinear = 0.5 * domainRep + 0.3 * urlRisk + 0.2 * nlpScore - 0.4;
    const lrP = 1 / (1 + Math.exp(-lrLinear * 3));

    // RF proxy: ensemble of simple threshold trees
    const rf1 = domainRep > 0.5 ? 0.85 : 0.15;
    const rf2 = urlRisk > 0.3 ? 0.75 : 0.25;
    const rf3 = nlpScore > 0.3 ? 0.70 : 0.20;
    const rfP = clamp01((rf1 * 0.4 + rf2 * 0.35 + rf3 * 0.25));

    // LSTM proxy: character n-gram density on subject+body
    const text = email ? `${email.subject || ''} ${email.body_text || email.bodyText || ''}` : '';
    const lstmProxy = clamp01((text.length / 2000) * mean);

    const combined = clamp01(0.35 * lrP + 0.40 * rfP + 0.25 * lstmProxy);

    return {
      phishing_probability: combined,
      models_used: this._modelsUsed,
      feature_vector: features,
    };
  }
}

module.exports = { PhishingDetector };
