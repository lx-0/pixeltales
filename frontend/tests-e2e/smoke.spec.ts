import { expect, test } from '@playwright/test';

test('app loads with PixelTales heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'PixelTales' })).toBeVisible();
});

test('socket connection is established', async ({ page }) => {
  const socketEstablished = page.waitForRequest((req) => req.url().includes('/socket.io/'), {
    timeout: 10_000,
  });
  await page.goto('/');
  await expect(socketEstablished).resolves.toBeTruthy();
});
