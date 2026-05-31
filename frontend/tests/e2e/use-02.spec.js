import { expect, test } from '@playwright/test';

test('USE-02: Core workflows, such as submitting a complaint or requesting a visitor, shall require no more than three screen transitions from the main dashboard.', async ({ page }) => {
  const residentEmail = process.env.PW_RESIDENT_EMAIL;
  const residentPassword = process.env.PW_RESIDENT_PASSWORD;
  const useRealLogin = Boolean(residentEmail && residentPassword);

  if (!useRealLogin) {
    const userInfo = {
      name: 'Test Resident',
      role: 'Resident',
      token: 'test-token',
      roomNumber: 'A1',
    };

    await page.addInitScript((value) => {
      window.localStorage.setItem('userInfo', value);
    }, JSON.stringify(userInfo));

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'authorization,content-type',
    };

    await page.route('**/api/complaints', async (route) => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: '[]',
        });
        return;
      }
      if (method === 'POST') {
        await route.fulfill({
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: '{}',
        });
        return;
      }

      await route.continue();
    });

    await page.route('**/api/visitors', async (route) => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: '[]',
        });
        return;
      }
      if (method === 'POST') {
        await route.fulfill({
          status: 201,
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
    await page.locator('input[type="email"]').fill(residentEmail);
    await page.locator('input[type="password"]').fill(residentPassword);
    await page.getByRole('button', { name: 'Login' }).click();
  } else {
    await page.goto('/');
  }

  await expect(page.getByRole('heading', { name: /Welcome,/i })).toBeVisible();

  // Interpret a screen transition as a URL change in the main frame.
  let transitionCount = 0;
  let tracking = true;

  page.on('framenavigated', (frame) => {
    if (!tracking) return;
    if (frame === page.mainFrame()) transitionCount += 1;
  });

  const baseline = transitionCount;

  await page.getByRole('button', { name: /Report an Issue/i }).click();
  const complaintModal = page.locator('.modal-content', { hasText: 'Report an Issue' });
  await expect(complaintModal).toBeVisible();
  await complaintModal.locator('textarea.modal-textarea').fill('Leaky faucet in room A1.');
  await complaintModal.getByRole('button', { name: /Submit/i }).click();
  await expect(complaintModal).toHaveCount(0);

  const complaintTransitions = transitionCount - baseline;
  expect(complaintTransitions).toBeLessThanOrEqual(3);

  const afterComplaint = transitionCount;

  await page.getByRole('button', { name: /Register a Visitor/i }).click();
  const visitorModal = page.locator('.modal-content', { hasText: 'Register a Visitor' });
  await expect(visitorModal).toBeVisible();

  const visitorTextInputs = visitorModal.locator('input[type="text"]');
  await visitorTextInputs.nth(0).fill('Test Visitor');
  await visitorTextInputs.nth(1).fill('S12345');
  await visitorModal.locator('input[type="datetime-local"]').fill('2026-06-01T12:00');
  await visitorModal.getByRole('button', { name: /Submit Request/i }).click();
  await expect(visitorModal).toHaveCount(0);

  const visitorTransitions = transitionCount - afterComplaint;
  expect(visitorTransitions).toBeLessThanOrEqual(3);

  tracking = false;
});
