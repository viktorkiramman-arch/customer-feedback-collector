import { expect, test } from "@playwright/test";

test("marketing page exposes the main product paths", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /turn customer feedback into measurable action/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /open demo/i })).toHaveAttribute("href", "/login");
});

test("login page includes the demo credentials", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /sign in to your dashboard/i })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue("owner@example.com");
});
