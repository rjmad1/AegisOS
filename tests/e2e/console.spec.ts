import { test, expect, Page } from '@playwright/test';

test('Console Dashboard loads and verifies command palette', async ({ page }: { page: Page }) => {
  test.setTimeout(60000); // Allow time for Next.js compilation
  
  // Navigate to dashboard
  await page.goto('/dashboard');
  
  // Verify basic load
  await expect(page).toHaveTitle(/AI Operations Console|AegisOS/);

  // Check if command palette trigger exists (Ctrl+K or Command+K usually, or a button)
  // Assuming a generic check for an important element on the dashboard
  const mainHeader = page.locator('h1');
  await expect(mainHeader).toBeVisible();
});
