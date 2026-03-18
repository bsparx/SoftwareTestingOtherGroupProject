const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    required: true,
    unique: true
  },
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  category: {
    type: String,
    required: true,
    enum: ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Other']
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved'],
    default: 'Open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
