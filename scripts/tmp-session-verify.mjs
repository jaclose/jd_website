// One driver for this session's changes: constellation idle egg, dock pulses +
// hairline draw, essays filter rail + reader progress, field-note excerpts.
import { chromium } from "playwright-core";
import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
function exe() {
  const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
  for (const v of readdirSync(cache).filter((n) => n.startsWith("chromium-")).sort().reverse()) {
    for (const p of readdirSync(path.join(cache, v)).filter((n) => n.startsWith("chrome-"))) {
      const c = path.join(cache, v, p, "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
      if (existsSync(c)) return c;
    }
  }
  throw new Error("no chromium");
}
const browser = await chromium.launch({ executablePath: exe() });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(60000);
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });

// ── 1. constellation egg: stay still 12s past intro ──
await page.goto("http://localhost:3210/", { waitUntil: "networkidle" });
await page.waitForTimeout(11500);
await page.screenshot({ path: "/tmp/v-constellation.png" });

// ── 2. dock: scroll and catch the hairline draw + settled pill ──
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.4 }));
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/v-dock-mid.png", clip: { x: 380, y: 0, width: 680, height: 110 } });
await page.waitForTimeout(3500);
await page.screenshot({ path: "/tmp/v-dock-settled.png", clip: { x: 380, y: 0, width: 680, height: 110 } });

// ── 3. essays: filter rail ──
await page.goto("http://localhost:3210/essays", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const rail = page.locator(".ea-filter");
await rail.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
const chips = await page.locator(".ea-filter__chip").allTextContents();
console.log("chips:", JSON.stringify(chips));
await page.locator(".ea-filter__chip", { hasText: "Sanctum" }).click();
await page.waitForTimeout(600);
const visible = await page.locator(".ea-shelf .ea-card").count();
console.log("cards after Sanctum filter:", visible);
await page.screenshot({ path: "/tmp/v-filter.png" });
await page.locator(".ea-filter__chip").first().click();
await page.waitForTimeout(400);

// ── 4. reader progress hairline ──
await page.locator(".ea-shelf .ea-card").first().click();
await page.waitForTimeout(1800);
await page.locator(".ea-reader__scroll").evaluate((el) => el.scrollTo({ top: el.scrollHeight / 2 }));
await page.waitForTimeout(500);
const scaleMid = await page.locator(".ea-reader__progress-fill").evaluate((el) => el.style.transform);
console.log("progress at mid-scroll:", scaleMid);
await page.screenshot({ path: "/tmp/v-reader-progress.png", clip: { x: 0, y: 0, width: 1440, height: 220 } });
await page.keyboard.press("Escape");
await page.waitForTimeout(800);

// ── 5. field notes: excerpts clean everywhere ──
await page.goto("http://localhost:3210/field-notes", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const bodyText = await page.evaluate(() => document.body.innerText);
console.log("masthead junk still present:", /Field Note\d/.test(bodyText));
await page.screenshot({ path: "/tmp/v-field-notes.png" });

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console errors");
await browser.close();
