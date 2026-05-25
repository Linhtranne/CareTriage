import { test, expect } from '@playwright/test';

test.describe('Profile Management Epic (US-003)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a patient
    await page.goto('/login');
    await page.fill('input[name="email"]', 'patient@caretriage.com');
    await page.fill('input[name="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/patient/dashboard');
  });

  test('T-014/T-015: Should update profile and upload avatar', async ({ page }) => {
    await page.goto('/profile');
    
    // Check if profile is loaded
    await expect(page.locator('h3')).toContainText('Patient');

    // Open edit modal
    await page.click('button:has-text("Chỉnh sửa")');
    
    // Update name
    await page.fill('input[name="fullName"]', 'Updated Patient Name');
    await page.fill('input[name="phone"]', '0987654321');
    
    // Save
    await page.click('button:has-text("Lưu thay đổi")');
    
    // Verify toast success
    await expect(page.locator('text=Cập nhật hồ sơ thành công')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Updated Patient Name');

    // Avatar Upload (Mocking file chooser)
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Tải ảnh từ máy")'), // Trigger via menu
    ]);
    await fileChooser.setFiles('tests/assets/test-avatar.jpg');

    // Wait for upload and save (frontend does this in handleFileChange)
    await expect(page.locator('text=Cập nhật hồ sơ thành công')).toBeVisible();
    
    // Refresh and verify
    await page.reload();
    await expect(page.locator('h3')).toContainText('Updated Patient Name');
  });
});
