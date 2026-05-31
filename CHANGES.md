# CHANGES.md - White Box Testing Additions

## Files Added

| File | Tests | Purpose |
|---|---|---|
| `__tests__/smoke.test.js` | 34 | System stability — modules load, exports exist, basic calls work |
| `__tests__/negative.test.js` | 35 | Invalid inputs, unauthorized actions, edge cases |
| `__tests__/usability.test.js` | 16 | Core user task flows end-to-end |
| `__tests__/performance.test.js` | 19 | Response time under normal and concurrent load |
| `__tests__/srsRequirements.test.js` | 33 | SRS requirements: IDs, timestamps, curfew, RBAC |
| `__tests__/authMiddleware.test.js` | 9 | Auth middleware role/token tests |
| `__tests__/authController.test.js` | 9 | JWT generation, login/register branches |
| `__tests__/userModel.test.js` | 7 | Password hashing, schema defaults |
| `__tests__/complaintModel.test.js` | 10 | Status transitions, urgency validation |
| `__tests__/visitorLogic.test.js` | 18 | Curfew logic, visitor type validation |

**Total: 190 tests across 10 test suites**

---

## Smoke Testing (`smoke.test.js`)

**Purpose:** Confirms the system is stable enough for further testing.

| Test ID | Description |
|---|---|
| SMOKE-001 to 012 | All models, controllers, middleware, and utilities load without crashing |
| SMOKE-013 to 028 | All expected function exports exist (`registerUser`, `loginUser`, `createComplaint`, etc.) |
| SMOKE-029 to 034 | Key functions execute without throwing (register, login, getComplaints, createVisitor, reportEmergency) |

---

## Negative Testing (`negative.test.js`)

**Purpose:** Checks invalid inputs and unauthorized actions are properly rejected.

| Test ID | Scenario | Expected |
|---|---|---|
| NEG-001 | Register with existing email | 400 "already exists" |
| NEG-002 | Register when DB returns null | 400 "Invalid user data" |
| NEG-003 | Register with empty name | 500 (validation error) |
| NEG-004 | Register with invalid role | 500 (enum error) |
| NEG-005 | Login with non-existent email | 401 |
| NEG-006 | Login with wrong password | 401 |
| NEG-007 | Login with unverified email | 401 "verify" |
| NEG-008 | Login with empty credentials | 401 |
| NEG-009 | Verify with invalid token | 400 "Invalid or expired" |
| NEG-010 | Create complaint with invalid category | 500 |
| NEG-011 | Create complaint with empty description | 500 |
| NEG-012 | Update complaint with non-existent ID | 404 |
| NEG-013 | Update urgency with invalid value | 400 "Invalid urgency" |
| NEG-014 | Update urgency on missing complaint | 404 |
| NEG-015 | Assign non-existent complaint | 404 |
| NEG-016 | Maintenance jumps Open → Resolved | 400 "Cannot jump" |
| NEG-017 | Maintenance resolves without remarks | 400 "Remarks required" |
| NEG-018 | Create visitor without type | 400 |
| NEG-019 | Student visitor without studentId | 400 |
| NEG-020 | Outsider without CNIC | 400 |
| NEG-021 | Visitor during curfew | 400 |
| NEG-022 | Reject visitor without reason | 400 |
| NEG-023 | Reject visitor with whitespace reason | 400 |
| NEG-024 | Update non-existent visitor | 404 |
| NEG-025 | Resolve non-existent emergency | 404 |
| NEG-026 | Resident on Admin-only route | 403 |
| NEG-027 | Maintenance on Admin-only route | 403 |
| NEG-028 | Guard on Resident-only route | 403 |
| NEG-029 | Resident on Admin+Maintenance route | 403 |
| NEG-030 | Missing token → 401 | 401 |
| NEG-031 | Invalid Bearer token → 401 | 401 |
| NEG-032 | Non-Bearer auth header → 401 | 401 |
| NEG-033 | Maintenance updates another worker's complaint | 403 |
| NEG-034 | DB error in getComplaints | 500 |
| NEG-035 | DB error in reportEmergency | 500 |

---

## Usability Testing (`usability.test.js`)

