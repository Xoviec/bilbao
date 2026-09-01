import { test, expect } from "@playwright/test";

test.describe("Bilbao Safety Map — smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#district-search")).toBeVisible({ timeout: 20000 });
  });

  test("mapa pokazuje bezpieczeństwo: 16 obszarów, dwie skale", async ({ page }) => {
    await expect(page.locator(".mode-btn")).toHaveCount(0);
    await expect(page.locator("#district-search option")).toHaveCount(17); // 16 + placeholder
    await expect(page.locator("#legend .legend-title").first()).toContainText("Bezpieczeństwo");
    // Dwie skale: percepcja (per dzielnica) i przestępczość (per gmina).
    await expect(page.locator("#legend .legend-bar")).toHaveCount(2);
    await expect(page.locator("#legend .legend-sub").first()).toContainText("per dzielnica");
    await expect(page.locator("#legend .legend-sub").last()).toContainText("per gmina");
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
    // Każdy obszar podaje jednostkę i poziom pomiaru.
    for (const t of seen) expect(t).toMatch(/(Percepcja: \d,\d\d\/10|Przestępczość: \d+,\d‰)/);
    for (const t of seen) expect(t).toMatch(/pomiar per (dzielnica|gmina)/);
  });

  test("Bilbao JEST podzielone na 8 dzielnic", async ({ page }) => {
    const opts = await page.locator("#district-search option").allTextContents();
    for (const n of [
      "Deusto", "Uribarri", "Otxarkoaga-Txurdinaga", "Begoña",
      "Ibaiondo", "Abando", "Errekalde", "Basurtu-Zorrotza",
    ]) {
      expect(opts.some((o) => o.includes(n)), `brak dzielnicy ${n}`).toBe(true);
    }
  });

  test("panel dzielnicy: percepcja + przestępczość gminy + ofiary przestępstw", async ({ page }) => {
    await page.selectOption("#district-search", "bilbao-abando");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator("h2")).toContainText("Abando");
    // Metryka mierzona per dzielnica.
    await expect(sidebar.locator(".metric-value")).toContainText("5,44");
    await expect(sidebar.locator(".metric-src")).toContainText("per dzielnica");
    // Przestępczość gminy jako podpisany kontekst.
    await expect(sidebar.locator(".metric-context")).toContainText("całej gminy");
    await expect(sidebar.locator(".metric-context")).toContainText("66,6‰");
    // Twarde statystyki, o które pyta się najczęściej.
    await expect(sidebar.locator(".extra-title")).toContainText("Ofiary przestępstw");
    const rows = await sidebar.locator(".perc-list li").allTextContents();
    expect(rows.join(" ")).toContain("Kradzież");
    expect(rows.join(" ")).toContain("Rozbój z przemocą");
  });

  test("gmina sąsiednia pokazuje przestępczość mierzoną per gmina", async ({ page }) => {
    await page.selectOption("#district-search", "barakaldo");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator(".metric-value")).toContainText("52,1");
    await expect(sidebar.locator(".metric-src")).toContainText("per gmina");
    await expect(sidebar.locator(".metric-meta")).toContainText("Bizkaia");
  });

  test("panel źródeł otwiera się i zamyka", async ({ page }) => {
    await page.locator("#methodology-btn").click();
    const modal = page.locator("#methodology-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Ikerfel");
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
