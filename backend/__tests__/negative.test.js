/**
 * Negative Testing
 * Checks invalid inputs and unauthorized actions.
 * Ensures the system properly rejects bad data and blocks unauthorized access.
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockUserFindOne = jest.fn();
const mockUserCreate = jest.fn();
const mockUserFindById = jest.fn();
const mockComplaintCreate = jest.fn();
const mockComplaintFind = jest.fn();
const mockComplaintFindById = jest.fn();
const mockVisitorSave = jest.fn();
const mockVisitorFindById = jest.fn();
const mockEmergencySave = jest.fn();
const mockEmergencyFindById = jest.fn();
const mockAuditLogCreate = jest.fn();

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
  V.find = jest.fn();
  V.findById = mockVisitorFindById;
  V.updateMany = jest.fn().mockResolvedValue({});
  return V;
});

jest.mock('../models/Emergency', () => {
  const E = jest.fn((d) => ({ ...d, save: mockEmergencySave }));
  E.find = jest.fn();
  E.findById = mockEmergencyFindById;
  return E;
});

jest.mock('../models/AuditLog', () => ({
  create: mockAuditLogCreate,
  find: jest.fn()
}));

jest.mock('../utils/sendEmail', () => jest.fn());

const { registerUser, loginUser, verifyEmail } = require('../controllers/authController');
const { createComplaint, getComplaints, updateComplaintStatus, updateComplaintUrgency, assignComplaint } = require('../controllers/complaintController');
const { createVisitor, updateVisitorStatus } = require('../controllers/visitorController');
const { reportEmergency, resolveEmergency } = require('../controllers/emergencyController');
const { authorizeRoles, protect } = require('../middleware/authMiddleware');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ═════════════════════════════════════════════════════════════════════════════
// AUTH — Invalid Registration Inputs
// ═════════════════════════════════════════════════════════════════════════════

describe('Negative: Auth - Invalid Registration', () => {

  beforeEach(() => jest.clearAllMocks());

  test('NEG-001: Register with already-existing email returns 400', async () => {
    mockUserFindOne.mockResolvedValue({ email: 'taken@test.com' });

    const req = { body: { name: 'Test', email: 'taken@test.com', password: 'pass', role: 'Resident' } };
    const res = mockRes();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('already exists'),
    }));
  });

  test('NEG-002: Register when User.create returns null returns 400', async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue(null);

    const req = { body: { name: 'Test', email: 'new@test.com', password: 'pass', role: 'Resident' } };
    const res = mockRes();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid user data',
    }));
  });

  test('NEG-003: Register with empty name (missing required field)', async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockRejectedValue(new Error('User validation failed: name: Path `name` is required.'));

    const req = { body: { name: '', email: 'new@test.com', password: 'pass', role: 'Resident' } };
    const res = mockRes();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('NEG-004: Register with invalid role value', async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockRejectedValue(new Error('User validation failed: role: `SuperAdmin` is not a valid enum value'));

    const req = { body: { name: 'Test', email: 'new@test.com', password: 'pass', role: 'SuperAdmin' } };
    const res = mockRes();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AUTH — Invalid Login Inputs
// ═════════════════════════════════════════════════════════════════════════════

describe('Negative: Auth - Invalid Login', () => {

  beforeEach(() => jest.clearAllMocks());

  test('NEG-005: Login with non-existent email returns 401', async () => {
    mockUserFindOne.mockResolvedValue(null);

    const req = { body: { email: 'nobody@test.com', password: 'pass' } };
    const res = mockRes();
    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid email or password',
    }));
  });

  test('NEG-006: Login with wrong password returns 401', async () => {
    mockUserFindOne.mockResolvedValue({
      email: 'user@test.com',
      isVerified: true,
      matchPassword: jest.fn().mockResolvedValue(false),
    });

    const req = { body: { email: 'user@test.com', password: 'wrongpass' } };
    const res = mockRes();
    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('NEG-007: Login with unverified email returns 401', async () => {
    mockUserFindOne.mockResolvedValue({
      email: 'user@test.com',
      isVerified: false,
      matchPassword: jest.fn().mockResolvedValue(true),
    });

    const req = { body: { email: 'user@test.com', password: 'correct' } };
    const res = mockRes();
    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('verify'),
    }));
  });

  test('NEG-008: Login with empty email and password', async () => {
    mockUserFindOne.mockResolvedValue(null);

    const req = { body: { email: '', password: '' } };
    const res = mockRes();
    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AUTH — Invalid Email Verification
// ═════════════════════════════════════════════════════════════════════════════

describe('Negative: Auth - Invalid Verification', () => {

  beforeEach(() => jest.clearAllMocks());

  test('NEG-009: Verify with invalid/expired token returns 400', async () => {
    mockUserFindOne.mockResolvedValue(null);

    const req = { params: { token: 'invalid-token-123' } };
    const res = mockRes();
    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Invalid or expired'),
    }));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// COMPLAINTS — Invalid Inputs
// ═════════════════════════════════════════════════════════════════════════════

describe('Negative: Complaints - Invalid Inputs', () => {

  beforeEach(() => jest.clearAllMocks());

  test('NEG-010: Create complaint with invalid category throws DB error', async () => {
    mockComplaintCreate.mockRejectedValue(new Error('Complaint validation failed: category: `InvalidCat` is not a valid enum value'));

    const req = { user: { _id: 'r1' }, body: { category: 'InvalidCat', description: 'Test' } };
    const res = mockRes();
    await createComplaint(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('NEG-011: Create complaint with missing description throws DB error', async () => {
    mockComplaintCreate.mockRejectedValue(new Error('Complaint validation failed: description: Path `description` is required'));

    const req = { user: { _id: 'r1' }, body: { category: 'Plumbing', description: '' } };
    const res = mockRes();
    await createComplaint(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('NEG-012: Update complaint status with invalid ID returns 404', async () => {
    mockComplaintFindById.mockResolvedValue(null);

    const req = { params: { id: 'nonexistent' }, user: { _id: 'a1', role: 'Admin', name: 'Admin' }, body: { status: 'Resolved' } };
    const res = mockRes();
    await updateComplaintStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('NEG-013: Update urgency with invalid value returns 400', async () => {
    const req = { params: { id: 'c1' }, user: { _id: 'a1', role: 'Admin', name: 'Admin' }, body: { urgency: 'Critical' } };
    const res = mockRes();
    await updateComplaintUrgency(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid urgency level',
    }));
  });

  test('NEG-014: Update urgency on non-existent complaint returns 404', async () => {
    mockComplaintFindById.mockResolvedValue(null);

    const req = { params: { id: 'bad-id' }, user: { _id: 'a1', role: 'Admin', name: 'Admin' }, body: { urgency: 'High' } };
    const res = mockRes();
    await updateComplaintUrgency(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('NEG-015: Assign complaint to staff when complaint not found returns 404', async () => {
    mockComplaintFindById.mockResolvedValue(null);

    const req = { params: { id: 'bad' }, user: { _id: 'a1', role: 'Admin', name: 'Admin' }, body: { staffId: 's1' } };
    const res = mockRes();
    await assignComplaint(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('NEG-016: Maintenance worker jumps Open → Resolved (blocked)', async () => {
    mockComplaintFindById.mockResolvedValue({
      _id: 'c1',
      status: 'Open',
      assignedTo: { toString: () => 'maint-1' },
      complaintId: 'CMP-100',
      save: jest.fn(),
    });

    const req = { params: { id: 'c1' }, user: { _id: 'maint-1', role: 'Maintenance', name: 'Worker' }, body: { status: 'Resolved' } };
    const res = mockRes();
    await updateComplaintStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Cannot jump'),
    }));
  });

  test('NEG-017: Maintenance resolves without remarks (blocked)', async () => {
    mockComplaintFindById.mockResolvedValue({
      _id: 'c1',
      status: 'In Progress',
      assignedTo: { toString: () => 'maint-1' },
      complaintId: 'CMP-100',
      save: jest.fn(),
    });

    const req = { params: { id: 'c1' }, user: { _id: 'maint-1', role: 'Maintenance', name: 'Worker' }, body: { status: 'Resolved', resolutionRemarks: '' } };
    const res = mockRes();
    await updateComplaintStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Remarks are required'),
    }));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// VISITORS — Invalid Inputs
// ═════════════════════════════════════════════════════════════════════════════

describe('Negative: Visitors - Invalid Inputs', () => {

  beforeEach(() => jest.clearAllMocks());

  test('NEG-018: Create visitor without visitorType returns 400', async () => {
    const req = { user: { _id: 'r1' }, body: { visitorName: 'Test' } };
    const res = mockRes();
    await createVisitor(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Visitor Type'),
    }));
  });

  test('NEG-019: Create Student visitor without studentId returns 400', async () => {
    const req = { user: { _id: 'r1' }, body: { visitorName: 'Test', visitorType: 'Student' } };
    const res = mockRes();
    await createVisitor(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Student ID'),
    }));
  });

  test('NEG-020: Create Outsider visitor without CNIC returns 400', async () => {
    const req = { user: { _id: 'r1' }, body: { visitorName: 'Test', visitorType: 'Outsider' } };
    const res = mockRes();
    await createVisitor(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('CNIC'),
    }));
  });

  test('NEG-021: Create visitor during curfew hours returns 400', async () => {
    const req = { user: { _id: 'r1' }, body: { visitorName: 'Test', visitorType: 'Student', studentId: 'S1', expectedDate: '2026-06-15T23:00:00' } };
    const res = mockRes();
    await createVisitor(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('NEG-022: Reject visitor without reason returns 400', async () => {
    mockVisitorFindById.mockResolvedValue({ _id: 'v1', visitorName: 'Test', status: 'Pending', save: jest.fn() });

    const req = { params: { id: 'v1' }, user: { _id: 'a1', role: 'Admin', name: 'Admin' }, body: { status: 'Rejected' } };
    const res = mockRes();
    await updateVisitorStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Rejection reason'),
    }));
  });

  test('NEG-023: Reject visitor with empty reason returns 400', async () => {
    mockVisitorFindById.mockResolvedValue({ _id: 'v1', visitorName: 'Test', status: 'Pending', save: jest.fn() });

    const req = { params: { id: 'v1' }, user: { _id: 'a1', role: 'Admin', name: 'Admin' }, body: { status: 'Rejected', rejectReason: '   ' } };
    const res = mockRes();
    await updateVisitorStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('NEG-024: Update visitor with non-existent ID returns 404', async () => {
    mockVisitorFindById.mockResolvedValue(null);

    const req = { params: { id: 'bad' }, user: { _id: 'a1', role: 'Admin', name: 'Admin' }, body: { status: 'Approved' } };
    const res = mockRes();
    await updateVisitorStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// EMERGENCY — Invalid Inputs
// ═════════════════════════════════════════════════════════════════════════════

describe('Negative: Emergency - Invalid Inputs', () => {

  beforeEach(() => jest.clearAllMocks());

  test('NEG-025: Resolve non-existent emergency returns 404', async () => {
    mockEmergencyFindById.mockResolvedValue(null);

    const req = { params: { id: 'bad' }, user: { _id: 'a1' } };
    const res = mockRes();
    await resolveEmergency(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('not found'),
    }));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE — Unauthorized Access
// ═════════════════════════════════════════════════════════════════════════════

describe('Negative: Middleware - Unauthorized Access', () => {

  let req, res, next;

  beforeEach(() => {
    req = { user: { role: 'Resident' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('NEG-026: Resident cannot access Admin-only route (getUsers)', () => {
    const middleware = authorizeRoles('Admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('NEG-027: Maintenance cannot access Admin-only route', () => {
    req.user.role = 'Maintenance';
    const middleware = authorizeRoles('Admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('NEG-028: Guard cannot access Resident-only route', () => {
    req.user.role = 'Guard';
    const middleware = authorizeRoles('Resident');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('NEG-029: Resident cannot access Admin+Maintenance route', () => {
    const middleware = authorizeRoles('Admin', 'Maintenance');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('NEG-030: protect middleware rejects missing token', async () => {
    const noTokenReq = { headers: {} };
    await protect(noTokenReq, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('NEG-031: protect middleware rejects invalid Bearer token', async () => {
    const badTokenReq = { headers: { authorization: 'Bearer invalidtoken' } };
    await protect(badTokenReq, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('NEG-032: protect middleware rejects non-Bearer auth header', async () => {
    const basicReq = { headers: { authorization: 'Basic sometoken' } };
    await protect(basicReq, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// CROSS-ROLE — Unauthorized Actions
// ═════════════════════════════════════════════════════════════════════════════

describe('Negative: Cross-Role Unauthorized Actions', () => {

  beforeEach(() => jest.clearAllMocks());

  test('NEG-033: Maintenance worker cannot update complaint assigned to another worker', async () => {
    mockComplaintFindById.mockResolvedValue({
      _id: 'c1',
      assignedTo: { toString: () => 'other-worker' },
      status: 'In Progress',
      complaintId: 'CMP-100',
      save: jest.fn(),
    });

    const req = {
      params: { id: 'c1' },
      user: { _id: 'my-worker', role: 'Maintenance', name: 'MyWorker' },
      body: { status: 'Resolved', resolutionRemarks: 'Fixed' },
    };
    const res = mockRes();
    await updateComplaintStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Not authorized'),
    }));
  });

  test('NEG-034: Database error in getComplaints returns 500', async () => {
    mockComplaintFind.mockImplementation(() => { throw new Error('DB connection lost'); });

    const req = { user: { _id: 'r1', role: 'Resident' } };
    const res = mockRes();
    await getComplaints(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('NEG-035: Database error in reportEmergency returns 500', async () => {
    mockEmergencySave.mockRejectedValue(new Error('DB write failed'));

    const req = { user: { _id: 'r1' } };
    const res = mockRes();
    await reportEmergency(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
