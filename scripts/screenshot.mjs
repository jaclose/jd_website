// Visual smoke test: captures the hero, the docked nav bar, and the garden.
// Usage: node scripts/screenshot.mjs [baseUrl]
import { chromium } from "playwright-core";
import os from "node:os";
import path from "node:path";

const base = process.argv[2] ?? "http://localhost:3210";
const exe = path.join(
  os.homedir(),
  "Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
);

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(3500); // intro animation
await page.screenshot({ path: "/tmp/shot-hero.png" });

// hover the gas giant region to test the scan card (raycast on body events)
await page.mouse.move(720, 450);
await page.waitForTimeout(400);
await page.mouse.move(900, 380, { steps: 12 });
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/shot-hover.png" });

// scroll to dock the system into the bar
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.4 }));
await page.waitForTimeout(2200);
await page.screenshot({ path: "/tmp/shot-docked.png" });

// deep scroll: sections + bar persists
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 3.2 }));
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/shot-sections.png" });

await page.goto(base + "/garden", { waitUntil: "networkidle" });
await page.waitForTimeout(3600); // cutscene
await page.screenshot({ path: "/tmp/shot-garden.png" });
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2.5 }));
await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/shot-garden-rows.png" });

await page.goto(base + "/essays/anatomy-of-the-test", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/shot-essay.png" });

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console errors");
await browser.close();
