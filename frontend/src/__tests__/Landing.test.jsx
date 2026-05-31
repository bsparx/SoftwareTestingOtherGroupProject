import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../context/AuthContext', () => ({
  AuthContext: React.createContext({
    user: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  }),
  AuthProvider: ({ children }) => children
}));

import Landing from '../pages/Landing';

describe('Landing Page - White Box Tests', () => {

  test('TC-WB-FE-014: Landing page renders main heading', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(screen.getByText(/Hostel Maintenance for IBA Students/i)).toBeInTheDocument();
  });

  test('TC-WB-FE-015: Landing page has login button', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(screen.getByText(/Login And Start Using/i)).toBeInTheDocument();
  });

  test('TC-WB-FE-016: Landing page has register link', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(screen.getByText(/Register here/i)).toBeInTheDocument();
  });

  test('TC-WB-FE-017: Landing page shows IBA branding', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(screen.getByText('IBA')).toBeInTheDocument();
  });

  test('TC-WB-FE-018: Landing page has nav login link', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
