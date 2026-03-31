const Emergency = require('../models/Emergency');

// @desc    Report an emergency
// @route   POST /api/emergencies
// @access  Private (Resident only)
const reportEmergency = async (req, res) => {
  try {
    const emergency = new Emergency({
      resident: req.user._id
    });

    const savedEmergency = await emergency.save();
    res.status(201).json(savedEmergency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all emergencies (or filter by status)
// @route   GET /api/emergencies
// @access  Private (Admin only)
const getEmergencies = async (req, res) => {
  try {
    const status = req.query.status;
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const emergencies = await Emergency.find(query)
      .populate('resident', 'name roomNumber email')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });
      
    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve an emergency
// @route   PUT /api/emergencies/:id/resolve
// @access  Private (Admin only)
const resolveEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);

    if (emergency) {
      emergency.status = 'Resolved';
      emergency.resolvedBy = req.user._id;
      const updatedEmergency = await emergency.save();
      res.json(updatedEmergency);
    } else {
      res.status(404).json({ message: 'Emergency not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  reportEmergency,
  getEmergencies,
  resolveEmergency
};