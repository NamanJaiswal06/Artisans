'use strict';

require('dotenv').config();

const settings = {
  appName: process.env.NARIP_APP_NAME || 'NARIP API',
  debug: process.env.NARIP_DEBUG === 'true',

  // Module weights for unified score (normalised inside engine)
  weightPhishing:    parseFloat(process.env.NARIP_WEIGHT_PHISHING     || '0.14'),
  weightBec:         parseFloat(process.env.NARIP_WEIGHT_BEC          || '0.14'),
  weightWire:        parseFloat(process.env.NARIP_WEIGHT_WIRE         || '0.15'),
  weightSupplyChain: parseFloat(process.env.NARIP_WEIGHT_SUPPLY_CHAIN || '0.12'),
  weightOtp:         parseFloat(process.env.NARIP_WEIGHT_OTP          || '0.13'),
  weightAto:         parseFloat(process.env.NARIP_WEIGHT_ATO          || '0.14'),
  weightLateral:     parseFloat(process.env.NARIP_WEIGHT_LATERAL      || '0.18'),

  // Bayesian prior for enterprise risk (0–1)
  riskPrior: parseFloat(process.env.NARIP_RISK_PRIOR || '0.05'),

  // Splunk HEC optional token
  splunkHecToken: process.env.NARIP_SPLUNK_HEC_TOKEN || null,

  // CrowdStrike Falcon stream verification secret (optional)
  falconStreamSecret: process.env.NARIP_FALCON_STREAM_SECRET || null,
};

module.exports = settings;
