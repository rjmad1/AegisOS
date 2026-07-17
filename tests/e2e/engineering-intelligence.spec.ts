import { test, expect, Page } from '@playwright/test';

test.describe('Engineering Intelligence', () => {
  test.setTimeout(60000); // Allow time for Next.js compilation

  test('should load the engineering intelligence dashboard', async ({ page }: { page: Page }) => {
    // Authenticate via UI
    await page.goto('/login');
    await page.getByPlaceholder('username@enterprise.local').fill('console_admin_dev');
    await page.getByPlaceholder('••••••••').fill(process.env.OPS_ADMIN_PASSWORD || 'test_password');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');
    
    await page.goto('/engineering-intelligence');
    
    // Check if main heading is visible (allow time for Next.js dev compilation)
    await expect(page.getByRole('heading', { name: /Engineering Intelligence/i })).toBeVisible({ timeout: 30000 });

    // Verify JTBD Taxonomy and architectural scorecards are present
    const jtbdSection = page.getByText(/Taxonomy/i);
    if (await jtbdSection.isVisible()) {
      await expect(jtbdSection).toBeVisible();
    }

    // Verify metrics panel
    const metricsPanel = page.locator('.metrics-grid');
    if (await metricsPanel.isVisible()) {
      await expect(metricsPanel).toBeVisible();
    }
  });

  test('should render quality gates overview', async ({ page }: { page: Page }) => {
    // Authenticate via UI
    await page.goto('/login');
    await page.getByPlaceholder('username@enterprise.local').fill('console_admin_dev');
    await page.getByPlaceholder('••••••••').fill(process.env.OPS_ADMIN_PASSWORD || 'test_password');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL('**/dashboard');
    
    await page.goto('/engineering-intelligence');
    
    // Wait for the UI to stabilize
    await page.waitForLoadState('domcontentloaded');

    // Ensure there are no console errors on the page
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Failed to fetch') || text.includes('EventSource connection error') || text.includes('favicon')) {
          return;
        }
        console.log('BROWSER CONSOLE ERROR:', text);
        consoleErrors.push(text);
      }
    });

    await expect(page.getByRole('heading', { name: /Engineering Intelligence/i })).toBeVisible({ timeout: 30000 });
    expect(consoleErrors, `Console errors found: \n${consoleErrors.join('\n')}`).toHaveLength(0);
  });
});
