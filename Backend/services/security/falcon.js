'use strict';
/**
 * CrowdStrike Falcon event → CanonicalSecurityEvent
 * JS port of narip/security/falcon.py
 */

function falconEventToCanonical(body) {
  const meta = body.metadata || {};
  const event = body.event || body;
  return {
    vendor: 'crowdstrike',
    event_id: event.EventSimpleName || event.event_id || String(Date.now()),
    event_type: event.EventSimpleName || 'unknown',
    detection_name: event.DetectName || null,
    host: event.ComputerName || event.HostName || null,
    src_ip: event.LocalIP || event.aip || null,
    dst_ip: event.RemoteIP || null,
    severity_0_100: Math.min(100, (Number(event.Severity || 0)) * 25),
    mitre_tactics: event.Tactic ? [event.Tactic] : [],
    mitre_techniques: event.Technique ? [event.Technique] : [],
    raw: body,
    ingested_at: new Date().toISOString(),
  };
}

module.exports = { falconEventToCanonical };
