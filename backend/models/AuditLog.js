const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { 
      type: String, 
      required: true 
  },
  performedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
  },
  role: { 
      type: String 
  },
  details: { 
      type: String,
      required: true
  }
}, {
  timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;