const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved'],
    default: 'Active'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

const Emergency = mongoose.model('Emergency', emergencySchema);
module.exports = Emergency;
