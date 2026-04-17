'use strict';
const { getWorkforceService } = require('../services/workforceService');
const { getBroker }           = require('../services/incidentBroker');

exports.upsertProfile = async (req, res) => {
  try { res.json(await getWorkforceService().upsertProfile(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getProfile = async (req, res) => {
  try {
    const p = await getWorkforceService().getProfile(req.params.employeeId);
    if (!p) return res.status(404).json({ error: 'employee not found' });
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.assessPhishing = async (req, res) => {
  try {
    const { employee_id, email } = req.body;
    if (!employee_id || !email) return res.status(400).json({ error: 'employee_id and email required' });
    const svc = getWorkforceService();
    const result = await svc.assessPhishing(employee_id, email);
    await getBroker().publish('workforce.phishing_assessment', {
      employee_id: result.employee_id,
      training_gap_score: result.training_gap_score,
      role_cluster: result.role_cluster,
      phishing_probability: result.phishing_probability,
      automation_flags: result.automation_flags,
    });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.recordSimulation = async (req, res) => {
  try {
    const svc = getWorkforceService();
    const o = await svc.recordSimulation(req.body);
    await getBroker().publish('workforce.simulation_outcome', o);
    res.json(o);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.dashboardSummary = async (req, res) => {
  try { res.json(await getWorkforceService().dashboardSummary()); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

exports.rolesTaxonomy = async (req, res) => {
  try { res.json({ clusters: await getWorkforceService().taxonomyPublic() }); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

exports.auditLogs = async (req, res) => {
  try {
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
    const category = req.query.category || null;
    res.json(await getWorkforceService().auditLogs(limit, category));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.recentEvents = async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const messages = await getBroker().recentMessages(limit, 'workforce.');
    res.json(messages);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
