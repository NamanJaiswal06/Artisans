'use strict';
/**
 * Feature extraction — JS port of narip/features/extraction.py
 * Pure math/regex, no Python deps required.
 */

const crypto = require('crypto');
const url = require('url');

/* ── helpers ──────────────────────────────────────────────────── */
function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function entropy(text) {
  if (!text) return 0;
  const freq = {};
  for (const c of text.toLowerCase()) freq[c] = (freq[c] || 0) + 1;
  const n = text.length;
  let h = 0;
  for (const c of Object.values(freq)) { const p = c / n; h -= p * Math.log2(p); }
  return h ? h / 8 : 0;
}

function sha256hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function md5hex(s) {
  return crypto.createHash('md5').update(s).digest('hex');
}

/* ── FeatureExtractor ─────────────────────────────────────────── */
class FeatureExtractor {
  constructor() {
    this._domainBadHashes = new Set();
  }

  seedBadDomain(domain) {
    this._domainBadHashes.add(sha256hex(domain.toLowerCase()).slice(0, 12));
  }

  /**
   * [domain_rep, url_risk, nlp_score]
   */
  phishingFromEmail(e) {
    const domain = e.sender && e.sender.includes('@')
      ? e.sender.split('@').pop().toLowerCase()
      : '';
    const domHash = sha256hex(domain).slice(0, 12);
    const domainRep = this._domainBadHashes.has(domHash) ? 1.0 : 0.2;

    const urls = e.urls || [];
    const suspiciousTlds = urls.filter(u => {
      try { const h = new url.URL(u).hostname; return h.endsWith('.tk') || h.endsWith('.ml') || h.endsWith('.gq'); }
      catch { return false; }
    }).length;
    const urlRisk = clamp01(0.15 * urls.length + 0.25 * suspiciousTlds);

    const bodyText = e.bodyText || e.body_text || '';
    const urgency = (bodyText.match(/\b(urgent|immediately|wire|confidential)\b/gi) || []).length;
    const nlpScore = clamp01(entropy(bodyText) * 0.35 + urgency * 0.08);

    return [domainRep, urlRisk, nlpScore];
  }

  /**
   * [reply_mismatch, urgency, wire_kw]
   */
  becFromEmail(e) {
    const bodyText = e.bodyText || e.body_text || '';
    const wireKw = (bodyText.match(/\b(wire transfer|routing number|swift|iban)\b/gi) || []).length;
    const urgency = (bodyText.match(/\b(urgent|ceo|cfo|do not tell|secret)\b/gi) || []).length;
    const replyMismatch = (e.reply_to && e.reply_to.toLowerCase() !== (e.sender || '').toLowerCase()) ? 1.0 : 0.0;
    return [clamp01(replyMismatch), clamp01(urgency * 0.15), clamp01(wireKw * 0.2)];
  }

  /**
   * [amount_dev, rec_hist, timing]
   */
  wireFromTransaction(t, historicalMean = 5000) {
    const amt = Math.abs(t.amount || 0);
    const z = Math.abs(amt - historicalMean) / (historicalMean + 1e-6);
    const amountDev = clamp01(z / 5);

    const recHex = md5hex(t.recipient_account || t.recipientAccount || '').slice(0, 8);
    const recHist = clamp01(parseInt(recHex, 16) / 0xFFFFFFFF);

    let hour = 12;
    try {
      const isoStr = t.initiated_at_iso || t.initiatedAtIso || '1970-01-01T12:00:00Z';
      hour = new Date(isoStr).getUTCHours();
    } catch (_) {}
    const timing = clamp01(Math.abs(hour - 14) / 12);

    return [amountDev, recHist, timing];
  }

  /**
   * [version_changed, traffic_anomaly, egress_ratio_n]
   */
  supplyChain(s) {
    const versionChanged = (s.version_old && s.version_new && s.version_old !== s.version_new) ? 1.0 : 0.0;
    const baseline = (s.baseline_egress_bytes_per_hour || s.baselineEgressBytesPerHour || 1);
    const egress = (s.vendor_egress_bytes_per_hour || s.vendorEgressBytesPerHour || 0);
    const egressRatio = egress / (baseline + 1e-6);
    const trafficAnomaly = clamp01(Math.log1p(egressRatio) / 4);
    return [versionChanged, trafficAnomaly, clamp01(egressRatio / 10)];
  }

  /**
   * [dwell_n, flight_n, geo, fp_entropy]
   */
  otpSession(o) {
    const dwell = o.keystroke_dwell_ms || o.keystrokeDwellMs || [];
    const flight = o.keystroke_flight_ms || o.keystrokeFlightMs || [];
    const dwellAvg = dwell.length ? dwell.reduce((a, b) => a + b, 0) / dwell.length : 0;
    const flightAvg = flight.length ? flight.reduce((a, b) => a + b, 0) / flight.length : 0;
    const dwellN = clamp01(dwellAvg / 200);
    const flightN = clamp01(flightAvg / 150);
    let geo = 0;
    if (o.geo_lat != null && o.geo_lon != null) {
      geo = clamp01((Math.abs(o.geo_lat) + Math.abs(o.geo_lon)) / 360);
    }
    const fpEntropy = entropy(o.device_fingerprint || o.deviceFingerprint || '');
    return [dwellN, flightN, geo, fpEntropy];
  }

  /**
   * [access_spike, priv, dev_change_proxy]
   */
  atoTelemetry(cur, baselineResourceCount = 3) {
    const resources = cur.resource_access || cur.resourceAccess || [];
    const accessSpike = clamp01(resources.length / (baselineResourceCount + 1));
    const priv = clamp01((cur.privilege_level || cur.privilegeLevel || 0) / 10);
    const devChange = clamp01(entropy(cur.device_id || cur.deviceId || '') * 0.5);
    return [accessSpike, priv, devChange];
  }

  /**
   * [total_bytes_n, unique_dst_n, priv_ports_n]
   */
  lateralFromFlows(flows) {
    if (!flows || flows.length === 0) return [0, 0, 0];
    const totalBytes = flows.reduce((a, f) => a + (f.bytes_out || f.bytesOut || 0), 0);
    const uniqueDst = new Set(flows.map(f => f.dst_ip || f.dstIp)).size;
    const PRIV = new Set([445, 135, 3389, 22]);
    const privPorts = flows.filter(f => PRIV.has(f.dst_port || f.dstPort)).length;
    return [
      clamp01(Math.log1p(totalBytes) / 20),
      clamp01(uniqueDst / 20),
      clamp01(privPorts / Math.max(flows.length, 1)),
    ];
  }

  /**
   * Build unified feature vector (all modules concatenated).
   */
  buildUnified(bundle) {
    const names = [];
    const vec = [];
    const groups = [
      ['phishing', bundle.phishing],
      ['bec', bundle.bec],
      ['wire', bundle.wire],
      ['supply_chain', bundle.supplyChain],
      ['otp', bundle.otp],
      ['ato', bundle.ato],
      ['lateral', bundle.lateral],
    ];
    for (const [gname, feats] of groups) {
      feats.forEach((v, i) => { names.push(`${gname}_${i}`); vec.push(Number(v)); });
    }
    bundle.unifiedNames = names;
    bundle.unifiedVector = vec;
    return bundle;
  }
}

module.exports = { FeatureExtractor, clamp01, entropy };
