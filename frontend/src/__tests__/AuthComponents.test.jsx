import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Use vi.hoisted for mock functions so they are available when vi.mock is hoisted
const { mockLogin, mockRegister, mockLogout } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockRegister: vi.fn(),
  mockLogout: vi.fn()
}));

vi.mock('../context/AuthContext', () => ({
  AuthContext: React.createContext({
    user: null,
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout
  }),
  AuthProvider: ({ children }) => children
}));

import Login from '../pages/Login';
import Register from '../pages/Register';

describe('Login Component - White Box Tests', () => {

  test('TC-WB-FE-001: Login form renders email input', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('your.email@iba.edu.pk')).toBeInTheDocument();
  });

  test('TC-WB-FE-002: Login form renders password input', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  test('TC-WB-FE-003: Login form has submit button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('TC-WB-FE-004: Email input updates state on change', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const emailInput = screen.getByPlaceholderText('your.email@iba.edu.pk');
    fireEvent.change(emailInput, { target: { value: 'test@iba.edu.pk' } });
    expect(emailInput.value).toBe('test@iba.edu.pk');
  });

  test('TC-WB-FE-005: Password input updates state on change', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
    expect(passwordInput.value).toBe('mypassword');
  });

  test('TC-WB-FE-006: Login form has required attributes', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const emailInput = screen.getByPlaceholderText('your.email@iba.edu.pk');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  test('TC-WB-FE-007: Login page has link to register', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText(/create an account/i)).toBeInTheDocument();
  });
});

describe('Register Component - White Box Tests', () => {

  test('TC-WB-FE-008: Register form renders all required fields', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('Ex. Syed Hasan')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your.email@iba.edu.pk')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
  });

  test('TC-WB-FE-009: Register form has role selector', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByDisplayValue('Resident')).toBeInTheDocument();
  });

  test('TC-WB-FE-010: Room number field appears when Resident is selected', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('e.g. A-101')).toBeInTheDocument();
  });

  test('TC-WB-FE-011: Role change updates form state', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    const roleSelect = screen.getByDisplayValue('Resident');
    fireEvent.change(roleSelect, { target: { value: 'Admin' } });
    expect(roleSelect.value).toBe('Admin');
  });

  test('TC-WB-FE-012: Register form has submit button', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  test('TC-WB-FE-013: Register page has link to login', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByText(/login here/i)).toBeInTheDocument();
  });
});
