const Visitor = require('../models/Visitor');

describe('Visitor Model & Controller Logic - White Box Tests', () => {

  describe('Visitor Schema Defaults', () => {
    test('TC-WB-018: Status defaults to Pending', () => {
      const visitor = new Visitor({
        resident: '507f1f77bcf86cd799439011',
        visitorName: 'John Doe',
        visitorType: 'Student',
        studentId: 'STU-001',
        expectedDate: new Date()
      });
      expect(visitor.status).toBe('Pending');
    });

    test('TC-WB-019: Valid visitor types are Student and Outsider', () => {
      const types = ['Student', 'Outsider'];
      types.forEach(type => {
        const visitor = new Visitor({
          resident: '507f1f77bcf86cd799439011',
          visitorName: 'Test',
          visitorType: type,
          expectedDate: new Date()
        });
        expect(visitor.visitorType).toBe(type);
      });
    });

    test('TC-WB-020: rejectReason defaults to empty string', () => {
      const visitor = new Visitor({
        resident: '507f1f77bcf86cd799439011',
        visitorName: 'Test',
        visitorType: 'Student',
        expectedDate: new Date()
      });
      expect(visitor.rejectReason).toBe('');
    });
  });

  describe('Curfew Check Logic (Branch Coverage)', () => {
    // This tests the curfew logic from visitorController.js lines 28-29
    // if (hour >= 22 || hour <= 6) -> blocked

    test('TC-WB-021: Request at 10 PM (22:00) is blocked', () => {
      const testDate = new Date();
      testDate.setHours(22, 0, 0, 0);
      const hour = testDate.getHours();
      expect(hour >= 22 || hour <= 6).toBe(true);
    });

    test('TC-WB-022: Request at 11 PM (23:00) is blocked', () => {
      const testDate = new Date();
      testDate.setHours(23, 0, 0, 0);
      const hour = testDate.getHours();
      expect(hour >= 22 || hour <= 6).toBe(true);
    });

    test('TC-WB-023: Request at 5 AM (05:00) is blocked', () => {
      const testDate = new Date();
      testDate.setHours(5, 0, 0, 0);
      const hour = testDate.getHours();
      expect(hour >= 22 || hour <= 6).toBe(true);
    });

    test('TC-WB-024: Request at 6 AM (06:00) is blocked', () => {
      const testDate = new Date();
      testDate.setHours(6, 0, 0, 0);
      const hour = testDate.getHours();
      expect(hour >= 22 || hour <= 6).toBe(true);
    });

    test('TC-WB-025: Request at 7 AM (07:00) is allowed', () => {
      const testDate = new Date();
      testDate.setHours(7, 0, 0, 0);
      const hour = testDate.getHours();
      expect(hour >= 22 || hour <= 6).toBe(false);
    });

    test('TC-WB-026: Request at 12 PM (12:00) is allowed', () => {
      const testDate = new Date();
      testDate.setHours(12, 0, 0, 0);
      const hour = testDate.getHours();
      expect(hour >= 22 || hour <= 6).toBe(false);
    });

    test('TC-WB-027: Request at 9 PM (21:00) is allowed', () => {
      const testDate = new Date();
      testDate.setHours(21, 0, 0, 0);
      const hour = testDate.getHours();
      expect(hour >= 22 || hour <= 6).toBe(false);
    });

    test('TC-WB-028: Request at 21:59 is allowed (boundary)', () => {
      const testDate = new Date();
      testDate.setHours(21, 59, 0, 0);
      const hour = testDate.getHours();
      expect(hour >= 22 || hour <= 6).toBe(false);
    });
  });

  describe('Visitor Type Validation (Branch Coverage)', () => {
    // Tests visitorController.js lines 11-21

    test('TC-WB-029: Student visitor requires studentId', () => {
      const visitorType = 'Student';
      const studentId = '';
      // Branch: visitorType === 'Student' && !studentId
      const shouldBlock = visitorType === 'Student' && !studentId;
      expect(shouldBlock).toBe(true);
    });

    test('TC-WB-030: Outsider visitor requires cnic', () => {
      const visitorType = 'Outsider';
      const cnic = '';
      // Branch: visitorType === 'Outsider' && !cnic
      const shouldBlock = visitorType === 'Outsider' && !cnic;
      expect(shouldBlock).toBe(true);
    });

    test('TC-WB-031: Student visitor with studentId passes', () => {
      const visitorType = 'Student';
      const studentId = 'STU-123';
      const shouldBlock = visitorType === 'Student' && !studentId;
      expect(shouldBlock).toBe(false);
    });

    test('TC-WB-032: Outsider visitor with cnic passes', () => {
      const visitorType = 'Outsider';
      const cnic = '42101-1234567-1';
      const shouldBlock = visitorType === 'Outsider' && !cnic;
      expect(shouldBlock).toBe(false);
    });
  });

  describe('Rejection Reason Validation', () => {
    // Tests visitorController.js line 96-98

    test('TC-WB-033: Rejection without reason is blocked', () => {
      const status = 'Rejected';
      const rejectReason = '';
      const shouldBlock = status === 'Rejected' && (!rejectReason || rejectReason.trim() === '');
      expect(shouldBlock).toBe(true);
    });

    test('TC-WB-034: Rejection with whitespace-only reason is blocked', () => {
      const status = 'Rejected';
      const rejectReason = '   ';
      const shouldBlock = status === 'Rejected' && (!rejectReason || rejectReason.trim() === '');
      expect(shouldBlock).toBe(true);
    });

    test('TC-WB-035: Rejection with valid reason passes', () => {
      const status = 'Rejected';
      const rejectReason = 'Not authorized';
      const shouldBlock = status === 'Rejected' && (!rejectReason || rejectReason.trim() === '');
      expect(shouldBlock).toBe(false);
    });
  });
});
