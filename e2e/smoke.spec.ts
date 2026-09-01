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
    // Pasek mówi wprost, na jakim poziomie działa każda metryka.
    await expect(page.locator(".demo-badge")).toContainText("Percepcja: tylko Bilbao");
  });

  test("dzielnica Bilbao pokazuje realną percepcję ze źródłem", async ({ page }) => {
    await page.selectOption("#district-search", "bilbao-abando");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator("h2")).toContainText("Abando");
    // Wartość z badania Ikerfel 2025 dla Abando.
    await expect(sidebar.locator(".metric-value").first()).toContainText("5,44");
    // Żadna dzielnica nie ma bloku przestępczości jako własnej metryki.
    await expect(sidebar.locator(".metric")).toHaveCount(1);
    await expect(sidebar.locator(".metric-src").first()).toContainText("Ikerfel");
    await expect(sidebar.locator(".places-list li")).not.toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(sidebar).toBeHidden();
  });

  test("dzielnica nie udaje własnej przestępczości", async ({ page }) => {
    // Osiem dzielnic Bilbao pokazywało tę samą liczbę 66,58 jako swoją —
    // wyglądało to jak zepsute dane. Teraz jest tylko metryka percepcji,
    // a stopa gminy stoi obok jako podpisany kontekst.
    await page.selectOption("#district-search", "bilbao-deusto");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator(".metric")).toHaveCount(1);
    await expect(sidebar.locator(".metric-label")).toContainText("Percepcja");
    await expect(sidebar.locator(".metric-context")).toContainText("dla całej gminy");
    await expect(sidebar.locator(".metric-context")).toContainText("Bilbao 66,6‰");
    await expect(sidebar.locator(".metric-context")).toContainText("nikt jej nie publikuje");
  });

  test("najmniejsza gmina też ma przestępczość, ale nie percepcję", async ({ page }) => {
    // Sondika ma 4,9 tys. mieszkańców. Udalmap obejmuje wszystkie gminy bez progu,
    // więc stopa przestępczości jest — brakuje tylko badania percepcji.
    await page.selectOption("#district-search", "sondika");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator("h2")).toContainText("Sondika");
    await expect(sidebar.locator(".metric")).toHaveCount(1);
    await expect(sidebar.locator(".metric-label")).toContainText("Przestępstwa");
    await expect(sidebar.locator(".metric-value")).toContainText("48,2");
  });

  test("Barakaldo ma realną przestępczość z odniesieniem do prowincji", async ({ page }) => {
    await page.selectOption("#district-search", "barakaldo");
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator(".metric")).toHaveCount(1);
    await expect(sidebar.locator(".metric-value")).toContainText("52,1");
    // Sama stopa niewiele mówi bez punktu odniesienia.
    await expect(sidebar.locator(".metric-meta")).toContainText("Bizkaia");
  });

  test("panel źródeł otwiera się i zamyka", async ({ page }) => {
    await page.locator("#methodology-btn").click();
    const modal = page.locator("#methodology-modal");
    await expect(modal).toBeVisible();
    await expect(modal.locator("h2")).toContainText("Skąd te dane");
    await expect(modal).toContainText("Ikerfel");
    await expect(modal).toContainText("Udalmap");
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("zmiana metryki przestawia legendę i jej kierunek", async ({ page }) => {
    const legendTitle = page.locator("#legend .legend-title").first();
    await expect(legendTitle).toContainText("Percepcja");
    await expect(page.locator("#legend .legend-caveat")).toBeVisible();

    const crime = page.locator('.mode-btn[data-field="crime_rate"]');
    await crime.click();
    await expect(crime).toHaveClass(/active/);
    await expect(crime).toHaveAttribute("aria-pressed", "true");
    await expect(legendTitle).toContainText("Przestępstwa");
    // Dopiero przestępczość ma prawdziwy gradient — i to na poziomie gminy.
    await expect(page.locator("#legend .legend-bar")).toBeVisible();
    await expect(page.locator("#legend .legend-scale")).toContainText("20–80‰");
    // Przestępczość to skala bezwzględna — bez ostrzeżenia o rozciągnięciu.
    await expect(page.locator("#legend .legend-caveat")).toHaveCount(0);
    // Udalmap pokrywa wszystkie gminy — brak szarych obszarów.
    await expect(page.locator("#legend .legend-missing")).toHaveCount(0);
  });

  test("legenda percepcji ostrzega, że skala jest rozciągnięta", async ({ page }) => {
    // Kolor pokazuje ODCHYLENIE od średniej miasta, bo cała rozpiętość to
    // 0,39 pkt. Gradient jest, ale nie wolno mu udawać skali bezwzględnej.
    await expect(page.locator("#legend .legend-bar")).toBeVisible();
    await expect(page.locator("#legend .legend-scale")).toContainText("śr. 5,58");
    await expect(page.locator("#legend .legend-caveat")).toContainText("ODCHYLENIE");
    await expect(page.locator("#legend .legend-caveat")).toContainText("0,39 pkt");
    await expect(page.locator("#legend .legend-missing")).toContainText("Nie badano (8 z 16)");
  });

  test("klik w pinezkę miejsca nie przestawia panelu obszaru", async ({ page }) => {
    // Regresja: gdy handler obszarów stał się globalny, jeden klik otwierał
    // JEDNOCZEŚNIE popup miejsca i panel obszaru.
    await page.selectOption("#district-search", "bilbao-abando");
    await page.waitForTimeout(1500);
    await page.keyboard.press("Escape");
    const box = (await page.locator("#map").boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    for (let i = 0; i < 5; i++) {
      await page.mouse.move(cx, cy);
      await page.mouse.wheel(0, -500);
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(2000);

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
