/* Round-3 visual verification — desktop + iPhone sweeps with console capture. */
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
function wire(page, tag) {
  page.on("pageerror", (e) => errors.push(`[${tag}] pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${tag}] console: ${m.text()}`);
  });
}

const browser = await chromium.launch({ executablePath: EXE });

/* ── desktop ── */
const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
wire(d, "desktop");

await d.goto(BASE, { waitUntil: "networkidle" });
await d.waitForTimeout(3500);
await d.screenshot({ path: `${OUT}/01-hero.png` });

// probe for a hoverable planet: sweep until cursor turns pointer
let hit = null;
outer: for (let y = 200; y < 820; y += 60) {
  for (let x = 120; x < 1380; x += 60) {
    await d.mouse.move(x, y);
    await d.waitForTimeout(45);
    const cur = await d.evaluate(() => document.body.style.cursor);
    if (cur === "pointer") {
      hit = { x, y };
      break outer;
    }
  }
}
if (hit) {
  // linger so the magnetic hover + card settle, then watch it track
  await d.waitForTimeout(900);
  await d.screenshot({ path: `${OUT}/02-hover-card.png` });
  await d.waitForTimeout(1500);
  await d.screenshot({ path: `${OUT}/03-hover-tracking.png` });
} else {
  errors.push("[desktop] no planet hover hit found in sweep");
}
await d.mouse.move(720, 60);

// docked bar
await d.evaluate(() => window.scrollTo(0, window.innerHeight * 1.4));
await d.waitForTimeout(2200);
await d.screenshot({ path: `${OUT}/04-docked-bar.png` });

// sections
const sections = [
  ["statement", 1.85],
  ["essays-featured", 2.6],
  ["essays-index", 3.4],
  ["quote", 4.4],
  ["garden-teaser", 5.2],
  ["garden-stages", 5.9],
  ["field-notes", 6.7],
  ["archive", 7.6],
  ["log", 8.6],
];
for (const [name, vh] of sections) {
  await d.evaluate((v) => window.scrollTo(0, window.innerHeight * v), vh);
  await d.waitForTimeout(1300);
  await d.screenshot({ path: `${OUT}/05-${name}.png` });
}

// essays index hover preview
await d.evaluate(() => {
  document.querySelectorAll("a[href^='/essays/']").forEach((a) => {});
  window.scrollTo(0, window.innerHeight * 3.3);
});
await d.waitForTimeout(900);
const row = await d.$("#essays a[href*='/essays/'][href*='threads']");
if (row) {
  const bb = await row.boundingBox();
  if (bb) {
    await d.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await d.waitForTimeout(900);
    await d.screenshot({ path: `${OUT}/06-essays-hover-preview.png` });
  }
}

// garden page — cutscene then walk
await d.goto(`${BASE}/garden`, { waitUntil: "networkidle" });
await d.waitForTimeout(1400);
await d.screenshot({ path: `${OUT}/07-garden-cutscene-fall.png` });
await d.waitForTimeout(2600);
await d.screenshot({ path: `${OUT}/08-garden-cutscene-settled.png` });
await d.evaluate(() => window.scrollTo(0, window.innerHeight * 2.2));
await d.waitForTimeout(1200);
await d.screenshot({ path: `${OUT}/09-garden-walk.png` });
await d.evaluate(() => window.scrollTo(0, window.innerHeight * 4.8));
await d.waitForTimeout(1200);
await d.screenshot({ path: `${OUT}/10-garden-walk-late.png` });
await d.evaluate(() => window.scrollTo(0, document.body.scrollHeight - window.innerHeight * 1.2));
await d.waitForTimeout(1400);
await d.screenshot({ path: `${OUT}/11-achievements.png` });

// essay page with cover
await d.goto(`${BASE}/essays/anatomy-of-the-test`, { waitUntil: "networkidle" });
await d.waitForTimeout(1200);
await d.screenshot({ path: `${OUT}/12-essay-page.png` });

// essays index page
await d.goto(`${BASE}/essays`, { waitUntil: "networkidle" });
await d.waitForTimeout(1200);
await d.screenshot({ path: `${OUT}/13-essays-page.png` });

// about
await d.goto(`${BASE}/about`, { waitUntil: "networkidle" });
await d.waitForTimeout(1200);
await d.screenshot({ path: `${OUT}/14-about.png` });

await d.close();

/* ── iPhone ── */
const m = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
wire(m, "mobile");
await m.goto(BASE, { waitUntil: "networkidle" });
await m.waitForTimeout(3200);
await m.screenshot({ path: `${OUT}/20-m-hero.png` });
await m.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
await m.waitForTimeout(2000);
await m.screenshot({ path: `${OUT}/21-m-docked.png` });
await m.evaluate(() => window.scrollTo(0, window.innerHeight * 2.8));
await m.waitForTimeout(1100);
await m.screenshot({ path: `${OUT}/22-m-essays.png` });
await m.evaluate(() => window.scrollTo(0, window.innerHeight * 7.2));
await m.waitForTimeout(1100);
await m.screenshot({ path: `${OUT}/23-m-notes.png` });
await m.goto(`${BASE}/garden`, { waitUntil: "networkidle" });
await m.waitForTimeout(4000);
await m.screenshot({ path: `${OUT}/24-m-garden.png` });
await m.close();

await browser.close();
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "CLEAN — no page errors");
