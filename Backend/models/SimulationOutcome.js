const mongoose = require('mongoose');

const SimulationOutcomeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  campaignId: { type: String, required: true },
  scenarioTags: { type: [String], default: [] },
  clickedLink: { type: Boolean, default: false },
  submittedCredentials: { type: Boolean, default: false },
  reportedPhish: { type: Boolean, default: false },
  recordedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SimulationOutcome', SimulationOutcomeSchema);
