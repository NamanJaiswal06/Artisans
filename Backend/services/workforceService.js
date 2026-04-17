'use strict';
/**
 * Workforce Service — JS port of narip/services/workforce_service.py
 * Replaces in-memory dicts with MongoDB models.
 */

const EmployeeProfile   = require('../models/EmployeeProfile');
const SimulationOutcome = require('../models/SimulationOutcome');
const AuditLog          = require('../models/AuditLog');
const { RoleAwarePhishingDetector, ROLE_TAXONOMY, resolveCluster, roleContentAlignmentScore } = require('./detection/roleAwarePhishing');

function daysSince(dt) {
  if (!dt) return 400;
  return Math.max(0, (Date.now() - new Date(dt).getTime()) / 86400000);
}

class WorkforceService {
  constructor(pipeline) {
    this._pipe = pipeline;
    this._roleDetector = new RoleAwarePhishingDetector();
  }

  async upsertProfile(profileData) {
    const p = await EmployeeProfile.findOneAndUpdate(
      { employeeId: profileData.employee_id || profileData.employeeId },
      {
        employeeId:  profileData.employee_id || profileData.employeeId,
        email:       profileData.email,
        displayName: profileData.display_name || profileData.displayName || '',
        department:  profileData.department || '',
        roleTitle:   profileData.role_title || profileData.roleTitle || '',
        managerId:   profileData.manager_id || profileData.managerId || null,
        lastTrainingCompletedAt: profileData.last_training_completed_at || profileData.lastTrainingCompletedAt || null,
        groups:      profileData.groups || [],
        updatedAt:   new Date(),
      },
      { upsert: true, new: true }
    );
    await AuditLog.create({
      category: 'workforce', action: 'profile_upsert',
      employeeId: p.employeeId,
      detail: { email: p.email, department: p.department, roleTitle: p.roleTitle },
    });
    return this._formatProfile(p);
  }

  async getProfile(employeeId) {
    const p = await EmployeeProfile.findOne({ employeeId }).lean();
    return p ? this._formatProfile(p) : null;
  }

  async recordSimulation(outcomeData) {
    const o = await SimulationOutcome.create({
      employeeId:           outcomeData.employee_id || outcomeData.employeeId,
      campaignId:           outcomeData.campaign_id || outcomeData.campaignId,
      scenarioTags:         outcomeData.scenario_tags || outcomeData.scenarioTags || [],
      clickedLink:          outcomeData.clicked_link ?? outcomeData.clickedLink ?? false,
      submittedCredentials: outcomeData.submitted_credentials ?? outcomeData.submittedCredentials ?? false,
      reportedPhish:        outcomeData.reported_phish ?? outcomeData.reportedPhish ?? false,
      recordedAt: new Date(),
    });
    await AuditLog.create({
      category: 'simulation', action: 'phishing_outcome',
      employeeId: o.employeeId,
      detail: { clicked: o.clickedLink, submitted: o.submittedCredentials, reported: o.reportedPhish, campaign_id: o.campaignId },
    });
    return this._formatOutcome(o);
  }

  async assessPhishing(employeeId, email) {
    let prof = await EmployeeProfile.findOne({ employeeId }).lean();
    if (!prof) {
      prof = { employeeId, email: email.sender || '', department: '', roleTitle: '' };
    }
    const clusterKey = resolveCluster(prof.department, prof.roleTitle);
    const cluster = ROLE_TAXONOMY[clusterKey] || ROLE_TAXONOMY.general;
    const clusterKeys = Object.keys(ROLE_TAXONOMY).sort();
    const idxNorm = clusterKeys.indexOf(clusterKey) / Math.max(1, clusterKeys.length - 1);

    const baseF = this._pipe.features.phishingFromEmail(email);
    const baseP = this._pipe.phishingD.score(baseF, email).phishing_probability;
    const text = `${email.subject || ''} ${email.body_text || email.bodyText || ''}`;
    const alignment = roleContentAlignmentScore(text, cluster);
    const days = daysSince(prof.lastTrainingCompletedAt);
    const failRate = await this._simFailRate(employeeId);

    const result = this._roleDetector.assess({
      employeeId, email, cluster, basePhishFeatures: baseF, basePhishProbability: baseP,
      alignment, daysSinceTraining: days, simFailRate: failRate, clusterIndexNorm: idxNorm,
    });

    await AuditLog.create({
      category: 'phishing', action: 'role_aware_assessment', employeeId,
      detail: { training_gap_score: result.training_gap_score, role_cluster: result.role_cluster, phishing_probability: result.phishing_probability },
    });
    return result;
  }

