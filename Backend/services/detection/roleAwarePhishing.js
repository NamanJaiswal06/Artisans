'use strict';
/**
 * Role-Aware Phishing Detector — JS port of narip/detection/role_aware_phishing.py
 *
 * Role taxonomy constants are embedded here (from narip/workforce/role_profiles.py).
 */

const { clamp01 } = require('../features/extraction');

/* ── Role Taxonomy ─────────────────────────────────────────────── */
const ROLE_TAXONOMY = {
  executive: {
    key: 'executive',
    displayName: 'Executive / C-Suite',
    typicalLures: ['ceo fraud', 'board approval', 'urgent wire', 'strategic acquisition'],
    baselineClickRisk: 0.28,
    priorityModules: ['BEC Awareness', 'Wire Fraud Simulation', 'Executive Impersonation'],
  },
  finance: {
    key: 'finance',
    displayName: 'Finance & Accounting',
    typicalLures: ['invoice redirect', 'vendor payment', 'tax document', 'wire transfer'],
    baselineClickRisk: 0.35,
    priorityModules: ['Wire Fraud Awareness', 'Invoice Fraud', 'ACH/BEC Deep Dive'],
  },
  hr: {
    key: 'hr',
    displayName: 'HR & People Operations',
    typicalLures: ['payroll update', 'benefits portal', 'employee record', 'w-2 request'],
    baselineClickRisk: 0.30,
    priorityModules: ['Payroll Diversion Awareness', 'PII Protection', 'Social Engineering'],
  },
  it: {
    key: 'it',
    displayName: 'IT & Engineering',
    typicalLures: ['credential reset', 'system alert', 'github notification', 'cloud billing'],
    baselineClickRisk: 0.22,
    priorityModules: ['Credential Phishing', 'Supply Chain Risk', 'MFA Fatigue'],
  },
  sales: {
    key: 'sales',
    displayName: 'Sales & Business Development',
    typicalLures: ['rfp document', 'prospect attachment', 'contract signature', 'deal approval'],
    baselineClickRisk: 0.38,
    priorityModules: ['Attachment Awareness', 'Spoofed Domain Recognition', 'Urgency Bias'],
  },
  legal: {
    key: 'legal',
    displayName: 'Legal & Compliance',
    typicalLures: ['subpoena', 'court order', 'regulatory notice', 'settlement document'],
    baselineClickRisk: 0.20,
    priorityModules: ['Document Phishing', 'Authority Lures', 'Spearphishing Simulation'],
  },
  general: {
    key: 'general',
    displayName: 'General Staff',
    typicalLures: ['prize notification', 'parcel delivery', 'account suspension', 'free gift'],
    baselineClickRisk: 0.32,
    priorityModules: ['Phishing Foundations', 'URL Inspection', 'Reporting Culture'],
  },
};

function resolveCluster(department = '', roleTitle = '') {
  const d = department.toLowerCase();
  const r = roleTitle.toLowerCase();
  if (/\b(ceo|cto|cfo|coo|president|vp|chief)\b/.test(r) || /executive/i.test(d)) return 'executive';
  if (/\b(finance|accounting|payroll|treasurer|ap|ar)\b/.test(d) || /\b(accountant|controller|cfo)\b/.test(r)) return 'finance';
  if (/\b(hr|human resources|people|talent|recruit)\b/.test(d)) return 'hr';
  if (/\b(it|engineering|devops|security|infra|cloud)\b/.test(d) || /\b(engineer|developer|analyst|admin)\b/.test(r)) return 'it';
  if (/\b(sales|business development|account|revenue)\b/.test(d)) return 'sales';
  if (/\b(legal|compliance|counsel|risk)\b/.test(d)) return 'legal';
  return 'general';
}

function roleContentAlignmentScore(text, cluster) {
  const t = text.toLowerCase();
  const hits = cluster.typicalLures.filter(lure =>
    lure.split(' ').some(word => t.includes(word))
  ).length;
  return clamp01(hits / Math.max(cluster.typicalLures.length, 1));
}

