'use strict';
/**
 * Integrations adapter registry — JS port of narip/integrations/registry.py
 * Built-in adapters: crowdstrike, splunk.
 */

const ADAPTER_REGISTRY = {
  crowdstrike: {
    name: 'crowdstrike',
    description: 'CrowdStrike Falcon Stream adapter',
    async health() { return { status: 'ok', adapter: 'crowdstrike', latency_ms: 0 }; },
    async pushEvent(payload) { return { received: true, adapter: 'crowdstrike', payload }; },
  },
  splunk: {
    name: 'splunk',
    description: 'Splunk HEC adapter',
    async health() { return { status: 'ok', adapter: 'splunk', latency_ms: 0 }; },
    async pushEvent(payload) { return { received: true, adapter: 'splunk', payload }; },
  },
};

function listAdapters() {
  return Object.values(ADAPTER_REGISTRY).map(a => ({ name: a.name, description: a.description }));
}

exports.adaptersList = (req, res) => { res.json(listAdapters()); };

exports.adapterHealth = async (req, res) => {
  const a = ADAPTER_REGISTRY[req.params.name];
  if (!a) return res.status(404).json({ error: 'unknown_adapter', name: req.params.name });
  res.json(await a.health());
};

exports.adapterIngest = async (req, res) => {
  const a = ADAPTER_REGISTRY[req.params.name];
  if (!a) return res.status(404).json({ error: 'unknown_adapter', name: req.params.name });
  res.json(await a.pushEvent(req.body));
};
