const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  fingerprint: { type: String, default: null },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'auto_closed'],
    default: 'open',
  },
  vendor: { type: String, default: null },
  riskScore: { type: Number, default: 0 },
  title: { type: String, default: '' },
  summary: { type: mongoose.Schema.Types.Mixed, default: {} },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CaseSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Case', CaseSchema);
