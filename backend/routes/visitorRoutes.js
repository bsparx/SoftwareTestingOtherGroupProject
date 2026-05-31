const express = require('express');
const router = express.Router();
const { createVisitor, getVisitors, updateVisitorStatus } = require('../controllers/visitorController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorizeRoles('Resident'), createVisitor)
  .get(protect, getVisitors);

router.route('/:id/status')
  .put(protect, authorizeRoles('Admin', 'Guard'), updateVisitorStatus);

module.exports = router;