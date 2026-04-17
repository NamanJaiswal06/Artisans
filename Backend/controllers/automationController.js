'use strict';
const { getCaseStore } = require('../services/caseStore');
const { PLAYBOOKS, evaluatePlaybooks } = require('../services/ingestOrchestrator');

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'auto_closed'];

exports.listCases = async (req, res) => {
  try { res.json(await getCaseStore().listOpen()); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getCase = async (req, res) => {
  try {
    const c = await getCaseStore().get(req.params.caseId);
    if (!c) return res.status(404).json({ error: 'case not found' });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.setCaseStatus = async (req, res) => {
  try {
    const st = String(req.body.status || '');
    if (!VALID_STATUSES.includes(st)) return res.status(400).json({ error: 'invalid status' });
    const c = await getCaseStore().setStatus(req.params.caseId, st);
    if (!c) return res.status(404).json({ error: 'case not found' });
    res.json({ case_id: req.params.caseId, status: c.status });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.listPlaybooks = (req, res) => {
  res.json(PLAYBOOKS.map(p => ({ id: p.pb_id, name: p.name, enabled: p.enabled, match: p.match, steps: p.steps })));
};

exports.reloadPlaybooks = (req, res) => {
  // In-code playbooks do not need reload; return success for API compatibility
  res.json({ status: 'reloaded' });
};
