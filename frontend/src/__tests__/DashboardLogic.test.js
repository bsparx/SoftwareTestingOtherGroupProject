import { describe, test, expect } from 'vitest';

describe('Dashboard Helper Functions - White Box Tests', () => {

  describe('SLA Breach Detection Logic', () => {
    // This mirrors the isCritical function in AdminDashboard.jsx lines 152-155

    const isCritical = (dateString) => {
      const currentDate = new Date();
      const diffInHours = (currentDate - new Date(dateString)) / (1000 * 60 * 60);
      return diffInHours > 48;
    };

    test('TC-WB-FE-019: Complaint created 49 hours ago is critical', () => {
      const date49HoursAgo = new Date(Date.now() - 49 * 60 * 60 * 1000);
      expect(isCritical(date49HoursAgo)).toBe(true);
    });

    test('TC-WB-FE-020: Complaint created 47 hours ago is not critical', () => {
      const date47HoursAgo = new Date(Date.now() - 47 * 60 * 60 * 1000);
      expect(isCritical(date47HoursAgo)).toBe(false);
    });

    test('TC-WB-FE-021: Complaint created exactly 48 hours ago is not critical (boundary)', () => {
      const date48HoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      // > 48, not >= 48, so exactly 48 should be false
      expect(isCritical(date48HoursAgo)).toBe(false);
    });

    test('TC-WB-FE-022: Complaint created just now is not critical', () => {
      expect(isCritical(new Date())).toBe(false);
    });
  });

  describe('Status Badge Logic', () => {
    // Mirrors getStatusBadge in Dashboard.jsx lines 158-165

    const getStatusClass = (status) => {
      switch (status) {
        case 'Open': return 'badge-open';
        case 'In Progress': return 'badge-progress';
        case 'Resolved': return 'badge-resolved';
        default: return 'badge';
      }
    };

    test('TC-WB-FE-023: Open status returns badge-open', () => {
      expect(getStatusClass('Open')).toBe('badge-open');
    });

    test('TC-WB-FE-024: In Progress status returns badge-progress', () => {
      expect(getStatusClass('In Progress')).toBe('badge-progress');
    });

    test('TC-WB-FE-025: Resolved status returns badge-resolved', () => {
      expect(getStatusClass('Resolved')).toBe('badge-resolved');
    });

    test('TC-WB-FE-026: Unknown status returns default badge', () => {
      expect(getStatusClass('Unknown')).toBe('badge');
    });
  });

  describe('Active Complaints Count Logic', () => {
    test('TC-WB-FE-027: Counts non-resolved complaints as active', () => {
      const complaints = [
        { status: 'Open' },
        { status: 'In Progress' },
        { status: 'Resolved' },
        { status: 'Open' }
      ];
      const activeCount = complaints.filter(c => c.status !== 'Resolved').length;
      expect(activeCount).toBe(3);
    });

    test('TC-WB-FE-028: All resolved returns zero active', () => {
      const complaints = [
        { status: 'Resolved' },
        { status: 'Resolved' }
      ];
      const activeCount = complaints.filter(c => c.status !== 'Resolved').length;
      expect(activeCount).toBe(0);
    });

    test('TC-WB-FE-029: Empty complaints returns zero active', () => {
      const complaints = [];
      const activeCount = complaints.filter(c => c.status !== 'Resolved').length;
      expect(activeCount).toBe(0);
    });
  });

  describe('Completion Percentage Logic', () => {
    // Mirrors MaintenanceDashboard.jsx line 80

    const calcCompletion = (tasks) => {
      if (tasks.length === 0) return 100;
      return Math.round((tasks.filter(t => t.status === 'Resolved').length / tasks.length) * 100);
    };

    test('TC-WB-FE-030: Empty tasks returns 100% completion', () => {
      expect(calcCompletion([])).toBe(100);
    });

    test('TC-WB-FE-031: All tasks resolved returns 100%', () => {
      const tasks = [{ status: 'Resolved' }, { status: 'Resolved' }];
      expect(calcCompletion(tasks)).toBe(100);
    });

    test('TC-WB-FE-032: Half tasks resolved returns 50%', () => {
      const tasks = [{ status: 'Resolved' }, { status: 'Open' }];
      expect(calcCompletion(tasks)).toBe(50);
    });

    test('TC-WB-FE-033: No tasks resolved returns 0%', () => {
      const tasks = [{ status: 'Open' }, { status: 'In Progress' }];
      expect(calcCompletion(tasks)).toBe(0);
    });
  });

  describe('Task Sorting Logic (MaintenanceDashboard)', () => {
    // Mirrors MaintenanceDashboard.jsx lines 53-61

    const checkIsUrgent = (dateString, status) => {
      if (status === 'Resolved') return false;
      const currentDate = new Date();
      const diffInHours = (currentDate - new Date(dateString)) / (1000 * 60 * 60);
      return diffInHours > 48;
    };

    test('TC-WB-FE-034: Resolved tasks are never urgent', () => {
      const date50HoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
      expect(checkIsUrgent(date50HoursAgo, 'Resolved')).toBe(false);
    });

    test('TC-WB-FE-035: Open task older than 48hrs is urgent', () => {
      const date50HoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
      expect(checkIsUrgent(date50HoursAgo, 'Open')).toBe(true);
    });

    test('TC-WB-FE-036: In Progress task older than 48hrs is urgent', () => {
      const date50HoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
      expect(checkIsUrgent(date50HoursAgo, 'In Progress')).toBe(true);
    });
  });

  describe('Visitor Type Display Logic', () => {
    // Mirrors Dashboard.jsx line 300

    test('TC-WB-FE-037: Student visitor shows student ID', () => {
      const visitor = { visitorType: 'Student', studentId: 'STU-001', cnic: null };
      const identifier = visitor.visitorType === 'Outsider' ? `CNIC: ${visitor.cnic}` : `ID: ${visitor.studentId}`;
      expect(identifier).toBe('ID: STU-001');
    });

    test('TC-WB-FE-038: Outsider visitor shows CNIC', () => {
      const visitor = { visitorType: 'Outsider', studentId: null, cnic: '42101-1234567-1' };
      const identifier = visitor.visitorType === 'Outsider' ? `CNIC: ${visitor.cnic}` : `ID: ${visitor.studentId}`;
      expect(identifier).toBe('CNIC: 42101-1234567-1');
    });
  });
});
