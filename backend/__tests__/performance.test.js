/**
 * Basic Performance Testing
 * Checks response time under normal usage on the available setup.
 * Measures how long each controller function takes to complete.
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
const mockVisitorFind = jest.fn();
const mockEmergencySave = jest.fn();
const mockEmergencyFindById = jest.fn();
const mockEmergencyFind = jest.fn();
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

jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(true));

const { registerUser, loginUser } = require('../controllers/authController');
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

/**
 * Measures execution time of an async function in milliseconds.
 */
const measureTime = async (fn) => {
  const start = process.hrtime.bigint();
  await fn();
  const end = process.hrtime.bigint();
  return Number(end - start) / 1_000_000; // convert ns to ms
};

// ═════════════════════════════════════════════════════════════════════════════
// Individual Function Response Times
// Each controller function should complete within 50ms (unit-level).
// ═════════════════════════════════════════════════════════════════════════════

describe('Performance: Individual Function Response Times', () => {

  beforeEach(() => jest.clearAllMocks());

  test('PERF-001: registerUser completes within 50ms', async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ _id: 'u1', email: 't@t.com' });

    const req = { body: { name: 'Test', email: 't@t.com', password: 'pass', role: 'Resident' } };
    const time = await measureTime(() => registerUser(req, mockRes()));
    expect(time).toBeLessThan(50);
  });

  test('PERF-002: loginUser (failed) completes within 50ms', async () => {
    mockUserFindOne.mockResolvedValue(null);

    const req = { body: { email: 'x@x.com', password: 'p' } };
    const time = await measureTime(() => loginUser(req, mockRes()));
    expect(time).toBeLessThan(50);
  });

  test('PERF-003: createComplaint completes within 50ms', async () => {
    mockComplaintCreate.mockResolvedValue({ _id: 'c1', complaintId: 'CMP-1' });

    const req = { user: { _id: 'r1' }, body: { category: 'Plumbing', description: 'Test' } };
    const time = await measureTime(() => createComplaint(req, mockRes()));
    expect(time).toBeLessThan(50);
  });

  test('PERF-004: getComplaints (Resident) completes within 50ms', async () => {
    mockComplaintFind.mockReturnValue({
      populate: jest.fn().mockResolvedValue(Array(10).fill({ status: 'Open' })),
    });

    const req = { user: { _id: 'r1', role: 'Resident' } };
    const time = await measureTime(() => getComplaints(req, mockRes()));
    expect(time).toBeLessThan(50);
  });

  test('PERF-005: getComplaints (Admin) completes within 50ms', async () => {
    mockComplaintFind.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(Array(50).fill({ status: 'Open' })),
      }),
    });

    const req = { user: { _id: 'a1', role: 'Admin' } };
    const time = await measureTime(() => getComplaints(req, mockRes()));
    expect(time).toBeLessThan(50);
  });

  test('PERF-006: assignComplaint completes within 50ms', async () => {
    mockComplaintFindById.mockResolvedValue({
      _id: 'c1', complaintId: 'CMP-1', save: jest.fn().mockResolvedValue({}),
    });
    mockUserFindById.mockResolvedValue({ name: 'Staff' });
    mockAuditLogCreate.mockResolvedValue({});

    const req = { params: { id: 'c1' }, user: { _id: 'a1', role: 'Admin', name: 'Admin' }, body: { staffId: 's1' } };
    const time = await measureTime(() => assignComplaint(req, mockRes()));
    expect(time).toBeLessThan(50);
  });

  test('PERF-007: updateComplaintStatus completes within 50ms', async () => {
    mockComplaintFindById.mockResolvedValue({
      _id: 'c1', status: 'Open', assignedTo: { toString: () => 'm1' },
      complaintId: 'CMP-1', save: jest.fn().mockResolvedValue({}),
    });
    mockAuditLogCreate.mockResolvedValue({});

    const req = { params: { id: 'c1' }, user: { _id: 'm1', role: 'Maintenance', name: 'W' }, body: { status: 'In Progress' } };
    const time = await measureTime(() => updateComplaintStatus(req, mockRes()));
    expect(time).toBeLessThan(50);
  });

  test('PERF-008: updateComplaintUrgency completes within 50ms', async () => {
    mockComplaintFindById.mockResolvedValue({
      _id: 'c1', urgency: 'Low', complaintId: 'CMP-1', save: jest.fn().mockResolvedValue({}),
    });
    mockAuditLogCreate.mockResolvedValue({});

    const req = { params: { id: 'c1' }, user: { _id: 'a1', role: 'Admin', name: 'Admin' }, body: { urgency: 'High' } };
    const time = await measureTime(() => updateComplaintUrgency(req, mockRes()));
    expect(time).toBeLessThan(50);
  });

  test('PERF-009: createVisitor completes within 50ms', async () => {
    mockVisitorSave.mockResolvedValue({ _id: 'v1', status: 'Pending' });

    const req = { user: { _id: 'r1' }, body: { visitorName: 'V', visitorType: 'Student', studentId: 'S1', expectedDate: '2026-06-15T14:00:00' } };
    const time = await measureTime(() => createVisitor(req, mockRes()));
    expect(time).toBeLessThan(50);
  });

  test('PERF-010: updateVisitorStatus completes within 50ms', async () => {
    mockVisitorFindById.mockResolvedValue({
      _id: 'v1', visitorName: 'V', status: 'Pending', save: jest.fn().mockResolvedValue({}),
    });
    mockAuditLogCreate.mockResolvedValue({});

    const req = { params: { id: 'v1' }, user: { _id: 'a1', role: 'Admin', name: 'Admin' }, body: { status: 'Approved' } };
    const time = await measureTime(() => updateVisitorStatus(req, mockRes()));
    expect(time).toBeLessThan(50);
  });

  test('PERF-011: reportEmergency completes within 50ms', async () => {
    mockEmergencySave.mockResolvedValue({ _id: 'e1', status: 'Active' });

    const req = { user: { _id: 'r1' } };
    const time = await measureTime(() => reportEmergency(req, mockRes()));
    expect(time).toBeLessThan(50);
  });

  test('PERF-012: resolveEmergency completes within 50ms', async () => {
    mockEmergencyFindById.mockResolvedValue({
      _id: 'e1', status: 'Active', save: jest.fn().mockResolvedValue({}),
    });

    const req = { params: { id: 'e1' }, user: { _id: 'a1' } };
    const time = await measureTime(() => resolveEmergency(req, mockRes()));
    expect(time).toBeLessThan(50);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Concurrent Execution — Multiple calls in parallel
// Simulates multiple users hitting the system simultaneously.
// ═════════════════════════════════════════════════════════════════════════════

describe('Performance: Concurrent Operations', () => {

  beforeEach(() => jest.clearAllMocks());

  test('PERF-013: 100 concurrent getComplaints calls complete within 500ms', async () => {
    mockComplaintFind.mockReturnValue({
      populate: jest.fn().mockResolvedValue([]),
    });

    const calls = Array(100).fill(null).map(() => {
      const req = { user: { _id: 'r1', role: 'Resident' } };
      return getComplaints(req, mockRes());
    });

    const time = await measureTime(() => Promise.all(calls));
    expect(time).toBeLessThan(500);
  });

  test('PERF-014: 100 concurrent createComplaint calls complete within 500ms', async () => {
    mockComplaintCreate.mockResolvedValue({ _id: 'c1' });

    let counter = 0;
    const calls = Array(100).fill(null).map(() => {
      counter++;
      const req = { user: { _id: 'r1' }, body: { category: 'Plumbing', description: `Issue ${counter}` } };
      return createComplaint(req, mockRes());
    });

    const time = await measureTime(() => Promise.all(calls));
    expect(time).toBeLessThan(500);
  });

  test('PERF-015: 50 concurrent login attempts complete within 500ms', async () => {
    mockUserFindOne.mockResolvedValue(null);

    const calls = Array(50).fill(null).map(() => {
      const req = { body: { email: 'test@test.com', password: 'pass' } };
      return loginUser(req, mockRes());
    });

    const time = await measureTime(() => Promise.all(calls));
    expect(time).toBeLessThan(500);
  });

  test('PERF-016: 50 concurrent visitor registrations complete within 500ms', async () => {
    mockVisitorSave.mockResolvedValue({ _id: 'v1' });

    const calls = Array(50).fill(null).map(() => {
      const req = { user: { _id: 'r1' }, body: { visitorName: 'V', visitorType: 'Student', studentId: 'S1', expectedDate: '2026-06-15T14:00:00' } };
      return createVisitor(req, mockRes());
    });

    const time = await measureTime(() => Promise.all(calls));
    expect(time).toBeLessThan(500);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Large Dataset Handling — Performance with many records
// ═════════════════════════════════════════════════════════════════════════════

describe('Performance: Large Dataset Handling', () => {

  beforeEach(() => jest.clearAllMocks());

  test('PERF-017: getComplaints handles 1000 records within 100ms', async () => {
    const largeDataset = Array(1000).fill(null).map((_, i) => ({
      complaintId: `CMP-${i}`,
      status: 'Open',
      category: 'Plumbing',
    }));
    mockComplaintFind.mockReturnValue({
      populate: jest.fn().mockResolvedValue(largeDataset),
    });

    const req = { user: { _id: 'a1', role: 'Admin' } };
    const time = await measureTime(() => getComplaints(req, mockRes()));
    expect(time).toBeLessThan(100);
  });

  test('PERF-018: getEmergencies handles 500 records within 100ms', async () => {
    const largeDataset = Array(500).fill(null).map((_, i) => ({
      _id: `e-${i}`,
      status: i % 2 === 0 ? 'Active' : 'Resolved',
    }));
    mockEmergencyFind.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(largeDataset),
        }),
      }),
    });

    const req = { user: { _id: 'a1', role: 'Admin' } };
    const time = await measureTime(() => getEmergencies(req, mockRes()));
    expect(time).toBeLessThan(100);
  });

  test('PERF-019: getVisitors handles 500 records within 100ms', async () => {
    const largeDataset = Array(500).fill(null).map((_, i) => ({
      _id: `v-${i}`,
      visitorName: `Visitor ${i}`,
      status: 'Approved',
    }));
    mockVisitorFind.mockReturnValue({
      sort: jest.fn().mockResolvedValue(largeDataset),
    });

    const req = { user: { _id: 'r1', role: 'Resident' } };
    const time = await measureTime(() => getVisitors(req, mockRes()));
    expect(time).toBeLessThan(100);
  });
});
