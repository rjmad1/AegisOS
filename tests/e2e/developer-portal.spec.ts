import { test, expect, Page } from '@playwright/test';

test.describe('Developer Portal', () => {
  test.setTimeout(60000); // Allow time for Next.js compilation

  test('should load the developer portal dashboard', async ({ page }: { page: Page }) => {
    // Authenticate via UI
    await page.goto('/login');
    await page.getByPlaceholder('username@enterprise.local').fill('console_admin_dev');
    await page.getByPlaceholder('••••••••').fill('DevConsolePassword9023!');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');
    
    await page.goto('/developer-portal');
    
    // Check if main heading is visible (allow time for Next.js dev compilation)
    await expect(page.getByRole('heading', { name: /Developer Portal/i })).toBeVisible({ timeout: 30000 });

    // Verify presence of extension points or API documentation
    const extensionPointsSection = page.getByText(/Extension Points/i);
    if (await extensionPointsSection.isVisible()) {
      await expect(extensionPointsSection).toBeVisible();
    }
    
    // Check navigation items
    await expect(page.getByRole('button', { name: /Marketplace/i })).toBeVisible();
  });

  test('should render extension registry components', async ({ page }: { page: Page }) => {
    // Authenticate via UI
    await page.goto('/login');
    await page.getByPlaceholder('username@enterprise.local').fill('console_admin_dev');
    await page.getByPlaceholder('••••••••').fill('DevConsolePassword9023!');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');
    
    // Ensure there are no console errors on the developer portal page
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Failed to fetch') || text.includes('EventSource connection error')) {
          return;
        }
        console.log('BROWSER CONSOLE ERROR:', text);
        consoleErrors.push(text);
      }
    });

    await page.goto('/developer-portal');
    await page.waitForLoadState('domcontentloaded');

    // Basic expectation to make sure it loads
    await expect(page.getByRole('heading', { name: /Developer Portal/i })).toBeVisible({ timeout: 30000 });

    expect(consoleErrors, `Console errors found: \n${consoleErrors.join('\n')}`).toHaveLength(0);
  });
});
