const mongoose = require('mongoose');

const IOCSchema = new mongoose.Schema({
  type: { type: String, required: true },
  indicator: { type: String, required: true },
  source: { type: String, default: 'manual' },
  loadedAt: { type: Date, default: Date.now },
});

IOCSchema.index({ type: 1, indicator: 1 }, { unique: true });

module.exports = mongoose.model('IOC', IOCSchema);
