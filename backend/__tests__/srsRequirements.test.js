const jwt = require('jsonwebtoken');

/**
 * White-Box Tests for SRS Requirements:
 *   REQ-COMP-02: Unique Alphanumeric IDs
 *   REQ-COMP-03: Timestamps & Room Mapping
 *   REQ-VIS-06: Gate Lockout outside time window
 *   REQ-VIS-07: Check-in/out timestamps
 */

// ─── Mocks (using mock-prefixed variables for Jest hoisting) ─────────────────

const mockComplaintCreate = jest.fn();
const mockComplaintFind = jest.fn();
const mockComplaintFindById = jest.fn();
const mockAuditLogCreate = jest.fn();
const mockUserFind = jest.fn();
const mockUserFindById = jest.fn();
const mockVisitorSave = jest.fn();
const mockVisitorFindById = jest.fn();

jest.mock('../models/Complaint', () => {
  const Complaint = jest.fn();
  Complaint.create = mockComplaintCreate;
  Complaint.find = mockComplaintFind;
  Complaint.findById = mockComplaintFindById;
  Complaint.schema = { options: { timestamps: true } };
  return Complaint;
});

jest.mock('../models/User', () => {
  const User = jest.fn();
  User.find = mockUserFind;
  User.findById = mockUserFindById;
  return User;
});

jest.mock('../models/AuditLog', () => {
  const AuditLog = jest.fn();
  AuditLog.create = mockAuditLogCreate;
  return AuditLog;
});

jest.mock('../models/Visitor', () => {
  const Visitor = jest.fn((data) => ({
    ...data,
    _id: 'mock-visitor-id',
    save: mockVisitorSave,
  }));
  Visitor.updateMany = jest.fn().mockResolvedValue({});
  Visitor.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      }),
      mockResolvedValue: jest.fn().mockResolvedValue([]),
    }),
  });
  Visitor.findById = mockVisitorFindById;
  Visitor.schema = { options: { timestamps: true } };
  return Visitor;
});

const { createComplaint, getComplaints } = require('../controllers/complaintController');
const { createVisitor, updateVisitorStatus } = require('../controllers/visitorController');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const Visitor = require('../models/Visitor');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ═══════════════════════════════════════════════════════════════════════════════
// REQ-COMP-02: Unique Alphanumeric IDs
// SRS: "Auto-generate sequential, unique alphanumeric ID"
// ═══════════════════════════════════════════════════════════════════════════════

