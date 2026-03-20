const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  visitorName: {
    type: String,
    required: true
  },
  studentId: {
    type: String, /* Required for official university logs */
    required: true
  },
  expectedDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  rejectReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Visitor = mongoose.model('Visitor', visitorSchema);
module.exports = Visitor;