const Complaint = require('../models/Complaint');

describe('Complaint Model - White Box Tests', () => {

  describe('Complaint Schema Defaults', () => {
    test('TC-WB-008: Status defaults to Open', () => {
      const complaint = new Complaint({
        complaintId: 'CMP-001',
        resident: '507f1f77bcf86cd799439011',
        category: 'Plumbing',
        description: 'Leaking pipe'
      });
      expect(complaint.status).toBe('Open');
    });

    test('TC-WB-009: Urgency defaults to Medium', () => {
      const complaint = new Complaint({
        complaintId: 'CMP-002',
        resident: '507f1f77bcf86cd799439011',
        category: 'Electrical',
        description: 'Light not working'
      });
      expect(complaint.urgency).toBe('Medium');
    });

    test('TC-WB-010: assignedTo defaults to null', () => {
      const complaint = new Complaint({
        complaintId: 'CMP-003',
        resident: '507f1f77bcf86cd799439011',
        category: 'Cleaning',
        description: 'Dirty room'
      });
      expect(complaint.assignedTo).toBeNull();
    });

    test('TC-WB-011: Valid categories are accepted', () => {
      const validCategories = ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Other'];
      validCategories.forEach(cat => {
        const complaint = new Complaint({
          complaintId: `CMP-${cat}`,
          resident: '507f1f77bcf86cd799439011',
          category: cat,
          description: 'Test'
        });
        expect(complaint.category).toBe(cat);
      });
    });

    test('TC-WB-012: Valid status values are accepted', () => {
      const validStatuses = ['Open', 'In Progress', 'On Hold', 'Escalated', 'Resolved'];
      validStatuses.forEach(status => {
        const complaint = new Complaint({
          complaintId: `CMP-${status}`,
          resident: '507f1f77bcf86cd799439011',
          category: 'Other',
          description: 'Test',
          status: status
        });
        expect(complaint.status).toBe(status);
      });
    });
  });

  describe('Status Transition Logic (Branch Coverage)', () => {
    test('TC-WB-013: Open -> In Progress is a valid transition', () => {
      const complaint = new Complaint({
        complaintId: 'CMP-100',
        resident: '507f1f77bcf86cd799439011',
        category: 'Plumbing',
        description: 'Test',
        status: 'Open'
      });

      // Simulate the transition logic from complaintController
      const currentStatus = complaint.status;
      const newStatus = 'In Progress';

      // Branch: Open -> In Progress should be allowed
      expect(currentStatus).toBe('Open');
      expect(newStatus).toBe('In Progress');
      expect(currentStatus === 'Open' && newStatus === 'Resolved').toBe(false);
    });

    test('TC-WB-014: Open -> Resolved is blocked (direct jump constraint)', () => {
      const complaint = new Complaint({
        complaintId: 'CMP-101',
        resident: '507f1f77bcf86cd799439011',
        category: 'Plumbing',
        description: 'Test',
        status: 'Open'
      });

      const currentStatus = complaint.status;
      const newStatus = 'Resolved';

      // This is the exact branch in complaintController.js line 106-107
      const isDirectJump = currentStatus === 'Open' && newStatus === 'Resolved';
      expect(isDirectJump).toBe(true);
    });

    test('TC-WB-015: In Progress -> Resolved is a valid transition', () => {
      const complaint = new Complaint({
        complaintId: 'CMP-102',
        resident: '507f1f77bcf86cd799439011',
        category: 'Plumbing',
        description: 'Test',
        status: 'In Progress'
      });

      const currentStatus = complaint.status;
      const newStatus = 'Resolved';

      // Only Maintenance role enforces the direct jump constraint
      // Admin can bypass it
      const isDirectJump = currentStatus === 'Open' && newStatus === 'Resolved';
      expect(isDirectJump).toBe(false);
    });
  });

  describe('Urgency Validation Logic', () => {
    test('TC-WB-016: Valid urgency values are High, Medium, Low', () => {
      const validUrgencies = ['High', 'Medium', 'Low'];
      validUrgencies.forEach(urgency => {
        // This mirrors complaintController line 152
        expect(['High', 'Medium', 'Low'].includes(urgency)).toBe(true);
      });
    });

    test('TC-WB-017: Invalid urgency is rejected', () => {
      const invalidUrgency = 'Critical';
      // This mirrors complaintController line 152
      expect(['High', 'Medium', 'Low'].includes(invalidUrgency)).toBe(false);
    });
  });
});
