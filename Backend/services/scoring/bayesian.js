'use strict';
/**
 * Bayesian update — port of narip/scoring/bayesian.py
 */

/**
 * Combine prior P(bad) with module likelihood using Bayesian odds update.
 * @param {number} prior   base rate (0–1)
 * @param {number} likelihoodRisk  ensemble output (0–1)
 * @returns {number} posterior (0–1)
 */
function posteriorRisk(prior, likelihoodRisk) {
  const p = Math.max(1e-6, Math.min(1 - 1e-6, prior));
  const l = Math.max(1e-6, Math.min(1 - 1e-6, likelihoodRisk));
  const odds = p / (1 - p);
  const bf = l / (1 - l + 1e-9);
  const postOdds = odds * bf;
  const postP = postOdds / (1 + postOdds);
  return Math.max(0, Math.min(1, postP));
}

module.exports = { posteriorRisk };