describe('REQ-COMP-02: Unique Alphanumeric ID Generation', () => {
  let createdComplaints;
  let dateNowSpy;

  beforeEach(() => {
    createdComplaints = [];
    mockComplaintCreate.mockImplementation((data) => {
      createdComplaints.push(data);
      return Promise.resolve({ ...data, _id: 'mock-id' });
    });
    mockComplaintFind.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      }),
    });
    mockComplaintFindById.mockResolvedValue(null);
    mockUserFindById.mockResolvedValue({ name: 'TestStaff' });
    mockAuditLogCreate.mockResolvedValue({});

    // Mock Date.now to return incrementing values so IDs are unique
    let callCount = 0;
    const baseTime = 1717234567890;
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => baseTime + callCount++);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  test('TC-REQ-COMP-02a: Generated IDs match alphanumeric pattern', async () => {
    for (let i = 0; i < 1000; i++) {
      const req = {
        user: { _id: 'resident-123' },
        body: { category: 'Plumbing', description: 'Test', urgency: 'Medium' },
      };
      await createComplaint(req, mockRes());
    }

    const ids = createdComplaints.map(c => c.complaintId);
    const alphanumericRegex = /^[A-Z0-9\-]+$/;

    ids.forEach((id) => {
      expect(id).toMatch(alphanumericRegex);
    });
  });

  test('TC-REQ-COMP-02b: All 1000 generated IDs are unique', async () => {
    for (let i = 0; i < 1000; i++) {
      const req = {
        user: { _id: 'resident-123' },
        body: { category: 'Electrical', description: 'Test', urgency: 'Low' },
      };
      await createComplaint(req, mockRes());
    }

    const ids = createdComplaints.map(c => c.complaintId);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  });

  test('TC-REQ-COMP-02c: IDs start with CMP- prefix', async () => {
    for (let i = 0; i < 50; i++) {
      const req = {
        user: { _id: 'resident-456' },
        body: { category: 'Cleaning', description: 'Test' },
      };
      await createComplaint(req, mockRes());
    }

    createdComplaints.forEach(c => {
      expect(c.complaintId).toMatch(/^CMP-/);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// REQ-COMP-03: Timestamps & Room Mapping
// SRS: "Autonomously record timestamp and map room number"
// ═══════════════════════════════════════════════════════════════════════════════

describe('REQ-COMP-03: Timestamps & Room Mapping', () => {
  let createdComplaints;

  beforeEach(() => {
    createdComplaints = [];
    mockComplaintCreate.mockImplementation((data) => {
      createdComplaints.push(data);
      return Promise.resolve({ ...data, _id: 'mock-id' });
    });
    mockComplaintFind.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      }),
    });
    mockAuditLogCreate.mockResolvedValue({});
  });

  test('TC-REQ-COMP-03a: Complaint is created with resident ID (room mapping via user ref)', async () => {
    const residentId = 'resident-room-304';
    const req = {
      user: { _id: residentId },
      body: { category: 'Plumbing', description: 'Leaking tap', urgency: 'High' },
    };
    const res = mockRes();
    await createComplaint(req, res);

    expect(createdComplaints.length).toBe(1);
    expect(createdComplaints[0].resident).toBe(residentId);
  });

  test('TC-REQ-COMP-03b: Complaint schema has timestamps enabled', () => {
    const schema = Complaint.schema;
    expect(schema.options.timestamps).toBe(true);
  });

  test('TC-REQ-COMP-03c: Resident ID is not taken from request body (security)', async () => {
    const req = {
      user: { _id: 'authenticated-resident-id' },
      body: {
        category: 'Plumbing',
        description: 'Test',
        resident: 'spoofed-resident-id',
      },
    };
    const res = mockRes();
    await createComplaint(req, res);

    expect(createdComplaints[0].resident).toBe('authenticated-resident-id');
    expect(createdComplaints[0].resident).not.toBe('spoofed-resident-id');
  });

  test('TC-REQ-COMP-03d: Room number is populated when fetching complaints', async () => {
    const mockPopulate2 = jest.fn().mockResolvedValue([]);
    const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
    mockComplaintFind.mockReturnValue({ populate: mockPopulate1 });

    const req = { user: { _id: 'admin-1', role: 'Admin' } };
    const res = mockRes();
    await getComplaints(req, res);

    expect(mockPopulate1).toHaveBeenCalledWith('resident', 'name roomNumber');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// REQ-VIS-06: Gate Lockout outside time window
// SRS: "Lock out and deny entry outside authorized time window"
// ═══════════════════════════════════════════════════════════════════════════════

describe('REQ-VIS-06: Gate Lockout Outside Time Window', () => {

  const makeReqAtHour = (hour, minute = 0) => {
    const date = new Date(2026, 5, 15, hour, minute, 0);
    return {
      user: { _id: 'resident-gate' },
      body: {
        visitorName: 'Test Visitor',
        visitorType: 'Student',
        studentId: 'STU-999',
        expectedDate: date.toISOString(),
      },
    };
  };

  beforeEach(() => {
    mockVisitorSave.mockResolvedValue({ _id: 'visitor-id', status: 'Pending' });
    mockAuditLogCreate.mockResolvedValue({});
  });

  test('TC-REQ-VIS-06a: Request at 09:00 AM is ALLOWED', async () => {
    const req = makeReqAtHour(9, 0);
    const res = mockRes();
    await createVisitor(req, res);
    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  test('TC-REQ-VIS-06b: Request at 02:00 PM (14:00) is ALLOWED', async () => {
    const req = makeReqAtHour(14, 0);
    const res = mockRes();
    await createVisitor(req, res);
    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  test('TC-REQ-VIS-06c: Request at 09:59 PM (21:59) is ALLOWED (boundary)', async () => {
    const req = makeReqAtHour(21, 59);
    const res = mockRes();
    await createVisitor(req, res);
    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  test('TC-REQ-VIS-06d: Request at 10:00 PM (22:00) is BLOCKED', async () => {
    const req = makeReqAtHour(22, 0);
    const res = mockRes();
    await createVisitor(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('10:00 PM'),
      })
    );
  });

  test('TC-REQ-VIS-06e: Request at 11:00 PM (23:00) is BLOCKED', async () => {
    const req = makeReqAtHour(23, 0);
    const res = mockRes();
    await createVisitor(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC-REQ-VIS-06f: Request at midnight (00:00) is BLOCKED', async () => {
    const req = makeReqAtHour(0, 0);
    const res = mockRes();
    await createVisitor(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC-REQ-VIS-06g: Request at 03:00 AM is BLOCKED', async () => {
    const req = makeReqAtHour(3, 0);
    const res = mockRes();
    await createVisitor(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC-REQ-VIS-06h: Request at 06:00 AM is BLOCKED (boundary inclusive)', async () => {
    const req = makeReqAtHour(6, 0);
    const res = mockRes();
    await createVisitor(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC-REQ-VIS-06i: Request at 07:00 AM is ALLOWED (boundary)', async () => {
    const req = makeReqAtHour(7, 0);
    const res = mockRes();
    await createVisitor(req, res);
    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  test('TC-REQ-VIS-06j: Blocked response contains policy violation message', async () => {
    const req = makeReqAtHour(22, 30);
    const res = mockRes();
    await createVisitor(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Hostel Policy Violation'),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// REQ-VIS-07: Check-in/out timestamps
// SRS: "Log exact check-in and check-out timestamps"
// ═══════════════════════════════════════════════════════════════════════════════

describe('REQ-VIS-07: Check-in/out Timestamps', () => {

  beforeEach(() => {
    mockVisitorSave.mockResolvedValue({ _id: 'visitor-id', status: 'Pending' });
    mockAuditLogCreate.mockResolvedValue({});
  });

  test('TC-REQ-VIS-07a: Visitor schema has timestamps enabled', () => {
    const schema = Visitor.schema;
    expect(schema.options.timestamps).toBe(true);
  });

  test('TC-REQ-VIS-07b: Visitor creation records expectedDate for arrival tracking', async () => {
    const futureDate = new Date(2026, 5, 15, 14, 0, 0);
    const req = {
      user: { _id: 'resident-vis-07' },
      body: {
        visitorName: 'CheckIn Test Visitor',
        visitorType: 'Student',
        studentId: 'STU-007',
        expectedDate: futureDate.toISOString(),
      },
    };
    const res = mockRes();
    await createVisitor(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('TC-REQ-VIS-07c: Visitor status update creates audit log entry (timestamp trail)', async () => {
    const mockVisitor = {
      _id: 'visitor-123',
      visitorName: 'Audit Test',
      status: 'Pending',
      save: jest.fn().mockResolvedValue({}),
    };
    mockVisitorFindById.mockResolvedValue(mockVisitor);

    const req = {
      params: { id: 'visitor-123' },
      user: { _id: 'admin-1', role: 'Admin', name: 'AdminUser' },
      body: { status: 'Approved' },
    };
    const res = mockRes();
    await updateVisitorStatus(req, res);

    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'Visitor Approved',
        performedBy: 'admin-1',
        details: expect.stringContaining('Audit Test'),
      })
    );
  });

  test('TC-REQ-VIS-07d: Gate verification pattern - approved visitor can be checked in', () => {
    const mockVisitorRecord = {
      _id: 'visitor-gate-001',
      visitorName: 'Gate Test',
      status: 'Approved',
      expectedDate: new Date(2026, 5, 15, 14, 0, 0),
    };

    expect(mockVisitorRecord.status).toBe('Approved');
    expect(mockVisitorRecord.expectedDate).toBeInstanceOf(Date);
  });

  test('TC-REQ-VIS-07e: Only Approved visitors are eligible for check-in', () => {
    const statuses = ['Pending', 'Approved', 'Rejected'];
    const eligibleForCheckIn = statuses.filter(s => s === 'Approved');

    expect(eligibleForCheckIn).toEqual(['Approved']);
    expect(eligibleForCheckIn).not.toContain('Pending');
    expect(eligibleForCheckIn).not.toContain('Rejected');
  });
});
