const express = require('express');
const router = express.Router();
const { getUsers, getAuditLogs } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorizeRoles('Admin'), getUsers);

router.route('/audit-logs')
  .get(protect, authorizeRoles('Admin'), getAuditLogs);

module.exports = router;