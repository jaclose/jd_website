/* Forest verification — clearing overview + each domain grove, via 3D clicks. */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const EXE = path.join(
  os.homedir(),
  "Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
);
const BASE = "http://localhost:3199";
const OUT = "/tmp/jd-shots";
mkdirSync(OUT, { recursive: true });

const errors = [];
const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// scroll the #garden (forest) section into view
await page.evaluate(() => document.querySelector("#garden")?.scrollIntoView({ behavior: "instant" }));
await page.waitForTimeout(3500); // gardener-eye + scene settle
await page.screenshot({ path: `${OUT}/F0-clearing.png` });

// walk each domain via its bottom dot (CLEARING + 4 trail dots)
const dots = await page.$$("#garden button[aria-label^='Walk the']");
const names = ["mind", "craft", "body", "spirit"];
for (let i = 0; i < dots.length && i < 4; i++) {
  await dots[i].click();
  await page.waitForTimeout(2600); // dolly eases in
  await page.screenshot({ path: `${OUT}/F${i + 1}-${names[i]}.png` });
  // back to clearing for a clean re-entry
  const clearing = await page.$("#garden button[aria-label='Return to the clearing']");
  if (clearing) await clearing.click();
  await page.waitForTimeout(1800);
}

// confirm a real 3D click works: sweep canvas for a pointer-cursor (trail/signpost)
await page.waitForTimeout(1200);
let hit = null;
outer: for (let y = 360; y < 760; y += 40) {
  for (let x = 380; x < 1060; x += 40) {
    await page.mouse.move(x, y);
    await page.waitForTimeout(25);
    if ((await page.evaluate(() => document.body.style.cursor)) === "pointer") {
      hit = { x, y };
      break outer;
    }
  }
}
if (hit) {
  await page.mouse.click(hit.x, hit.y);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/F5-canvas-click.png` });
} else {
  errors.push("no 3D trail/signpost pointer-hit found in canvas sweep");
}

await page.close();
await browser.close();
console.log(`3D hit: ${hit ? `${hit.x},${hit.y}` : "NONE"}`);
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "CLEAN — no page errors");
