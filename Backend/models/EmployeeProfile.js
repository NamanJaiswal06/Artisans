const mongoose = require('mongoose');

const EmployeeProfileSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: { type: String, default: '' },
  department: { type: String, default: '' },
  roleTitle: { type: String, default: '' },
  managerId: { type: String, default: null },
  lastTrainingCompletedAt: { type: Date, default: null },
  groups: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

EmployeeProfileSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('EmployeeProfile', EmployeeProfileSchema);
