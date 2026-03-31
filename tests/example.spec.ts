import { test, expect } from '@playwright/test';

test('has title and displays the dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Ajaia Docs Editor/);

  // Expect the user switcher to be visible
  await expect(page.locator('select')).toBeVisible();

  // Expect the New Document button to be visible
  await expect(page.getByRole('button', { name: 'New Document' })).toBeVisible();
  
  // Expect "My Documents" section
  await expect(page.getByText('My Documents')).toBeVisible();
});

test('can start a new document flow', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  
  // Click the new document button
  await page.getByRole('button', { name: 'New Document' }).click();

  // It should navigate to /d/[id]
  await expect(page).toHaveURL(/.*\/d\/.*/);

  // Expect the Title input to contain Untitled Document
  await expect(page.locator('input[type="text"]')).toHaveValue('Untitled Document');
  
  // Expect the Share button to be visible
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
});
