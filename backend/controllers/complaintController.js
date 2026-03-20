const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private (Resident only)
const createComplaint = async (req, res) => {
  try {
    const { category, description } = req.body;
    
    // Generate unique complaint ID (e.g., CMP-DateNow)
    const complaintId = `CMP-${Date.now()}`;

    const complaint = await Complaint.create({
      complaintId,
      resident: req.user._id,
      category,
      description,
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get complaints based on user role
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res) => {
  try {
    let complaints;
    
    // Admin sees all complaints
    if (req.user.role === 'Admin') {
      complaints = await Complaint.find().populate('resident', 'name roomNumber').populate('assignedTo', 'name');
    } 
    // Maintenance staff sees only complaints assigned to them
    else if (req.user.role === 'Maintenance') {
      complaints = await Complaint.find({ assignedTo: req.user._id }).populate('resident', 'name roomNumber');
    } 
    // Residents see only their own complaints
    else {
      complaints = await Complaint.find({ resident: req.user._id }).populate('assignedTo', 'name');
    }

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign a complaint to a maintenance worker
// @route   PUT /api/complaints/:id/assign
// @access  Private (Admin only)
const assignComplaint = async (req, res) => {
  try {
    const { staffId } = req.body; // ID of the maintenance worker

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.assignedTo = staffId;
    // Moving status to "In Progress" when assigned can be a good idea, or let staff do it. Let's keep it Open.
    const updatedComplaint = await complaint.save();

    const staffMember = await User.findById(staffId);
    await AuditLog.create({
       action: "Complaint Assigned",
       performedBy: req.user._id,
       role: req.user.role,
       details: `Complaint ${complaint.complaintId} assigned to staff ${staffMember ? staffMember.name : staffId}`
    });

    res.json(updatedComplaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (Admin, Maintenance)
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, resolutionRemarks } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Only allow staff assigned to it or Admin to update status
    if (req.user.role === 'Maintenance' && complaint.assignedTo && complaint.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this complaint' });
    }

    // Checking state transition for Testing Course
    if (req.user.role === 'Maintenance') {
      if (complaint.status === 'Open' && status === 'Resolved') {
        return res.status(400).json({ message: 'Cannot jump directly from Open to Resolved. Must go through In Progress.' });
      }
      if (status === 'Resolved' && (!resolutionRemarks || resolutionRemarks.trim() === '')) {
         return res.status(400).json({ message: 'Resolution remarks are required to mark a ticket as Resolved.' });
      }
    }

    complaint.status = status;
    if (resolutionRemarks) {
      complaint.resolutionRemarks = resolutionRemarks;
    }
    const updatedComplaint = await complaint.save();

    await AuditLog.create({
       action: `Complaint ${status}`,
       performedBy: req.user._id,
       role: req.user.role,
       details: `Complaint ${complaint.complaintId} status updated to ${status} by ${req.user.name}`
    });

    res.json(updatedComplaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all maintenance staff for assignment dropdown
// @route   GET /api/complaints/staff
// @access  Private (Admin only)
const getMaintenanceStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'Maintenance' }).select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  assignComplaint,
  updateComplaintStatus,
  getMaintenanceStaff
};
