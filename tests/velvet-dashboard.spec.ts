import { expect, test } from "@playwright/test";

test.describe("Velvet Coda dashboard", () => {
  test("renders the first-launch studio shell", async ({ page }, testInfo) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("link", { name: "Velvet Coda AI ALBUM FOUNDRY" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create your first AI jazz album." })).toBeVisible();
    await expect(page.getByText("No album has been created yet.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Play|Pause/ })).toBeVisible();

    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach(`dashboard-${testInfo.project.name}.png`, {
      body: screenshot,
      contentType: "image/png"
    });
  });

  test("renders the guided new-project flow", async ({ page }) => {
    await page.goto("/projects/new");

    await expect(page.getByRole("heading", { name: "Describe the album." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Blueprint" })).toBeVisible();
    await expect(page.getByText("API and CLI provider calls stay blocked until approved.")).toBeVisible();
  });

  test("shows provider-agnostic AI connection setup", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByText("Add AI connection")).toBeVisible();
    await expect(page.getByText("OpenAI / ChatGPT")).toBeVisible();
    await expect(page.getByText("Claude", { exact: true })).toBeVisible();
    await expect(page.getByText("OpenAI-compatible", { exact: true })).toBeVisible();
    await expect(page.getByText("Local command", { exact: true })).toBeVisible();
  });
});
