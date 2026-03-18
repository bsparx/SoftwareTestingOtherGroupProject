const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createComplaint,
  getComplaints,
  assignComplaint,
  updateComplaintStatus,
  getMaintenanceStaff
} = require('../controllers/complaintController');

// All routes require user to be logged in
router.use(protect);

// Get staff list (Admin only)
router.get('/staff', authorizeRoles('Admin'), getMaintenanceStaff);

// Route: /api/complaints
router.route('/')
  .post(authorizeRoles('Resident'), createComplaint)
  .get(getComplaints); // Any logged in user can fetch based on their logic in controller

// Route: /api/complaints/:id/assign
router.put('/:id/assign', authorizeRoles('Admin'), assignComplaint);

// Route: /api/complaints/:id/status
router.put('/:id/status', authorizeRoles('Admin', 'Maintenance'), updateComplaintStatus);

module.exports = router;
