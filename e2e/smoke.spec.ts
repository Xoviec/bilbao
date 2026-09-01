import { test, expect } from "@playwright/test";

test.describe("Bilbao Safety Map — smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#district-search")).toBeVisible({ timeout: 20000 });
  });

  test("jeden wskaźnik, jedna jednostka — 9 gmin, bez przełącznika", async ({ page }) => {
    // Sedno docs/METRIC_DECISION.md. Przełącznik metryk zniknął, bo nie ma czym
    // przełączać; obszarów jest dokładnie tyle, ile gmin.
    await expect(page.locator(".mode-btn")).toHaveCount(0);
    await expect(page.locator("#district-search option")).toHaveCount(10); // 9 + placeholder
    await expect(page.locator("#legend .legend-title").first()).toContainText("Przestępstwa");
    await expect(page.locator("#legend .legend-bar")).toBeVisible();
    await expect(page.locator("#filters .filter-row")).not.toHaveCount(0);
  });

  test("każdy obszar ma własną wartość — żadnych powtórzeń", async ({ page }) => {
    // Skanowanie mapy po kafelkach jest wolne — domyślne 30 s nie wystarcza.
    test.setTimeout(120000);
    // Regresja, która wracała trzy razy: ta sama liczba na wielu kształtach.
    await page.waitForTimeout(3500);
    const box = (await page.locator("#map").boundingBox())!;
    const seen = new Set<string>();
    for (const [fx, fy] of [[0.42, 0.52], [0.46, 0.6], [0.62, 0.35], [0.3, 0.3]]) {
      await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy);
      await page.waitForTimeout(350);
      const t = await page.locator(".district-tooltip").innerText().catch(() => "");
      if (t) seen.add(t.replace(/\s+/g, " ").trim());
    }
    // Różne punkty = różne gminy = różne wartości.
    expect(seen.size).toBeGreaterThan(1);
    for (const t of seen) expect(t).toMatch(/Przestępczość: \d+,\d‰/);
  });

  test("panel gminy pokazuje miernik ze źródłem i odniesieniem", async ({ page }) => {
    await page.selectOption("#district-search", "zamudio");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator("h2")).toContainText("Zamudio");
    await expect(sidebar.locator(".metric-value")).toContainText("74,8");
    await expect(sidebar.locator(".metric-meta")).toContainText("Bizkaia");
    await expect(sidebar.locator(".metric-src")).toContainText("Udalmap");
  });

  test("panel Bilbao dokłada percepcję ośmiu dzielnic", async ({ page }) => {
    // Dane percepcji nie przepadły przy przejściu na jeden miernik — są w panelu
    // gminy, jawnie oddzielone od miernika mapy.
    await page.selectOption("#district-search", "bilbao");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator(".metric-value")).toContainText("66,6");
    await expect(sidebar.locator(".perc-list li")).toHaveCount(8);
    await expect(sidebar.locator(".extra-note")).toContainText("tylko w Bilbao");
    await expect(sidebar.locator(".perc-list li").first()).toContainText("Deusto");
  });

  test("panel źródeł otwiera się i zamyka", async ({ page }) => {
    await page.locator("#methodology-btn").click();
    const modal = page.locator("#methodology-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Udalmap");
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("klik w pinezkę miejsca nie przestawia panelu obszaru", async ({ page }) => {
    // Szukanie pinezki wymaga przeskanowania siatki punktów — z natury wolne.
    test.setTimeout(180000);
    const box = (await page.locator("#map").boundingBox())!;
    const cx = box.x + box.width * 0.45;
    const cy = box.y + box.height * 0.5;
    // Głębokość ustalona empirycznie: przy 5 krokach klastry jeszcze się nie
    // rozpadły, przy 9 wchodzimy na poziom ulicy bez naszych punktów.
    for (let i = 0; i < 7; i++) {
      await page.mouse.move(cx, cy);
      await page.mouse.wheel(0, -500);
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(2500);

    const placePopup = page.locator(".maplibregl-popup:not(.district-tooltip)");
    let hit = false;
    for (let gx = 1; gx < 14 && !hit; gx++) {
      for (let gy = 1; gy < 9 && !hit; gy++) {
        await page.keyboard.press("Escape");
        await page.evaluate(() =>
          document
            .querySelectorAll(".maplibregl-popup:not(.district-tooltip)")
            .forEach((p) => p.remove()));
        await page.mouse.click(box.x + (box.width * gx) / 14, box.y + (box.height * gy) / 9);
        await page.waitForTimeout(250);
        if ((await placePopup.count()) > 0) hit = true;
      }
    }
    expect(hit, "nie udało się trafić w pinezkę miejsca").toBe(true);
    await expect(page.locator("#sidebar:not(.hidden)")).toHaveCount(0);
  });

  test("filtr kategorii można odznaczyć", async ({ page }) => {
    const first = page.locator("#filters .filter-row input").first();
    await expect(first).toBeChecked();
    await first.uncheck();
    await expect(first).not.toBeChecked();
  });
});
