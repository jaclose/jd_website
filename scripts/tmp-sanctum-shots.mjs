// Drive the Living Sanctum: trailhead view, quest tracker, WASD walk, toasts.
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
    const platformDirs = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name.startsWith("chrome-"));
    for (const p of platformDirs) {
      const candidate = path.join(dir, p.name, "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
      if (existsSync(candidate)) return candidate;
    }
  }
  throw new Error("No Playwright Chromium found");
}

const browser = await chromium.launch({ executablePath: resolveChromiumExecutable() });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(90000);
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

// drop straight at the trailhead so the forest mounts
await page.goto(base + "/garden?sanctumStart=start", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready).catch(() => {});
await page.waitForTimeout(9000); // stream forest assets
await page.screenshot({ path: "/tmp/sanctum-trailhead.png" });

// open the quest tracker
const chip = page.locator("button", { hasText: "◈" }).first();
if (await chip.count()) {
  await chip.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "/tmp/sanctum-quests.png" });
  await chip.click();
}

// walk forward with W for a few seconds (auto free-roam) + turn with arrow
await page.mouse.move(720, 450);
await page.keyboard.down("w");
await page.waitForTimeout(2600);
await page.keyboard.up("w");
await page.waitForTimeout(700);
await page.screenshot({ path: "/tmp/sanctum-walk.png" });

// turn right and keep walking to see trail + landmarks + guide
await page.keyboard.down("ArrowRight");
await page.waitForTimeout(900);
await page.keyboard.up("ArrowRight");
await page.keyboard.down("w");
await page.waitForTimeout(2600);
await page.keyboard.up("w");
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/sanctum-walk2.png" });

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console errors");
await browser.close();
