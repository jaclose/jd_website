// Detail crops of hero bodies for visual review: comet double tail, planet
// terminators/atmospheres, and the docked pill. Uses window.__hero.
// Usage: node scripts/tmp-hero-detail.mjs [baseUrl]
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
      const c = path.join(dir, p.name, "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
      if (existsSync(c)) return c;
    }
  }
  throw new Error("No Playwright Chromium found");
}

const browser = await chromium.launch({ executablePath: resolveChromiumExecutable() });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(4000);

const posOf = (id) =>
  page.evaluate((bodyId) => {
    const p = window.__hero?.screen.get(bodyId);
    return p ? { x: p.x, y: p.y, r: p.r } : null;
  }, id);

const clipAround = (p, pad) => {
  const x = Math.min(Math.max(0, Math.round(p.x - pad)), 1439);
  const y = Math.min(Math.max(0, Math.round(p.y - pad)), 899);
  return {
    x,
    y,
    width: Math.max(10, Math.min(1440 - x, Math.round(pad * 2))),
    height: Math.max(10, Math.min(900 - y, Math.round(pad * 2))),
  };
};

for (const [id, pad] of [
  ["field-notes", 240],
  ["garden", 130],
  ["about", 120],
  ["deployments", 120],
  ["essays", 200],
]) {
  const p = await posOf(id);
  if (!p) {
    console.log(`no screen pos for ${id}`);
    continue;
  }
  await page.screenshot({ path: `/tmp/detail-${id}.png`, clip: clipAround(p, pad) });
  console.log(`${id}: x=${p.x.toFixed(0)} y=${p.y.toFixed(0)} r=${p.r.toFixed(0)}`);
}

// wait for the comet to swing into frame, then freeze it under the pointer
let comet = null;
for (let i = 0; i < 120; i++) {
  comet = await posOf("field-notes");
  if (comet && comet.x > 200 && comet.x < 1240 && comet.y > 100 && comet.y < 780) break;
  comet = null;
  await page.waitForTimeout(1000);
}
if (comet) {
  await page.screenshot({ path: "/tmp/detail-comet.png", clip: clipAround(comet, 280) });
  await page.mouse.move(comet.x, comet.y, { steps: 8 });
  await page.waitForTimeout(1100);
  const p2 = await posOf("field-notes");
  await page.screenshot({ path: "/tmp/detail-comet-hover.png", clip: clipAround(p2 ?? comet, 320) });
  console.log(`comet: x=${comet.x.toFixed(0)} y=${comet.y.toFixed(0)}`);
} else {
  console.log("comet never entered frame");
}

// docked pill, fully settled
await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.4 }));
await page.waitForTimeout(4000);
await page.screenshot({ path: "/tmp/detail-docked.png", clip: { x: 380, y: 0, width: 680, height: 110 } });

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console errors");
await browser.close();
