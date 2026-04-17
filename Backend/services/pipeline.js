'use strict';
/**
 * Detection Pipeline — orchestrates all 7 detectors + unified risk engine.
 * JS port of narip/services/pipeline.py
 */

const { FeatureExtractor } = require('./features/extraction');
const { PhishingDetector }    = require('./detection/phishing');
const { BECDetector }         = require('./detection/bec');
const { WireFraudDetector }   = require('./detection/wireFraud');
const { SupplyChainDetector } = require('./detection/supplyChain');
const { OTPFraudDetector }    = require('./detection/otpFraud');
const { ATODetector }         = require('./detection/ato');
const { LateralMovementDetector } = require('./detection/lateral');
const { UnifiedRiskEngine }   = require('./scoring/engine');

/* ── default event stubs (same as Python _default_* methods) ─── */
const DEFAULT_EMAIL = {
  message_id: 'na', sender: 'user@internal.local',
  subject: '', body_text: '', urls: [], headers: {},
};
const DEFAULT_TXN = {
  txn_id: 'na', amount: 0, currency: 'USD',
  sender_account: 'na', recipient_account: 'na',
  initiated_at_iso: '1970-01-01T00:00:00Z', metadata: {},
};
const DEFAULT_OTP = { session_id: 'na', user_id: 'na', keystroke_dwell_ms: [], keystroke_flight_ms: [] };
const DEFAULT_ACCOUNT = { user_id: 'na', login_ip: '0.0.0.0', device_id: 'na', resource_access: [], privilege_level: 0, timestamp_iso: '1970-01-01T00:00:00Z' };
const DEFAULT_SUPPLY = { component_id: 'na' };

class DetectionPipeline {
  constructor() {
    this.features   = new FeatureExtractor();
    this.phishingD  = new PhishingDetector();
    this.becD       = new BECDetector();
    this.wireD      = new WireFraudDetector();
    this.supplyD    = new SupplyChainDetector();
    this.otpD       = new OTPFraudDetector();
    this.atoD       = new ATODetector();
    this.lateralD   = new LateralMovementDetector();
    this.risk       = new UnifiedRiskEngine();
  }

  runUnified({ email, transaction, flows, otp, account, supply } = {}) {
    const e  = email       || DEFAULT_EMAIL;
    const t  = transaction || DEFAULT_TXN;
    const fl = flows       || [];
    const o  = otp         || DEFAULT_OTP;
    const a  = account     || DEFAULT_ACCOUNT;
    const s  = supply      || DEFAULT_SUPPLY;

    const bundle = {
      phishing:    this.features.phishingFromEmail(e),
      bec:         this.features.becFromEmail(e),
      wire:        this.features.wireFromTransaction(t),
      supplyChain: this.features.supplyChain(s),
      otp:         this.features.otpSession(o),
      ato:         this.features.atoTelemetry(a),
      lateral:     this.features.lateralFromFlows(fl),
    };
    this.features.buildUnified(bundle);

    const p  = this.phishingD.score(bundle.phishing, e);
    const b  = this.becD.score(bundle.bec);
    const w  = this.wireD.score(bundle.wire, t.sender_account||t.senderAccount||'', t.recipient_account||t.recipientAccount||'');
    const sc = this.supplyD.score(bundle.supplyChain, s);
    const op = this.otpD.score(bundle.otp);
    const at = this.atoD.score(bundle.ato);
    const la = this.lateralD.score(bundle.lateral, fl);

    const moduleOutputs = { phishing: p, bec: b, wire: w, supplyChain: sc, otp: op, ato: at, lateral: la };
    return this.risk.aggregate(moduleOutputs, bundle.unifiedNames, bundle.unifiedVector);
  }
}

// Singleton
let _pipeline = null;
function getPipeline() {
  if (!_pipeline) _pipeline = new DetectionPipeline();
  return _pipeline;
}

module.exports = { DetectionPipeline, getPipeline };
