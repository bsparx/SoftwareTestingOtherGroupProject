const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Get all users (Residents, Staff, Admins)
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get immutable audit logs
// @route   GET /api/users/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
        .populate('performedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(50); // Get latest 50 actions
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getAuditLogs
};