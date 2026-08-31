import { test, expect } from "@playwright/test";

test.describe("Bilbao Safety Map — smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Kontrolki renderują się po załadowaniu danych i stylu mapy.
    await expect(page.locator("#district-search")).toBeVisible({ timeout: 20000 });
  });

  test("renderuje legendę, filtry i kontrolki", async ({ page }) => {
    await expect(page.locator("#legend .legend-title").first()).toBeVisible();
    await expect(page.locator("#filters .filter-row")).not.toHaveCount(0);
    // Dwa tryby: percepcja i przestępczość. Nie ma "dzień/noc" — percepcji
    // nocnej nie publikuje się per obszar.
    await expect(page.locator(".mode-btn")).toHaveCount(2);
    await expect(page.locator(".demo-badge")).toBeVisible();
  });

  test("dzielnica Bilbao pokazuje realną percepcję ze źródłem", async ({ page }) => {
    await page.selectOption("#district-search", "bilbao-abando");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator("h2")).toContainText("Abando");
    // Wartość z badania Ikerfel 2025 dla Abando.
    await expect(sidebar.locator(".metric-value").first()).toContainText("5,44");
    await expect(sidebar.locator(".metric-src").first()).toContainText("Ikerfel");
    await expect(sidebar.locator(".places-list li")).not.toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(sidebar).toBeHidden();
  });

  test("dzielnica oznacza przestępczość jako wartość gminną", async ({ page }) => {
    // Bilbao ma jedną miejską stopę przestępczości — dzielnica musi to przyznać.
    await page.selectOption("#district-search", "bilbao-deusto");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator(".metric-warn")).toContainText("całej gminy");
  });

  test("gmina bez publikowanych statystyk jawnie nie ma danych", async ({ page }) => {
    // Sondika < 20 000 mieszkańców, więc Eustat nic dla niej nie publikuje.
    await page.selectOption("#district-search", "sondika");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator("h2")).toContainText("Sondika");
    await expect(sidebar.locator("p.muted").first()).toContainText("Brak danych");
    await expect(sidebar.locator("p.muted").first()).toContainText("20 000");
    await expect(sidebar.locator(".metric")).toHaveCount(0);
  });

  test("Barakaldo ma realną przestępczość, ale nie percepcję", async ({ page }) => {
    await page.selectOption("#district-search", "barakaldo");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator(".metric")).toHaveCount(1);
    await expect(sidebar.locator(".metric-label")).toContainText("Przestępstwa");
    await expect(sidebar.locator(".metric-value")).toContainText("12,2");
  });

  test("panel źródeł otwiera się i zamyka", async ({ page }) => {
    await page.locator("#methodology-btn").click();
    const modal = page.locator("#methodology-modal");
    await expect(modal).toBeVisible();
    await expect(modal.locator("h2")).toContainText("Skąd te dane");
    await expect(modal).toContainText("Ikerfel");
    await expect(modal).toContainText("Eustat");
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("zmiana metryki przestawia legendę i jej kierunek", async ({ page }) => {
    const legendTitle = page.locator("#legend .legend-title").first();
    await expect(legendTitle).toContainText("Percepcja");
    await expect(page.locator("#legend .legend-scale")).toContainText("bezpieczniej");

    const crime = page.locator('.mode-btn[data-field="crime_rate"]');
    await crime.click();
    await expect(crime).toHaveClass(/active/);
    await expect(crime).toHaveAttribute("aria-pressed", "true");
    await expect(legendTitle).toContainText("Przestępstwa");
    // Przy przestępczości kierunek skali jest odwrotny.
    await expect(page.locator("#legend .legend-scale")).toContainText("gorzej");
  });

  test("legenda tłumaczy szare obszary i mieszaną rozdzielczość", async ({ page }) => {
    await expect(page.locator("#legend .legend-missing")).toBeVisible();
    await expect(page.locator("#legend .legend-note").last()).toContainText(
      "brak danych szczegółowych, a nie jednorodność terenu",
    );
  });

  test("filtr kategorii można odznaczyć", async ({ page }) => {
    const first = page.locator("#filters .filter-row input").first();
    await expect(first).toBeChecked();
    await first.uncheck();
    await expect(first).not.toBeChecked();
  });
});
