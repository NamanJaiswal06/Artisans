const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  category: { type: String, required: true },
  action: { type: String, required: true },
  employeeId: { type: String, default: null },
  detail: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
