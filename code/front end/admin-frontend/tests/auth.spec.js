import { test, expect } from '@playwright/test';

test.describe('Admin Authentication Flow', () => {
  test('should show login page with admin branding', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=ADMIN PORTAL')).toBeVisible();
    await expect(page.locator('text=Hệ thống quản trị CareTriage')).toBeVisible();
  });

  test('should validate empty inputs', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("ĐĂNG NHẬP HỆ THỐNG")');
    await expect(page.locator('text=Vui lòng điền đầy đủ thông tin')).toBeVisible();
  });
});
