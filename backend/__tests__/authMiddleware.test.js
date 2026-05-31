const jwt = require('jsonwebtoken');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

describe('Auth Middleware - White Box Tests', () => {

  describe('authorizeRoles Function (Branch Coverage)', () => {
    // Tests authMiddleware.js lines 28-37

    let req, res, next;

    beforeEach(() => {
      req = { user: { role: 'Resident', name: 'Test' } };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    test('TC-WB-036: Admin role is authorized when Admin is allowed', () => {
      req.user.role = 'Admin';
      const middleware = authorizeRoles('Admin');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('TC-WB-037: Resident role is blocked when only Admin is allowed', () => {
      req.user.role = 'Resident';
      const middleware = authorizeRoles('Admin');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('TC-WB-038: Maintenance role is authorized for Admin+Maintenance', () => {
      req.user.role = 'Maintenance';
      const middleware = authorizeRoles('Admin', 'Maintenance');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('TC-WB-039: Guard role is blocked for Admin-only routes', () => {
      req.user.role = 'Guard';
      const middleware = authorizeRoles('Admin');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('not authorized')
        })
      );
    });

    test('TC-WB-040: Resident role is authorized for Resident-only routes', () => {
      req.user.role = 'Resident';
      const middleware = authorizeRoles('Resident');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('TC-WB-041: 403 response includes correct user role in message', () => {
      req.user.role = 'Guard';
      const middleware = authorizeRoles('Admin');
      middleware(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Guard')
        })
      );
    });
  });

  describe('protect Middleware (Token Validation)', () => {
    let req, res, next;

    beforeEach(() => {
      req = { headers: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    test('TC-WB-042: No token returns 401', async () => {
      // No Authorization header
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('no token')
        })
      );
    });

    test('TC-WB-043: Invalid token returns 401', async () => {
      req.headers.authorization = 'Bearer invalidtoken123';
      // jwt.verify will throw for invalid token
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('TC-WB-044: Non-Bearer authorization header returns 401', async () => {
      req.headers.authorization = 'Basic sometoken';
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
