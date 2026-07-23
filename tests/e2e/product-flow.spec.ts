import { expect, test } from "@playwright/test";

test("customer can submit feedback", async ({ page }) => {
  await page.goto("/f/sample-business-feedback");
  await page
    .getByRole("group", { name: "How would you rate your experience?" })
    .getByText("5", { exact: true })
    .click();
  await page.getByText("Customer Service", { exact: true }).click();
  await page.getByLabel(/additional comments/i).fill("The service was clear and helpful.");
  await page.getByRole("button", { name: /submit feedback/i }).click();
  await expect(page.getByRole("heading", { name: /feedback received/i })).toBeVisible();
});

test("administrator can sign in and view dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("owner@example.com");
  await page.getByLabel("Password").fill("ChangeMe123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Total responses")).toBeVisible();
});

test("public form is usable at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/f/sample-business-feedback");
  await expect(page.getByRole("heading", { name: /how was your experience/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /submit feedback/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
