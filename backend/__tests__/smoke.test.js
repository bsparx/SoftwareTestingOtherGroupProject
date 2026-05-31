/**
 * Smoke Testing
 * Confirms the system is stable enough for further testing.
 * Verifies all modules load, exports exist, and basic calls don't crash.
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../models/User', () => ({ findOne: jest.fn(), create: jest.fn(), findById: jest.fn(), find: jest.fn() }));
jest.mock('../models/Complaint', () => ({ create: jest.fn(), find: jest.fn(), findById: jest.fn() }));
jest.mock('../models/Visitor', () => { const V = jest.fn((d) => ({ ...d, save: jest.fn() })); V.find = jest.fn(); V.findById = jest.fn(); V.updateMany = jest.fn(); return V; });
jest.mock('../models/Emergency', () => { const E = jest.fn((d) => ({ ...d, save: jest.fn() })); E.find = jest.fn(); E.findById = jest.fn(); return E; });
jest.mock('../models/AuditLog', () => ({ create: jest.fn(), find: jest.fn() }));
jest.mock('../utils/sendEmail', () => jest.fn());

// ═════════════════════════════════════════════════════════════════════════════
// 1. Module Loading — All modules import without crashing
// ═════════════════════════════════════════════════════════════════════════════

describe('Smoke: Module Loading', () => {

  test('SMOKE-001: User model loads successfully', () => {
    const User = require('../models/User');
    expect(User).toBeDefined();
  });

  test('SMOKE-002: Complaint model loads successfully', () => {
    const Complaint = require('../models/Complaint');
    expect(Complaint).toBeDefined();
  });

  test('SMOKE-003: Visitor model loads successfully', () => {
    const Visitor = require('../models/Visitor');
    expect(Visitor).toBeDefined();
  });

  test('SMOKE-004: Emergency model loads successfully', () => {
    const Emergency = require('../models/Emergency');
    expect(Emergency).toBeDefined();
  });

  test('SMOKE-005: AuditLog model loads successfully', () => {
    const AuditLog = require('../models/AuditLog');
    expect(AuditLog).toBeDefined();
  });

  test('SMOKE-006: Auth controller loads successfully', () => {
    const auth = require('../controllers/authController');
    expect(auth).toBeDefined();
  });

  test('SMOKE-007: Complaint controller loads successfully', () => {
    const comp = require('../controllers/complaintController');
    expect(comp).toBeDefined();
  });

  test('SMOKE-008: Visitor controller loads successfully', () => {
    const vis = require('../controllers/visitorController');
    expect(vis).toBeDefined();
  });

  test('SMOKE-009: Emergency controller loads successfully', () => {
    const emrg = require('../controllers/emergencyController');
    expect(emrg).toBeDefined();
  });

  test('SMOKE-010: User controller loads successfully', () => {
    const user = require('../controllers/userController');
    expect(user).toBeDefined();
  });

  test('SMOKE-011: Auth middleware loads successfully', () => {
    const mw = require('../middleware/authMiddleware');
    expect(mw).toBeDefined();
  });

  test('SMOKE-012: sendEmail utility loads successfully', () => {
    const sendEmail = require('../utils/sendEmail');
    expect(sendEmail).toBeDefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Export Verification — All expected functions are exported
// ═════════════════════════════════════════════════════════════════════════════

describe('Smoke: Export Verification', () => {

  test('SMOKE-013: Auth controller exports registerUser', () => {
    const { registerUser } = require('../controllers/authController');
    expect(typeof registerUser).toBe('function');
  });

  test('SMOKE-014: Auth controller exports loginUser', () => {
    const { loginUser } = require('../controllers/authController');
    expect(typeof loginUser).toBe('function');
  });

  test('SMOKE-015: Auth controller exports verifyEmail', () => {
    const { verifyEmail } = require('../controllers/authController');
    expect(typeof verifyEmail).toBe('function');
  });

  test('SMOKE-016: Complaint controller exports createComplaint', () => {
    const { createComplaint } = require('../controllers/complaintController');
    expect(typeof createComplaint).toBe('function');
  });

  test('SMOKE-017: Complaint controller exports getComplaints', () => {
    const { getComplaints } = require('../controllers/complaintController');
    expect(typeof getComplaints).toBe('function');
  });

  test('SMOKE-018: Complaint controller exports assignComplaint', () => {
    const { assignComplaint } = require('../controllers/complaintController');
    expect(typeof assignComplaint).toBe('function');
  });

  test('SMOKE-019: Complaint controller exports updateComplaintStatus', () => {
    const { updateComplaintStatus } = require('../controllers/complaintController');
    expect(typeof updateComplaintStatus).toBe('function');
  });

  test('SMOKE-020: Complaint controller exports updateComplaintUrgency', () => {
    const { updateComplaintUrgency } = require('../controllers/complaintController');
    expect(typeof updateComplaintUrgency).toBe('function');
  });

  test('SMOKE-021: Visitor controller exports createVisitor', () => {
    const { createVisitor } = require('../controllers/visitorController');
    expect(typeof createVisitor).toBe('function');
  });

  test('SMOKE-022: Visitor controller exports getVisitors', () => {
    const { getVisitors } = require('../controllers/visitorController');
    expect(typeof getVisitors).toBe('function');
  });

  test('SMOKE-023: Visitor controller exports updateVisitorStatus', () => {
    const { updateVisitorStatus } = require('../controllers/visitorController');
    expect(typeof updateVisitorStatus).toBe('function');
  });

  test('SMOKE-024: Emergency controller exports reportEmergency', () => {
    const { reportEmergency } = require('../controllers/emergencyController');
    expect(typeof reportEmergency).toBe('function');
  });

  test('SMOKE-025: Emergency controller exports getEmergencies', () => {
    const { getEmergencies } = require('../controllers/emergencyController');
    expect(typeof getEmergencies).toBe('function');
  });

  test('SMOKE-026: Emergency controller exports resolveEmergency', () => {
    const { resolveEmergency } = require('../controllers/emergencyController');
    expect(typeof resolveEmergency).toBe('function');
  });

  test('SMOKE-027: Middleware exports protect function', () => {
    const { protect } = require('../middleware/authMiddleware');
    expect(typeof protect).toBe('function');
  });

  test('SMOKE-028: Middleware exports authorizeRoles function', () => {
    const { authorizeRoles } = require('../middleware/authMiddleware');
    expect(typeof authorizeRoles).toBe('function');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Basic Function Calls — Key functions execute without throwing
// ═════════════════════════════════════════════════════════════════════════════

describe('Smoke: Basic Function Execution', () => {

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('SMOKE-029: registerUser handles request without crashing', async () => {
    const { registerUser } = require('../controllers/authController');
    const User = require('../models/User');
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ _id: '1', email: 'test@test.com' });

    const req = { body: { name: 'Test', email: 'test@test.com', password: 'pass', role: 'Resident' } };
    const res = mockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalled();
  });

  test('SMOKE-030: loginUser handles request without crashing', async () => {
    const { loginUser } = require('../controllers/authController');
    const User = require('../models/User');
    User.findOne.mockResolvedValue(null);

    const req = { body: { email: 'x@x.com', password: 'p' } };
    const res = mockRes();
    await loginUser(req, res);
    expect(res.status).toHaveBeenCalled();
  });

  test('SMOKE-031: getComplaints handles Resident request without crashing', async () => {
    const { getComplaints } = require('../controllers/complaintController');
    const Complaint = require('../models/Complaint');
    Complaint.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });

    const req = { user: { _id: 'r1', role: 'Resident' } };
    const res = mockRes();
    await getComplaints(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  test('SMOKE-032: createVisitor handles valid request without crashing', async () => {
    const { createVisitor } = require('../controllers/visitorController');

    const req = {
      user: { _id: 'r1' },
      body: { visitorName: 'Test', visitorType: 'Student', studentId: 'S1', expectedDate: '2026-06-15T14:00:00' },
    };
    const res = mockRes();
    await createVisitor(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('SMOKE-033: reportEmergency handles request without crashing', async () => {
    const { reportEmergency } = require('../controllers/emergencyController');

    const req = { user: { _id: 'r1' } };
    const res = mockRes();
    await reportEmergency(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('SMOKE-034: authorizeRoles returns a middleware function', () => {
    const { authorizeRoles } = require('../middleware/authMiddleware');
    const middleware = authorizeRoles('Admin');
    expect(typeof middleware).toBe('function');
  });
});
