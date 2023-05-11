// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
})

test('has title', async ({ page }) => {
  await expect(page).toHaveTitle(/Parotta/);
});

test('has links', async ({ page }) => {
  // await page.getByRole('link', { name: 'About us' }).click();
});

test('has counter', async ({ page }) => {
  const counter =  page.getByText("Counter");
  expect(counter.innerText).toEqual("123");
});