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
    await expect(page.locator(".mode-btn")).toHaveCount(3);
    // Badge danych demonstracyjnych (placeholder).
    await expect(page.locator(".demo-badge")).toBeVisible();
  });

  test("wyszukiwarka dzielnicy otwiera panel", async ({ page }) => {
    // Kody są przestrzeniowane nazwą gminy — mapa obejmuje 9 gmin.
    await page.selectOption("#district-search", "bilbao-abando");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator("h2")).toContainText("Abando");
    // Panel listuje miejsca w dzielnicy.
    await expect(sidebar.locator(".places-list li")).not.toHaveCount(0);
    // Panel zamyka się klawiszem Escape (dostępność).
    await page.keyboard.press("Escape");
    await expect(sidebar).toBeHidden();
  });

  test("sąsiednia gmina otwiera się i jawnie nie ma danych o bezpieczeństwie", async ({ page }) => {
    // Barakaldo nie ma podziału w OSM ani realnych statystyk — panel musi to
    // powiedzieć wprost, zamiast rysować pusty licznik "—/100".
    await page.selectOption("#district-search", "barakaldo");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator("h2")).toContainText("Barakaldo");
    await expect(sidebar.locator("p.muted").first()).toContainText("Brak danych o bezpieczeństwie");
    await expect(sidebar.locator(".source")).toContainText("Brak wskaźników");
    await expect(sidebar.locator(".score")).toHaveCount(0);
    await expect(sidebar.locator(".places-list li")).not.toHaveCount(0);
  });

  test("legenda tłumaczy szare obszary i mieszaną rozdzielczość", async ({ page }) => {
    await expect(page.locator("#legend .legend-missing")).toBeVisible();
    await expect(page.locator("#legend .legend-note")).toContainText("nie mają go w OpenStreetMap");
  });

  test("modal metodologii otwiera się i zamyka", async ({ page }) => {
    await page.locator("#methodology-btn").click();
    const modal = page.locator("#methodology-modal");
    await expect(modal).toBeVisible();
    await expect(modal.locator("h2")).toContainText("Jak liczymy");
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("przełącznik dzień/noc zmienia aktywny tryb", async ({ page }) => {
    const night = page.locator('.mode-btn[data-field="night_score"]');
    await night.click();
    await expect(night).toHaveClass(/active/);
    await expect(night).toHaveAttribute("aria-pressed", "true");
  });

  test("filtr kategorii można odznaczyć", async ({ page }) => {
    const first = page.locator("#filters .filter-row input").first();
    await expect(first).toBeChecked();
    await first.uncheck();
    await expect(first).not.toBeChecked();
  });
});
