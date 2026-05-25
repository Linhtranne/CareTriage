import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login and then register', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Login/i);
    
    await page.click('text=ĐĂNG KÝ NGAY');
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('text=ĐĂNG KÝ')).toBeVisible();
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'invalid@example.com');
    await page.fill('#login-password', 'wrongpassword');
    await page.click('button:has-text("ĐĂNG NHẬP")');
    
    // Đợi message lỗi xuất hiện
    await expect(page.locator('text=Thông tin đăng nhập không chính xác')).toBeVisible();
  });
});
