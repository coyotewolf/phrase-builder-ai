import { test, expect } from '@playwright/test';

// Anonymous local-data smoke tests. No credentials or production writes.
const routes = ["/", "/wordbooks", "/statistics", "/settings", "/about"];
for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test.describe(`${viewport.width}px viewport`, () => {
    test.use({ viewport });
    for (const route of routes) {
      test(`renders and reloads ${route}`, async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(route);
        await expect(page.locator('#root')).not.toBeEmpty();
        await expect(page.locator('#root')).toContainText(/\S/);
        await page.reload();
        await expect(page.locator('#root')).toContainText(/\S/);
        await page.waitForTimeout(500);
        expect(errors).toEqual([]);
      });
    }
  });
}
