import { test, expect } from '@playwright/test';

test.describe('商家登录', () => {
  test('未登录访问 dashboard → 跳 login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/zh/merchant/dashboard');
    await page.waitForURL(/merchant\/login/);
    expect(page.url()).toContain('/merchant/login');
  });

  test('登录页有邮箱/密码字段 + 暗金登录按钮', async ({ page }) => {
    await page.goto('/zh/merchant/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /登录/ }).first()).toBeVisible();
  });
});
