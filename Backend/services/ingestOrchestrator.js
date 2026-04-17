'use strict';
/**
 * Ingest Orchestrator — JS port of narip/services/ingest_orchestrator.py
 * Falcon/Splunk canonical event → IOC → score → playbooks → case
 */

const crypto = require('crypto');

/* Convert canonical event to NARIP inputs (email/txn/flows/account/supply) */
function canonicalToNaripInputs(c) {
  const email = c.sender_email
    ? { message_id: c.event_id, sender: c.sender_email, subject: c.event_type, body_text: c.detection_name || '', urls: [] }
    : null;
  const account = c.src_ip
    ? { user_id: c.host || 'unknown', login_ip: c.src_ip, device_id: c.host || 'na', resource_access: [], privilege_level: 0, timestamp_iso: c.ingested_at }
    : null;
  return { email, transaction: null, flows: [], otp: null, account, supply: null };
}

/* Vendor severity boost */
function applyVendorSeverityBoost(baseScore, canonical, correlationBoost = 0) {
  const vendorBoost = canonical.severity_0_100 ? canonical.severity_0_100 / 200 : 0;
  return Math.min(100, Math.round(baseScore * (1 + vendorBoost + correlationBoost)));
}

/* Simple host correlator */
class HostCorrelator {
  constructor() { this._seen = {}; }
  observe(c) {
    const key = c.host || c.src_ip || 'unknown';
    this._seen[key] = (this._seen[key] || 0) + 1;
    const count = this._seen[key];
    return { boost: count > 3 ? 0.1 : 0, count };
  }
}

/* Fingerprint for dedup */
function fingerprintEvent(c) {
  const raw = `${c.vendor}:${c.event_type}:${c.host}:${c.src_ip}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/* Simple playbook engine (YAML-less version using JS rules) */
const PLAYBOOKS = [
  { pb_id: 'pb-001', name: 'High Risk Auto-Publish', enabled: true, match: { min_risk: 60 }, steps: [{ action: 'publish', topic: 'incident.high_risk' }] },
  { pb_id: 'pb-002', name: 'Critical Auto-Case', enabled: true, match: { min_risk: 80 }, steps: [{ action: 'create_case' }, { action: 'tag', value: 'critical' }] },
];

function evaluatePlaybooks(ctx) {
  const actions = [];
  for (const pb of PLAYBOOKS) {
    if (!pb.enabled) continue;
    if (pb.match.min_risk && ctx.risk_score < pb.match.min_risk) continue;
    actions.push(...pb.steps.map(s => ({ ...s, playbook: pb.name })));
  }
  return actions;
}

class IngestOrchestrator {
  constructor(pipeline, iocStore, caseStore, broker) {
    this._pipe = pipeline;
    this._ioc = iocStore;
    this._cases = caseStore;
    this._broker = broker;
    this._correlator = new HostCorrelator();
  }

  async scoreCanonical(canonical) {
    const iocHits = await this._ioc.enrich(canonical);
    const corr = this._correlator.observe(canonical);
    let boost = Number(corr.boost || 0);
    if (iocHits.length) boost = Math.min(0.25, boost + 0.08 * Math.min(iocHits.length, 3));

    const { email, transaction, flows, otp, account, supply } = canonicalToNaripInputs(canonical);
    const unified = this._pipe.runUnified({ email, transaction, flows, otp, account, supply });

    const adj = applyVendorSeverityBoost(unified.enterprise_risk_score, canonical, boost);
    unified.enterprise_risk_score = adj;
    unified.posterior_risk_0_1 = adj / 100;

    const ctx = { risk_score: adj, vendor: canonical.vendor, tactics: canonical.mitre_tactics, host: canonical.host };
    const actions = evaluatePlaybooks(ctx);

    const fp = fingerprintEvent(canonical);
    const title = canonical.detection_name || canonical.event_type || 'Security telemetry';
    const caseRec = await this._cases.upsertByFingerprint(fp, {
      vendor: canonical.vendor, riskScore: adj,
      title: (title).slice(0, 200),
      summary: { event_type: canonical.event_type, severity_vendor: canonical.severity_0_100, ioc_hits: iocHits, correlation: corr },
    });

    const executed = [];
    for (const step of actions) {
      if (step.action === 'publish') {
        await this._broker.publish(step.topic || 'incident.generic', { case_id: caseRec.caseId, risk: adj, vendor: canonical.vendor, playbook: step.playbook });
        executed.push(step);
      } else {
        executed.push({ ...step, case_id: caseRec.caseId });
      }
    }

    return {
      canonical,
      unified,
      ioc_hits: iocHits,
      correlation: corr,
      case_id: caseRec.caseId,
      playbook_actions: executed,
      audit_reference: unified.audit_reference,
    };
  }
}

let _orch = null;
function getOrchestrator() {
  if (!_orch) {
    const { getPipeline } = require('./pipeline');
    const { getIocStore } = require('./iocStore');
    const { getCaseStore } = require('./caseStore');
    const { getBroker }   = require('./incidentBroker');
    _orch = new IngestOrchestrator(getPipeline(), getIocStore(), getCaseStore(), getBroker());
  }
  return _orch;
}

module.exports = { IngestOrchestrator, getOrchestrator, evaluatePlaybooks, PLAYBOOKS };
