// Touch-emulated check: joystick renders in the Living Sanctum and dragging it
// enters free-roam (the "Exit walk" button appears) and moves the walker.
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
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },
  hasTouch: true,
  isMobile: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const page = await ctx.newPage();
page.setDefaultTimeout(90000);
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

await page.goto(base + "/garden?sanctumStart=start", { waitUntil: "networkidle" });
await page.waitForTimeout(9000);
await page.screenshot({ path: "/tmp/sanctum-mobile.png" });

const stick = page.locator('[aria-label="Walk joystick"]');
console.log("joystick present:", (await stick.count()) > 0);
if (await stick.count()) {
  const box = await stick.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  // drag the stick up (walk forward) using synthetic pointer events
  await page.evaluate(
    ([x, y]) => {
      const el = document.elementFromPoint(x, y);
      const opts = (px, py) => ({
        bubbles: true, cancelable: true, pointerId: 7, pointerType: "touch",
        clientX: px, clientY: py, isPrimary: true,
      });
      el.dispatchEvent(new PointerEvent("pointerdown", opts(x, y)));
      let step = 0;
      const iv = setInterval(() => {
        step++;
        el.dispatchEvent(new PointerEvent("pointermove", opts(x, y - Math.min(step * 8, 48))));
        if (step > 40) {
          el.dispatchEvent(new PointerEvent("pointerup", opts(x, y - 48)));
          clearInterval(iv);
        }
      }, 50);
    },
    [cx, cy],
  );
  await page.waitForTimeout(3200);
  const exitWalk = await page.locator("button", { hasText: "Exit walk" }).count();
  console.log("free-roam entered via joystick:", exitWalk > 0);
  await page.screenshot({ path: "/tmp/sanctum-mobile-walk.png" });
}

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console errors");
await browser.close();
