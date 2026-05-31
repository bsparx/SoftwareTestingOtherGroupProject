const express = require('express');
const router = express.Router();
const { reportEmergency, getEmergencies, resolveEmergency } = require('../controllers/emergencyController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, reportEmergency)
  .get(protect, authorizeRoles('Admin', 'Maintenance'), getEmergencies); // Maybe admin + maintenance

router.route('/:id/resolve')
  .put(protect, authorizeRoles('Admin'), resolveEmergency);

module.exports = router;