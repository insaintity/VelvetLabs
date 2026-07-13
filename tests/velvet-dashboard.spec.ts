import { expect, test } from "@playwright/test";

test.describe("Velvet Coda dashboard", () => {
  test("renders the Phase 1 studio shell", async ({ page }, testInfo) => {
    await page.goto("/dashboard");

    await expect(page.getByText("Velvet Coda")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Velvet Masquerade" })).toBeVisible();
    await expect(page.getByText("Generation Status")).toBeVisible();
    await expect(page.getByRole("button", { name: /Play|Pause/ })).toBeVisible();

    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach(`dashboard-${testInfo.project.name}.png`, {
      body: screenshot,
      contentType: "image/png"
    });
  });

  test("renders the guided new-project flow", async ({ page }) => {
    await page.goto("/projects/new");

    await expect(page.getByRole("heading", { name: "Album Brief" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Album Blueprint" })).toBeVisible();
    await expect(page.getByText("No real OpenAI")).toBeVisible();
  });
});
