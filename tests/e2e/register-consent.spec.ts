import { test, expect } from '@playwright/test';

test('merchant register: scroll-to-bottom unlocks consent, 5-doc agreement writes 5 consents', async ({ page }) => {
  const email = `e2e_merchant_${Date.now()}@example.com`;
  const merchantName = `测试商家_${Date.now()}`;
  const password = 'abc12345';

  await page.goto('/zh/merchant/register');

  // Merchant register form has 4 required inputs in this order:
  //   1. text   — merchantName
  //   2. email  — email
  //   3. password — password
  //   4. password — confirmPassword
  await page.locator('input[type="text"]').first().fill(merchantName);
  await page.locator('input[type="email"]').first().fill(email);
  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.nth(0).fill(password);
  await passwordInputs.nth(1).fill(password);

  await page.locator('form button[type="submit"]').click();

  // Lands on combined legal page (with role=merchant)
  await expect(page).toHaveURL(/\/zh\/legal\/combined/);

  const agreeBtn = page.locator('footer button:has-text("同意并继续入驻")');
  await expect(agreeBtn).toBeDisabled();

  await page.locator('#legal-end-sentinel').scrollIntoViewIfNeeded();

  await page.locator('footer input[type="checkbox"]:not([disabled])').first().check();
  await expect(agreeBtn).toBeEnabled();
  await agreeBtn.click();

  // Auto-submits back on merchant register page → /zh/merchant/dashboard
  await expect(page).toHaveURL(/\/zh\/merchant\/dashboard/, { timeout: 10_000 });
});
