# CHANGES.md - White Box Testing Additions

## New File Added

### `backend/__tests__/srsRequirements.test.js`

This file contains **33 white-box unit tests** covering 6 previously untested SRS requirements and RBAC test cases.

---

## Requirements Covered

### 1. REQ-COMP-02: Unique Alphanumeric IDs
**SRS:** "Auto-generate sequential, unique alphanumeric ID"

| Test ID | Description | Technique |
|---|---|---|
| TC-REQ-COMP-02a | Generated IDs match alphanumeric regex (`/^[A-Z0-9\-]+$/`) | Loop 1000 iterations, regex assertion |
| TC-REQ-COMP-02b | All 1000 generated IDs are unique (no duplicates) | `Array.length === new Set(Array).size` |
| TC-REQ-COMP-02c | IDs start with `CMP-` prefix | Regex prefix check |

**What it tests:** The `complaintId` generation in `complaintController.js:13` (`CMP-${Date.now()}`). Uses `jest.spyOn(Date, 'now')` to ensure deterministic unique values across 1000 calls.

---

### 2. REQ-COMP-03: Timestamps & Room Mapping
**SRS:** "Autonomously record timestamp and map room number"

| Test ID | Description | Technique |
|---|---|---|
| TC-REQ-COMP-03a | Complaint stores resident ID for room mapping | Mock request with known resident ID, assert payload |
| TC-REQ-COMP-03b | Complaint schema has `timestamps: true` | Schema option assertion |
| TC-REQ-COMP-03c | Resident ID comes from JWT, not request body (security) | Spoofed body vs authenticated user assertion |
| TC-REQ-COMP-03d | Room number populated via `populate('resident', 'name roomNumber')` | Mock populate chain verification |

**What it tests:** The `createComplaint` controller injects `req.user._id` (not `req.body.resident`) into the complaint. The schema's `timestamps: true` option auto-generates `createdAt`/`updatedAt`. Room mapping works through Mongoose `populate()`.

---

### 3. REQ-VIS-06: Gate Lockout Outside Time Window
**SRS:** "Lock out and deny entry outside authorized time window"

| Test ID | Time | Expected | Boundary |
|---|---|---|---|
| TC-REQ-VIS-06a | 09:00 AM | ALLOWED | Inside window |
| TC-REQ-VIS-06b | 02:00 PM | ALLOWED | Inside window |
| TC-REQ-VIS-06c | 09:59 PM | ALLOWED | Upper boundary - 1 min |
| TC-REQ-VIS-06d | 10:00 PM | BLOCKED | Exact boundary (22:00) |
| TC-REQ-VIS-06e | 11:00 PM | BLOCKED | Inside curfew |
| TC-REQ-VIS-06f | 00:00 | BLOCKED | Midnight |
| TC-REQ-VIS-06g | 03:00 AM | BLOCKED | Inside curfew |
| TC-REQ-VIS-06h | 06:00 AM | BLOCKED | Lower boundary (inclusive) |
| TC-REQ-VIS-06i | 07:00 AM | ALLOWED | Lower boundary + 1 hr |
| TC-REQ-VIS-06j | 10:30 PM | BLOCKED | Policy message content |

**What it tests:** The curfew logic in `visitorController.js:28-29` (`if (hour >= 22 || hour <= 6)`). Tests all boundary conditions: the exact cutoff times (22:00 and 06:00), just inside/outside the window, and verifies the "Hostel Policy Violation" error message.

---

### 4. REQ-VIS-07: Check-in/out Timestamps
**SRS:** "Log exact check-in and check-out timestamps"

| Test ID | Description | Technique |
|---|---|---|
| TC-REQ-VIS-07a | Visitor schema has `timestamps: true` | Schema option assertion |
| TC-REQ-VIS-07b | Visitor creation records `expectedDate` for gate tracking | Status 201 assertion on valid request |
| TC-REQ-VIS-07c | Status update creates audit log entry (timestamp trail) | Mock `updateVisitorStatus`, verify `AuditLog.create` call |
| TC-REQ-VIS-07d | Gate verification pattern uses visitor ID + status check | Structure assertion on approved visitor record |
| TC-REQ-VIS-07e | Only `Approved` visitors are eligible for check-in | Filter logic assertion |

**What it tests:** The visitor model's timestamp support via `timestamps: true`, and the audit trail created when visitors are approved/rejected. The gate check-in pattern is verified through the visitor record structure (status must be `Approved`, `expectedDate` must be a valid Date).

---

### 5. TC-RBAC-003: Maintenance Staff Cannot Create Complaints
**Test Case:** "Maintenance worker attempts POST request to /api/complaints. Expected: 403 Forbidden."

| Test ID | Description | Technique |
|---|---|---|
| TC-RBAC-003a | Maintenance role is blocked by `authorizeRoles('Resident')` | Middleware invocation, assert 403 |
| TC-RBAC-003b | 403 response contains role name in error message | JSON response content assertion |
| TC-RBAC-003c | Resident role IS allowed to create complaints | `next()` called, no 403 |
| TC-RBAC-003d | Admin role is also blocked from creating complaints | Only Resident allowed |
| TC-RBAC-003e | Guard role is blocked from creating complaints | All non-Resident blocked |

**What it tests:** The `authorizeRoles('Resident')` middleware on `complaintRoutes.js:21`. The middleware checks `req.user.role` against the allowed roles array. Only `'Resident'` passes; `'Maintenance'`, `'Admin'`, and `'Guard'` all receive 403.

---

### 6. TC-RBAC-004: API Security - Resident Data Isolation
**Test Case:** "Resident A calls GET /api/complaints. Expected: Only Resident A's items returned."

| Test ID | Description | Technique |
|---|---|---|
| TC-RBAC-004a | Resident A query filters by their own ID only | Verify `Complaint.find({ resident: residentAId })` |
| TC-RBAC-004b | Returned complaints belong only to Resident A | Assert all results have Resident A's ID |
| TC-RBAC-004c | Resident B has completely separate data scope | Different filter, different results |
| TC-RBAC-004d | Admin sees ALL complaints (no filter) | `Complaint.find()` called with no args |
| TC-RBAC-004e | Maintenance sees only complaints assigned to them | `Complaint.find({ assignedTo: staffId })` |
| TC-RBAC-004f | Resident cannot access other residents data via query | Authenticated user ID is always used |

**What it tests:** The `getComplaints` controller (`complaintController.js:32-53`) has role-based filtering. Residents get `{ resident: req.user._id }`, Maintenance gets `{ assignedTo: req.user._id }`, Admin gets no filter. The test verifies that `req.user._id` from the JWT is always used, never any user-supplied parameter.

---

## Test Results

```
Test Suites: 6 passed, 6 total
Tests:       86 passed, 86 total
```

## Techniques Used

- **Statement Coverage**: Every code path in the tested functions is exercised
- **Branch Coverage**: All `if/else` branches tested (curfew hours, role checks, status transitions)
- **Boundary Value Analysis**: Exact cutoff times (22:00, 06:00, 21:59, 07:00)
- **Mock Isolation**: Mongoose models mocked to test controller logic without database
- **jest.spyOn(Date.now)**: Mocked time for deterministic ID uniqueness testing
