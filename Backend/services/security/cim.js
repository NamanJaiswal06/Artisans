'use strict';
/**
 * Splunk HEC event → CanonicalSecurityEvent (CIM mapping)
 * JS port of narip/security/cim.py
 */

function splunkHecToCanonical(body) {
  const event = body.event || body;
  const fields = body.fields || {};
  return {
    vendor: 'splunk',
    event_id: body.id || event.event_id || String(Date.now()),
    event_type: event.sourcetype || event.source || 'splunk',
    detection_name: event.signature || fields.signature || null,
    host: event.host || fields.host || null,
    src_ip: event.src_ip || fields.src_ip || event.src || null,
    dst_ip: event.dest_ip || fields.dest_ip || event.dest || null,
    severity_0_100: Math.min(100, Number(event.severity || fields.severity || 0) * 20),
    mitre_tactics: event.mitre_tactic ? [event.mitre_tactic] : [],
    mitre_techniques: event.mitre_technique ? [event.mitre_technique] : [],
    raw: body,
    ingested_at: new Date().toISOString(),
  };
}

module.exports = { splunkHecToCanonical };
