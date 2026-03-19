const Visitor = require('../models/Visitor');

// @desc    Register a new visitor
// @route   POST /api/visitors
// @access  Private (Resident)
const createVisitor = async (req, res) => {
  try {
    const { visitorName, visitorCNIC, expectedDate } = req.body;
    
    // Convert current time and expected date to check curfew
    const requestedDate = new Date(expectedDate);
    const hour = requestedDate.getHours();

    // 10:00 PM curfew policy check (22:00)
    if (hour >= 22 || hour <= 6) {
        return res.status(400).json({ message: 'Hostel Policy Violation: Visitors are not allowed between 10:00 PM and 6:00 AM.' });
    }

    const visitor = new Visitor({
      resident: req.user._id,
      visitorName,
      visitorCNIC,
      expectedDate
    });

    const createdVisitor = await visitor.save();
    res.status(201).json(createdVisitor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get visitors based on role
// @route   GET /api/visitors
// @access  Private
const getVisitors = async (req, res) => {
  try {
    let visitors;
    
    if (req.user.role === 'Resident') {
        visitors = await Visitor.find({ resident: req.user._id }).sort({ createdAt: -1 });
    } else {
        // Admin, Guard can see all visitors, populate resident info
        visitors = await Visitor.find().populate('resident', 'name roomNumber').sort({ expectedDate: 1 });
    }

    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update visitor status (Approve/Reject)
// @route   PUT /api/visitors/:id/status
// @access  Private (Admin, Guard)
const updateVisitorStatus = async (req, res) => {
  try {
    const { status, rejectReason } = req.body;

    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor request not found' });
    }

    if (status === 'Rejected' && (!rejectReason || rejectReason.trim() === '')) {
       return res.status(400).json({ message: 'Rejection reason is required.' });
    }

    visitor.status = status;
    if (rejectReason) {
        visitor.rejectReason = rejectReason;
    }

    const updatedVisitor = await visitor.save();
    res.json(updatedVisitor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createVisitor,
  getVisitors,
  updateVisitorStatus
};