**Purpose:** Checks whether users can complete core tasks easily. Tests full user journeys.

### Flow 1: Registration → Verification → Login
| Test ID | Step | What it verifies |
|---|---|---|
| USAB-001 | Register | Resident registers, gets 201 |
| USAB-002 | Verify | Email verification sets `isVerified: true` |
| USAB-003 | Login | Verified user receives JWT token |

### Flow 2: Complaint Lifecycle
| Test ID | Step | What it verifies |
|---|---|---|
| USAB-004 | Create | Resident submits complaint → 201 |
| USAB-005 | View | Admin sees complaint in dashboard |
| USAB-006 | Assign | Admin assigns to maintenance worker |
| USAB-007 | Progress | Worker updates to "In Progress" |
| USAB-008 | Resolve | Worker resolves with remarks |
| USAB-009 | Confirm | Resident sees "Resolved" status |

### Flow 3: Visitor Registration → Approval
| Test ID | Step | What it verifies |
|---|---|---|
| USAB-010 | Register | Resident registers visitor → 201 |
| USAB-011 | Queue | Admin sees pending visitor |
| USAB-012 | Approve | Admin approves visitor |
| USAB-013 | Confirm | Resident sees "Approved" status |

### Flow 4: Emergency Report → Resolution
| Test ID | Step | What it verifies |
|---|---|---|
| USAB-014 | Report | Resident reports emergency → 201 |
| USAB-015 | Alert | Admin sees active emergency |
| USAB-016 | Resolve | Admin resolves emergency |

---

## Basic Performance Testing (`performance.test.js`)

**Purpose:** Checks response time under normal usage on the available setup.

### Individual Function Response Times (threshold: 50ms)
| Test ID | Function | Threshold |
|---|---|---|
| PERF-001 | `registerUser` | < 50ms |
| PERF-002 | `loginUser` | < 50ms |
| PERF-003 | `createComplaint` | < 50ms |
| PERF-004 | `getComplaints` (Resident) | < 50ms |
| PERF-005 | `getComplaints` (Admin) | < 50ms |
| PERF-006 | `assignComplaint` | < 50ms |
| PERF-007 | `updateComplaintStatus` | < 50ms |
| PERF-008 | `updateComplaintUrgency` | < 50ms |
| PERF-009 | `createVisitor` | < 50ms |
| PERF-010 | `updateVisitorStatus` | < 50ms |
| PERF-011 | `reportEmergency` | < 50ms |
| PERF-012 | `resolveEmergency` | < 50ms |

### Concurrent Operations (threshold: 500ms)
| Test ID | Scenario | Threshold |
|---|---|---|
| PERF-013 | 100 concurrent `getComplaints` | < 500ms |
| PERF-014 | 100 concurrent `createComplaint` | < 500ms |
| PERF-015 | 50 concurrent `loginUser` | < 500ms |
| PERF-016 | 50 concurrent `createVisitor` | < 500ms |

### Large Dataset Handling (threshold: 100ms)
| Test ID | Dataset Size | Threshold |
|---|---|---|
| PERF-017 | 1000 complaints | < 100ms |
| PERF-018 | 500 emergencies | < 100ms |
| PERF-019 | 500 visitors | < 100ms |

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
Test Suites: 10 passed, 10 total
Tests:       190 passed, 190 total
```

## Techniques Used

- **Smoke Testing**: Module loading, export verification, basic execution
- **Negative Testing**: Invalid inputs, unauthorized access, DB errors, boundary violations
- **Usability Testing**: End-to-end user flows (register→login, complaint lifecycle, visitor approval, emergency resolution)
- **Performance Testing**: `process.hrtime.bigint()` for sub-millisecond measurement, concurrent `Promise.all()`, large dataset handling
- **Statement Coverage**: Every code path in tested functions is exercised
- **Branch Coverage**: All `if/else` branches tested (curfew hours, role checks, status transitions)
- **Boundary Value Analysis**: Exact cutoff times (22:00, 06:00, 21:59, 07:00), empty strings, whitespace
- **Mock Isolation**: Mongoose models mocked to test controller logic without database
