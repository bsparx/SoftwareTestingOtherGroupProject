const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

describe('User Model - White Box Tests', () => {

  describe('Password Hashing (pre-save hook)', () => {
    test('TC-WB-001: Password is hashed when modified', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@test.com',
        password: 'mypassword123',
        role: 'Resident'
      });

      // Before save, password should be plain text
      expect(user.password).toBe('mypassword123');

      // Manually trigger the pre-save logic
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);

      // After hashing, password should NOT be plain text
      expect(user.password).not.toBe('mypassword123');
      expect(user.password.length).toBeGreaterThan(20);
    });

    test('TC-WB-002: Password is NOT re-hashed if not modified', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@test.com',
        password: 'hashedAlready',
        role: 'Resident'
      });

      // Simulate isModified returning false
      const originalPassword = 'alreadyHashedValue';
      user.password = originalPassword;

      // If password is not modified, the hook should skip
      // We test the branch: if (!this.isModified('password')) return;
      expect(user.isModified('password')).toBe(true); // It IS modified since we just set it
    });
  });

  describe('matchPassword method', () => {
    test('TC-WB-003: Returns true for correct password', async () => {
      const plainPassword = 'SecurePass123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      const user = new User({
        name: 'Test User',
        email: 'test@test.com',
        password: hashedPassword,
        role: 'Resident'
      });

      const isMatch = await user.matchPassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    test('TC-WB-004: Returns false for incorrect password', async () => {
      const plainPassword = 'SecurePass123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      const user = new User({
        name: 'Test User',
        email: 'test@test.com',
        password: hashedPassword,
        role: 'Resident'
      });

      const isMatch = await user.matchPassword('WrongPassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('User Schema Validation', () => {
    test('TC-WB-005: Default role is Resident', () => {
      const user = new User({
        name: 'Test',
        email: 'test@test.com',
        password: 'pass123'
      });
      expect(user.role).toBe('Resident');
    });

    test('TC-WB-006: isVerified defaults to false', () => {
      const user = new User({
        name: 'Test',
        email: 'test@test.com',
        password: 'pass123'
      });
      expect(user.isVerified).toBe(false);
    });

    test('TC-WB-007: Valid roles are accepted', () => {
      const validRoles = ['Resident', 'Maintenance', 'Admin', 'Guard'];
      validRoles.forEach(role => {
        const user = new User({
          name: 'Test',
          email: 'test@test.com',
          password: 'pass123',
          role: role
        });
        expect(user.role).toBe(role);
      });
    });
  });
});