/* ── Detector ────────────────────────────────────────────────── */
class RoleAwarePhishingDetector {
  constructor() {
    this._modelsUsed = [
      'logistic_regression_role_conditioned',
      'random_forest_content',
      'role_lure_alignment',
      'behavior_prior',
    ];
  }

  buildFeatures(basePhish, email, cluster, alignment, daysSinceTraining, simFailRate, clusterIndexNorm) {
    const text = `${email.subject || ''} ${email.body_text || email.bodyText || ''}`.toLowerCase();
    const urgency = Math.min(1, (text.match(/urgent/g) || []).length * 0.15 + (text.match(/immediately/g) || []).length * 0.15);
    return [
      Number(basePhish[0]),
      Number(basePhish[1]),
      Number(basePhish[2]),
      Number(alignment),
      Number(cluster.baselineClickRisk),
      Number(Math.min(1, daysSinceTraining / 365)),
      Number(simFailRate),
      Number(clusterIndexNorm * 0.5 + urgency * 0.5),
    ];
  }

  scoreResidualClickRisk(features) {
    // LR proxy on 8 features
    const linear = features.reduce((a, b) => a + b, 0) / features.length - 0.4;
    const lrP = 1 / (1 + Math.exp(-linear * 4));
    // RF proxy on first 3 (base phishing features)
    const rf1 = features[0] > 0.5 ? 0.80 : 0.20;
    const rf2 = features[1] > 0.3 ? 0.70 : 0.25;
    const rf3 = features[2] > 0.3 ? 0.65 : 0.25;
    const rfP = clamp01(rf1 * 0.4 + rf2 * 0.35 + rf3 * 0.25);
    return clamp01(0.45 * lrP + 0.55 * rfP);
  }

  trainingGapScore(phishingP, alignment, residual, daysSinceTraining, simFailRate, cluster) {
    const genericTrainingFailure = Math.min(1, simFailRate * 1.1 + cluster.baselineClickRisk * 0.35);
    const recencyPenalty = Math.min(1, daysSinceTraining / 540);
    const raw = (0.28 * phishingP + 0.22 * alignment + 0.22 * residual +
      0.16 * genericTrainingFailure + 0.12 * recencyPenalty);
    return Math.min(100, Math.max(0, raw * 100));
  }

  assess({ employeeId, email, cluster, basePhishFeatures, basePhishProbability,
    alignment, daysSinceTraining, simFailRate, clusterIndexNorm }) {

    const feats = this.buildFeatures(basePhishFeatures, email, cluster,
      alignment, daysSinceTraining, simFailRate, clusterIndexNorm);
    const residual = this.scoreResidualClickRisk(feats);
    const gap = this.trainingGapScore(basePhishProbability, alignment, residual,
      daysSinceTraining, simFailRate, cluster);

    const flags = [];
    if (gap >= 65) flags.push('auto_assign_role_module');
    if (alignment >= 0.55 && basePhishProbability >= 0.45) flags.push('quarantine_recommended');
    if (simFailRate >= 0.35) flags.push('human_coaching_queue');

    return {
      employee_id: employeeId,
      role_cluster: cluster.key,
      role_cluster_display: cluster.displayName,
      phishing_probability: basePhishProbability,
      role_exposure_alignment: alignment,
      training_gap_score: gap,
      estimated_residual_click_risk: residual,
      recommended_modules: [...cluster.priorityModules],
      recommended_simulations: [
        `Micro-sim: ${cluster.displayName} themed lure`,
        'Just-in-time nudge on first match to role keywords',
      ],
      automation_flags: flags,
      models_used: this._modelsUsed,
      feature_vector: feats,
      explain_snippets: [
        `Role cluster '${cluster.displayName}' baseline engagement prior: ${cluster.baselineClickRisk.toFixed(2)}`,
        `Content-to-role alignment: ${alignment.toFixed(2)}`,
        `Residual click risk (role-conditioned ML): ${residual.toFixed(2)}`,
      ],
    };
  }
}

module.exports = { RoleAwarePhishingDetector, ROLE_TAXONOMY, resolveCluster, roleContentAlignmentScore };
