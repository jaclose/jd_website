// Drive the Essay Archive + Field Notes table: hero, featured, reader open,
// table scene, drag a letter, open a letter.
import { chromium } from "playwright-core";
import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const base = process.argv[2] ?? "http://localhost:3210";

function resolveChromiumExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
  const versions = readdirSync(cache, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("chromium-"))
    .map((e) => e.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  for (const version of versions) {
    const dir = path.join(cache, version);
    for (const p of readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name.startsWith("chrome-"))) {
      const candidate = path.join(dir, p.name, "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
      if (existsSync(candidate)) return candidate;
    }
  }
  throw new Error("No Playwright Chromium found");
}

const browser = await chromium.launch({ executablePath: resolveChromiumExecutable() });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(60000);
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("_vercel")) errors.push(`console: ${m.text()}`);
});

// ——— essays archive ———
await page.goto(base + "/essays", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/ea-hero.png" });
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 0.9 }));
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/ea-featured.png" });
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2.1 }));
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/ea-shelf.png" });

// open the featured essay reader
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 0.9 }));
await page.waitForTimeout(600);
await page.locator(".ea-featured").click();
await page.waitForTimeout(1800);
await page.screenshot({ path: "/tmp/ea-reader.png" });
await page.evaluate(() => document.querySelector(".ea-reader__scroll")?.scrollTo({ top: 900 }));
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/ea-reader-body.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(900);

// ——— field notes table ———
await page.goto(base + "/field-notes", { waitUntil: "networkidle" });
await page.waitForTimeout(1800);
await page.screenshot({ path: "/tmp/fn-table.png" });

// drag the first letter and throw it a little
const env = page.locator(".field-note-envelope").first();
const box = await env.boundingBox();
if (box) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 220, box.y + 60, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: "/tmp/fn-thrown.png" });
}

// open a letter (click without moving)
const env2 = page.locator(".field-note-envelope").nth(1);
await env2.click();
await page.waitForTimeout(2400);
await page.screenshot({ path: "/tmp/fn-reader.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/fn-closed.png" });

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console errors");
await browser.close();
