'use strict';
/**
 * Case Store — MongoDB-backed replacing Python in-memory CaseStore.
 */

const { v4: uuidv4 } = require('uuid');
const Case = require('../models/Case');

class CaseStore {
  async listOpen() {
    return Case.find({ status: { $in: ['open', 'in_progress'] } }).sort({ createdAt: -1 }).lean();
  }

  async get(caseId) {
    return Case.findOne({ caseId }).lean();
  }

  async setStatus(caseId, status) {
    return Case.findOneAndUpdate({ caseId }, { status, updatedAt: new Date() }, { new: true }).lean();
  }

  async upsertByFingerprint(fingerprint, { vendor, riskScore, title, summary } = {}) {
    const existing = await Case.findOne({ fingerprint });
    if (existing) {
      existing.riskScore = Math.max(existing.riskScore, riskScore);
      existing.updatedAt = new Date();
      await existing.save();
      return existing;
    }
    return Case.create({
      caseId: uuidv4(),
      fingerprint,
      vendor,
      riskScore,
      title,
      summary,
      status: 'open',
    });
  }

  async create(payload = {}) {
    return Case.create({ caseId: uuidv4(), ...payload });
  }
}

let _store = null;
function getCaseStore() {
  if (!_store) _store = new CaseStore();
  return _store;
}

module.exports = { CaseStore, getCaseStore };