  async dashboardSummary() {
    const profiles = await EmployeeProfile.find().lean();
    if (!profiles.length) return { total_profiles: 0, high_gap_employees: 0, avg_training_gap: 0, top_clusters_at_risk: [] };

    const gaps = [];
    const clusterScores = {};
    for (const prof of profiles) {
      const clusterKey = resolveCluster(prof.department, prof.roleTitle);
      const cluster = ROLE_TAXONOMY[clusterKey] || ROLE_TAXONOMY.general;
      const days = daysSince(prof.lastTrainingCompletedAt);
      const fr = await this._simFailRate(prof.employeeId);
      const residualProxy = Math.min(1, cluster.baselineClickRisk * 0.55 + fr * 0.55);
      const gap = this._roleDetector.trainingGapScore(0.35, 0.25, residualProxy, days, fr, cluster);
      gaps.push([prof.employeeId, gap]);
      (clusterScores[clusterKey] = clusterScores[clusterKey] || []).push(gap);
    }

    const high = gaps.filter(([, g]) => g >= 60).length;
    const avg = gaps.reduce((s, [, g]) => s + g, 0) / gaps.length;
    const topC = Object.entries(clusterScores)
      .map(([k, v]) => ({ cluster: k, avg_gap: v.reduce((a, b) => a + b, 0) / v.length, count: v.length }))
      .sort((a, b) => b.avg_gap - a.avg_gap).slice(0, 5);

    return { total_profiles: profiles.length, high_gap_employees: high, avg_training_gap: Math.round(avg * 100) / 100, top_clusters_at_risk: topC };
  }

  async taxonomyPublic() {
    return Object.fromEntries(Object.entries(ROLE_TAXONOMY).map(([k, v]) => [k, {
      display_name: v.displayName,
      typical_lures: v.typicalLures,
      baseline_click_risk: v.baselineClickRisk,
      priority_modules: v.priorityModules,
    }]));
  }

  async auditLogs(limit = 100, category = null) {
    const q = category ? { category } : {};
    return AuditLog.find(q).sort({ timestamp: -1 }).limit(limit).lean();
  }

  async _simFailRate(employeeId, window = 12) {
    const rows = await SimulationOutcome.find({ employeeId }).sort({ recordedAt: -1 }).limit(window).lean();
    if (!rows.length) return 0;
    const fails = rows.filter(r => r.clickedLink || r.submittedCredentials).length;
    return fails / rows.length;
  }

  _formatProfile(p) {
    return {
      employee_id: p.employeeId, email: p.email, display_name: p.displayName,
      department: p.department, role_title: p.roleTitle, manager_id: p.managerId,
      last_training_completed_at: p.lastTrainingCompletedAt, groups: p.groups, updated_at: p.updatedAt,
    };
  }

  _formatOutcome(o) {
    return {
      employee_id: o.employeeId, campaign_id: o.campaignId, scenario_tags: o.scenarioTags,
      clicked_link: o.clickedLink, submitted_credentials: o.submittedCredentials,
      reported_phish: o.reportedPhish, recorded_at: o.recordedAt,
    };
  }
}

let _svc = null;
function getWorkforceService() {
  if (!_svc) {
    const { getPipeline } = require('./pipeline');
    _svc = new WorkforceService(getPipeline());
  }
  return _svc;
}

module.exports = { WorkforceService, getWorkforceService };
