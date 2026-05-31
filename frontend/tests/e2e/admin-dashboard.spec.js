import { expect, test } from '@playwright/test';

test('ADMIN-01: Admin dashboard workflows are reachable.', async ({ page }) => {
  const adminEmail = process.env.PW_ADMIN_EMAIL;
  const adminPassword = process.env.PW_ADMIN_PASSWORD;
  const useRealLogin = Boolean(adminEmail && adminPassword);

  if (!useRealLogin) {
    const userInfo = {
      name: 'Admin User',
      role: 'Admin',
      token: 'test-token',
    };

    await page.addInitScript((value) => {
      window.localStorage.setItem('userInfo', value);
    }, JSON.stringify(userInfo));

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'authorization,content-type',
    };

    const complaints = [
      {
        _id: 'c1',
        complaintId: 'CMP-001',
        category: 'Plumbing',
        description: 'Leaky faucet in room B2.',
        urgency: 'High',
        status: 'Open',
        createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString(),
        resident: { name: 'Ali', roomNumber: 'B2' },
        assignedTo: { _id: 's1', name: 'Staff One' },
      },
    ];

    const staff = [{ _id: 's1', name: 'Staff One' }];

    const visitors = [
      {
        _id: 'v1',
        visitorName: 'Sara',
        visitorType: 'Student',
        studentId: 'S12345',
        expectedDate: new Date().toISOString(),
        status: 'Pending',
        resident: { name: 'Ali', roomNumber: 'B2' },
      },
    ];

    const users = [
      {
        _id: 'u1',
        name: 'Ali',
        email: 'ali@example.com',
        role: 'Resident',
        roomNumber: 'B2',
      },
    ];

    const auditLogs = [
      {
        _id: 'a1',
        action: 'LOGIN',
        details: 'Admin logged in',
        createdAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }

      if (method === 'GET' && url.includes('/api/complaints/staff')) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(staff),
        });
        return;
      }

      if (method === 'GET' && url.includes('/api/complaints')) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(complaints),
        });
        return;
      }

      if (method === 'GET' && url.includes('/api/users/audit-logs')) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(auditLogs),
        });
        return;
      }

      if (method === 'GET' && url.includes('/api/users')) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(users),
        });
        return;
      }

      if (method === 'GET' && url.includes('/api/visitors')) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(visitors),
        });
        return;
      }

      if (method === 'GET' && url.includes('/api/emergencies')) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify([]),
        });
        return;
      }

      if (method === 'PUT' || method === 'POST') {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: '{}',
        });
        return;
      }

      await route.continue();
    });
  }

  if (useRealLogin) {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').fill(adminPassword);
    await page.getByRole('button', { name: 'Login' }).click();
  } else {
    await page.goto('/admin');
  }

  await expect(page.getByRole('heading', { name: /Welcome to the Control Room/i })).toBeVisible();
  await expect(page.getByText('Total Open Tickets')).toBeVisible();

  await page.locator('.sidebar-nav li', { hasText: 'Complaints' }).click();
  await expect(page.getByRole('heading', { name: /The Maintenance "Control Room"/i })).toBeVisible();
  if (!useRealLogin) {
    await expect(page.getByText('CMP-001')).toBeVisible();
  }

  await page.locator('.sidebar-nav li', { hasText: 'Visitors' }).click();
  await expect(page.getByRole('heading', { name: /Visitor Approval Queue/i })).toBeVisible();
  if (!useRealLogin) {
    await expect(page.getByText('Sara')).toBeVisible();

    await page.getByRole('button', { name: 'Reject' }).click();
    const rejectModal = page.locator('.modal-content', { hasText: 'Reject Visitor Request' });
    await expect(rejectModal).toBeVisible();
    await rejectModal.locator('textarea.modal-textarea').fill('Scheduling conflict.');
    await rejectModal.getByRole('button', { name: /Confirm Rejection/i }).click();
    await expect(rejectModal).toHaveCount(0);
  }

  await page.locator('.sidebar-nav li', { hasText: 'Users' }).click();
  await expect(page.getByRole('heading', { name: /User Management & Audit Trail/i })).toBeVisible();
  if (!useRealLogin) {
    await expect(page.getByText('ali@example.com')).toBeVisible();
  }

  await page.locator('.sidebar-nav li', { hasText: 'Emergencies' }).click();
  await expect(page.getByRole('heading', { name: /Active Emergencies/i })).toBeVisible();
});
