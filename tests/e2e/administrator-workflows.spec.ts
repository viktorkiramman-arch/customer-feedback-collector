import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("owner@example.com");
  await page.getByLabel("Password").fill("ChangeMe123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/);
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("administrator can search, filter, and update feedback", async ({ page }) => {
  await page.goto("/admin/feedback");
  await page.getByLabel("Search comments or categories").fill("staff handled");
  await page.getByLabel("Rating").selectOption("5");
  await page.getByRole("button", { name: "Apply filters" }).click();

  await expect(page).toHaveURL(/q=staff\+handled/);
  await expect(page.getByLabel("Search comments or categories")).toHaveValue("staff handled");
  await expect(page.getByLabel("Rating")).toHaveValue("5");
  await expect(page.getByText("The staff handled my request quickly and clearly.").first()).toBeVisible();

  await page.getByRole("link", { name: "5/5" }).first().click();
  await page.getByLabel("Moderation status").selectOption("REVIEWED");
  await page.getByLabel("Workflow status").selectOption("INVESTIGATING");
  await page.getByLabel("Priority").selectOption("HIGH");
  await page.getByLabel("Internal moderation note").fill("Verified by the administrator workflow test.");
  await page.getByRole("button", { name: "Save workflow" }).click();

  await expect(page.getByText("Feedback workflow updated.")).toBeVisible();
  await expect(page.getByLabel("Moderation status")).toHaveValue("REVIEWED");
  await expect(page.getByLabel("Workflow status")).toHaveValue("INVESTIGATING");
});

test("administrator can create, archive, and restore a category", async ({ page }, testInfo) => {
  const categoryName = `Playwright ${testInfo.project.name} ${Date.now()}`;

  await page.goto("/admin/categories");
  await page.getByLabel("Category name").fill(categoryName);
  await page.getByLabel("Description").fill("Created by the verified administrator workflow.");
  await page.getByRole("button", { name: "Create category" }).click();
  await expect(page.getByText("Category change saved.")).toBeVisible();

  const category = page.getByRole("article").filter({ hasText: categoryName });
  await expect(category).toBeVisible();
  await category.getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText("Category change saved.")).toBeVisible();

  const archivedCategory = page.getByRole("article").filter({ hasText: categoryName });
  await expect(archivedCategory.getByText("Archived")).toBeVisible();
  await archivedCategory.getByRole("button", { name: "Restore" }).click();
  await expect(page.getByText("Category change saved.")).toBeVisible();
  await expect(page.getByRole("article").filter({ hasText: categoryName }).getByRole("button", { name: "Archive" })).toBeVisible();
});

test("administrator can save settings and download a filtered CSV", async ({ page }) => {
  await page.goto("/admin/settings");
  await page.getByLabel("Organization time zone").fill("Asia/Manila");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Form settings saved.")).toBeVisible();

  await page.goto("/admin/feedback");
  await page.getByLabel("Rating").selectOption("5");
  await page.getByRole("button", { name: "Apply filters" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^feedback-\d{4}-\d{2}-\d{2}\.csv$/);

  const stream = await download.createReadStream();
  let csv = "";
  for await (const chunk of stream) csv += chunk.toString();
  expect(csv).toContain("\"submission_id\"");
  expect(csv).toContain(",\"5\",");
});
