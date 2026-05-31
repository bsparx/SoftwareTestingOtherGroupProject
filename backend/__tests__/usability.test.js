/**
 * Usability Testing
 * Checks whether users can complete core tasks easily.
 * Tests full user journeys: register → login, create complaint → resolve,
 * register visitor → approve, report emergency → resolve.
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockUserFindOne = jest.fn();
const mockUserCreate = jest.fn();
const mockUserFindById = jest.fn();
const mockComplaintCreate = jest.fn();
const mockComplaintFind = jest.fn();
const mockComplaintFindById = jest.fn();
const mockComplaintSave = jest.fn();
const mockVisitorSave = jest.fn();
const mockVisitorFindById = jest.fn();
const mockVisitorFind = jest.fn();
const mockEmergencySave = jest.fn();
const mockEmergencyFindById = jest.fn();
const mockEmergencyFind = jest.fn();
const mockAuditLogCreate = jest.fn();
const mockSendEmail = jest.fn();

jest.mock('../models/User', () => {
  const U = jest.fn();
  U.findOne = mockUserFindOne;
  U.create = mockUserCreate;
  U.findById = mockUserFindById;
  U.find = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
  return U;
});

jest.mock('../models/Complaint', () => {
  const C = jest.fn();
  C.create = mockComplaintCreate;
  C.find = mockComplaintFind;
  C.findById = mockComplaintFindById;
  return C;
});

jest.mock('../models/Visitor', () => {
  const V = jest.fn((d) => ({ ...d, save: mockVisitorSave }));
  V.find = mockVisitorFind;
  V.findById = mockVisitorFindById;
  V.updateMany = jest.fn().mockResolvedValue({});
  return V;
});

jest.mock('../models/Emergency', () => {
  const E = jest.fn((d) => ({ ...d, save: mockEmergencySave }));
  E.find = mockEmergencyFind;
  E.findById = mockEmergencyFindById;
  return E;
});

jest.mock('../models/AuditLog', () => ({
  create: mockAuditLogCreate,
  find: jest.fn()
}));

jest.mock('../utils/sendEmail', () => mockSendEmail);

const { registerUser, loginUser, verifyEmail } = require('../controllers/authController');
const { createComplaint, getComplaints, assignComplaint, updateComplaintStatus, updateComplaintUrgency } = require('../controllers/complaintController');
const { createVisitor, getVisitors, updateVisitorStatus } = require('../controllers/visitorController');
const { reportEmergency, getEmergencies, resolveEmergency } = require('../controllers/emergencyController');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ═════════════════════════════════════════════════════════════════════════════
// FLOW 1: Resident Registration → Email Verification → Login
// A new user should be able to register, verify email, and log in.
// ═════════════════════════════════════════════════════════════════════════════

describe('Usability: Resident Registration → Verification → Login Flow', () => {

  beforeEach(() => jest.clearAllMocks());

  test('USAB-001: Step 1 - Resident registers successfully', async () => {
    mockUserFindOne.mockResolvedValue(null); // no existing user
    mockUserCreate.mockResolvedValue({
      _id: 'user-001',
      email: 'resident@iba.edu.pk',
      name: 'Test Resident',
    });
    mockSendEmail.mockResolvedValue(true);

    const req = {
      body: { name: 'Test Resident', email: 'resident@iba.edu.pk', password: 'SecurePass123', role: 'Resident', roomNumber: 'A-101' },
    };
    const res = mockRes();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('registered'),
    }));
  });

  test('USAB-002: Step 2 - Email verification succeeds with valid token', async () => {
    const mockUser = {
      _id: 'user-001',
      isVerified: false,
      verificationToken: 'valid-token-abc',
      save: jest.fn().mockResolvedValue(true),
    };
    mockUserFindOne.mockResolvedValue(mockUser);

    const req = { params: { token: 'valid-token-abc' } };
    const res = mockRes();
    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockUser.isVerified).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();
  });

  test('USAB-003: Step 3 - Verified resident can log in', async () => {
    process.env.JWT_SECRET = 'test-secret-for-usability';
    mockUserFindOne.mockResolvedValue({
      _id: 'user-001',
      name: 'Test Resident',
      email: 'resident@iba.edu.pk',
      role: 'Resident',
      roomNumber: 'A-101',
      isVerified: true,
      matchPassword: jest.fn().mockResolvedValue(true),
    });

    const req = { body: { email: 'resident@iba.edu.pk', password: 'SecurePass123' } };
    const res = mockRes();
    await loginUser(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      _id: 'user-001',
      name: 'Test Resident',
      role: 'Resident',
      token: expect.any(String),
    }));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// FLOW 2: Complaint Creation → Assignment → Status Update → Resolution
// Resident creates complaint, Admin assigns, Maintenance resolves.
// ═════════════════════════════════════════════════════════════════════════════

describe('Usability: Complaint Lifecycle Flow', () => {

  const residentId = 'resident-001';
  const adminId = 'admin-001';
  const maintenanceId = 'maint-001';
  let complaintId;

  beforeEach(() => jest.clearAllMocks());

  test('USAB-004: Step 1 - Resident creates a complaint', async () => {
    const createdComplaint = {
      _id: 'comp-001',
      complaintId: 'CMP-1717234567890',
      resident: residentId,
      category: 'Plumbing',
      description: 'Leaking tap in bathroom',
      urgency: 'Medium',
      status: 'Open',
    };
    mockComplaintCreate.mockResolvedValue(createdComplaint);

    const req = {
      user: { _id: residentId },
      body: { category: 'Plumbing', description: 'Leaking tap in bathroom' },
    };
    const res = mockRes();
    await createComplaint(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    complaintId = createdComplaint._id;
  });

  test('USAB-005: Step 2 - Admin sees the complaint in their dashboard', async () => {
    const allComplaints = [
      { _id: 'comp-001', complaintId: 'CMP-100', status: 'Open', resident: { name: 'Test', roomNumber: 'A-101' } },
    ];
    mockComplaintFind.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(allComplaints),
      }),
    });

    const req = { user: { _id: adminId, role: 'Admin' } };
    const res = mockRes();
    await getComplaints(req, res);

    const returned = res.json.mock.calls[0][0];
    expect(returned.length).toBeGreaterThan(0);
    expect(returned[0].status).toBe('Open');
  });

  test('USAB-006: Step 3 - Admin assigns complaint to maintenance worker', async () => {
    const complaint = {
      _id: 'comp-001',
      complaintId: 'CMP-100',
      assignedTo: null,
      save: jest.fn().mockResolvedValue({ _id: 'comp-001', assignedTo: maintenanceId }),
    };
    mockComplaintFindById.mockResolvedValue(complaint);
    mockUserFindById.mockResolvedValue({ name: 'Worker A' });
    mockAuditLogCreate.mockResolvedValue({});

    const req = {
      params: { id: 'comp-001' },
      user: { _id: adminId, role: 'Admin', name: 'Admin' },
      body: { staffId: maintenanceId },
    };
    const res = mockRes();
    await assignComplaint(req, res);

    expect(res.json).toHaveBeenCalled();
    expect(complaint.save).toHaveBeenCalled();
  });

  test('USAB-007: Step 4 - Maintenance updates status to In Progress', async () => {
    const complaint = {
      _id: 'comp-001',
      status: 'Open',
      assignedTo: { toString: () => maintenanceId },
      complaintId: 'CMP-100',
      save: jest.fn().mockResolvedValue({ _id: 'comp-001', status: 'In Progress' }),
    };
    mockComplaintFindById.mockResolvedValue(complaint);
    mockAuditLogCreate.mockResolvedValue({});

    const req = {
      params: { id: 'comp-001' },
      user: { _id: maintenanceId, role: 'Maintenance', name: 'Worker A' },
      body: { status: 'In Progress' },
    };
    const res = mockRes();
    await updateComplaintStatus(req, res);

    expect(complaint.save).toHaveBeenCalled();
  });

  test('USAB-008: Step 5 - Maintenance resolves complaint with remarks', async () => {
    const complaint = {
      _id: 'comp-001',
      status: 'In Progress',
      assignedTo: { toString: () => maintenanceId },
      complaintId: 'CMP-100',
      resolutionRemarks: '',
      save: jest.fn().mockResolvedValue({ _id: 'comp-001', status: 'Resolved' }),
    };
    mockComplaintFindById.mockResolvedValue(complaint);
    mockAuditLogCreate.mockResolvedValue({});

    const req = {
      params: { id: 'comp-001' },
      user: { _id: maintenanceId, role: 'Maintenance', name: 'Worker A' },
      body: { status: 'Resolved', resolutionRemarks: 'Replaced the tap washer. Fixed.' },
    };
    const res = mockRes();
    await updateComplaintStatus(req, res);

    expect(complaint.save).toHaveBeenCalled();
  });

  test('USAB-009: Step 6 - Resident sees resolved complaint in their list', async () => {
    mockComplaintFind.mockReturnValue({
      populate: jest.fn().mockResolvedValue([
        { complaintId: 'CMP-100', status: 'Resolved', assignedTo: { name: 'Worker A' } },
      ]),
    });

    const req = { user: { _id: residentId, role: 'Resident' } };
    const res = mockRes();
    await getComplaints(req, res);

    const returned = res.json.mock.calls[0][0];
    expect(returned[0].status).toBe('Resolved');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// FLOW 3: Visitor Registration → Admin Approval → Resident Views Status
// Resident registers visitor, Admin approves, Resident sees updated status.
// ═════════════════════════════════════════════════════════════════════════════

describe('Usability: Visitor Registration → Approval Flow', () => {

  const residentId = 'resident-001';
  const adminId = 'admin-001';

  beforeEach(() => jest.clearAllMocks());

  test('USAB-010: Step 1 - Resident registers a student visitor', async () => {
    mockVisitorSave.mockResolvedValue({
      _id: 'vis-001',
      visitorName: 'Friend Name',
      visitorType: 'Student',
      studentId: 'STU-200',
      status: 'Pending',
    });

    const req = {
      user: { _id: residentId },
      body: {
        visitorName: 'Friend Name',
        visitorType: 'Student',
        studentId: 'STU-200',
        expectedDate: '2026-06-15T14:00:00',
      },
    };
    const res = mockRes();
    await createVisitor(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('USAB-011: Step 2 - Admin sees pending visitor in queue', async () => {
    mockVisitorFind.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          { _id: 'vis-001', visitorName: 'Friend Name', status: 'Pending', resident: { name: 'Test', roomNumber: 'A-101' } },
        ]),
      }),
    });

    const req = { user: { _id: adminId, role: 'Admin' } };
    const res = mockRes();
    await getVisitors(req, res);

    const returned = res.json.mock.calls[0][0];
    expect(returned[0].status).toBe('Pending');
  });

  test('USAB-012: Step 3 - Admin approves the visitor', async () => {
    const visitor = {
      _id: 'vis-001',
      visitorName: 'Friend Name',
      status: 'Pending',
      save: jest.fn().mockResolvedValue({ _id: 'vis-001', status: 'Approved' }),
    };
    mockVisitorFindById.mockResolvedValue(visitor);
    mockAuditLogCreate.mockResolvedValue({});

    const req = {
      params: { id: 'vis-001' },
      user: { _id: adminId, role: 'Admin', name: 'Admin' },
      body: { status: 'Approved' },
    };
    const res = mockRes();
    await updateVisitorStatus(req, res);

    expect(visitor.save).toHaveBeenCalled();
  });

  test('USAB-013: Step 4 - Resident sees approved visitor in their list', async () => {
    mockVisitorFind.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { _id: 'vis-001', visitorName: 'Friend Name', status: 'Approved' },
      ]),
    });

    const req = { user: { _id: residentId, role: 'Resident' } };
    const res = mockRes();
    await getVisitors(req, res);

    const returned = res.json.mock.calls[0][0];
    expect(returned[0].status).toBe('Approved');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// FLOW 4: Emergency Report → Admin Notification → Resolution
// Resident reports emergency, Admin sees it, Admin resolves it.
// ═════════════════════════════════════════════════════════════════════════════

describe('Usability: Emergency Report → Resolution Flow', () => {

  const residentId = 'resident-001';
  const adminId = 'admin-001';

  beforeEach(() => jest.clearAllMocks());

  test('USAB-014: Step 1 - Resident reports an emergency', async () => {
    mockEmergencySave.mockResolvedValue({
      _id: 'emrg-001',
      resident: residentId,
      status: 'Active',
    });

    const req = { user: { _id: residentId } };
    const res = mockRes();
    await reportEmergency(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('USAB-015: Step 2 - Admin sees active emergency in dashboard', async () => {
    mockEmergencyFind.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: 'emrg-001', status: 'Active', resident: { name: 'Test', roomNumber: 'A-101', email: 'test@iba.edu.pk' } },
          ]),
        }),
      }),
    });

    const req = { user: { _id: adminId, role: 'Admin' }, query: {} };
    const res = mockRes();
    await getEmergencies(req, res);

    const returned = res.json.mock.calls[0][0];
    expect(returned.length).toBeGreaterThan(0);
    expect(returned[0].status).toBe('Active');
  });

  test('USAB-016: Step 3 - Admin resolves the emergency', async () => {
    const emergency = {
      _id: 'emrg-001',
      status: 'Active',
      save: jest.fn().mockResolvedValue({ _id: 'emrg-001', status: 'Resolved' }),
    };
    mockEmergencyFindById.mockResolvedValue(emergency);

    const req = {
      params: { id: 'emrg-001' },
      user: { _id: adminId, role: 'Admin' },
    };
    const res = mockRes();
    await resolveEmergency(req, res);

    expect(emergency.status).toBe('Resolved');
    expect(emergency.save).toHaveBeenCalled();
  });
});
