/**
 * Headless browser smoke for PixelTales — boots the page, captures every
 * console message + pageerror + failed request, snapshots the canvas, and
 * dumps a DOM stats summary. Built for diagnosing "the canvas stays blank
 * but everything else works" type failures where backend logs look fine.
 *
 * Usage:
 *
 *   # default URL, http://localhost:5175 (compose dev maps 5173→5175 when
 *   # the standard port is taken). Override with the first arg.
 *   pnpm diag                                  # → /tmp/pixeltales-diag.png
 *   pnpm diag http://localhost:5173            # custom URL
 *
 * Requires `pnpm exec playwright install chromium` once per machine.
 *
 * Output:
 *   stdout         — console + pageerror + failed-request log + DOM stats
 *   /tmp/pixeltales-diag.png — viewport screenshot
 */

import { chromium } from '@playwright/test';

const URL = process.argv[2] ?? 'http://localhost:5175';
const SCREENSHOT_PATH = '/tmp/pixeltales-diag.png';
const SETTLE_MS = 6000;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

const console_msgs = [];
const failed = [];
page.on('console', (m) => console_msgs.push(`${m.type().toUpperCase()} ${m.text()}`));
page.on('pageerror', (e) => console_msgs.push(`PAGEERROR ${e.message}\n${e.stack ?? ''}`));
page.on('requestfailed', (r) =>
  failed.push(`${r.failure()?.errorText ?? '?'} ${r.method()} ${r.url()}`)
);

await page.goto(URL, { waitUntil: 'networkidle', timeout: 20_000 }).catch((e) => {
  console_msgs.push(`GOTOERR ${e.message}`);
});

// Give Phaser time to boot, socket to exchange, MainScene to paint.
await page.waitForTimeout(SETTLE_MS);

const stats = await page.evaluate(() => {
  const canvases = document.querySelectorAll('canvas');
  return {
    canvas_count: canvases.length,
    canvas_sizes: [...canvases].map((c) => ({
      w: c.width,
      h: c.height,
      cw: c.clientWidth,
      ch: c.clientHeight,
    })),
    game_container: !!document.getElementById('game-container'),
    h1_text: document.querySelector('h1')?.textContent ?? null,
  };
});

await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
await browser.close();

console.log(`=== ${URL} ===`);
console.log('\n=== CONSOLE + PAGEERRORS ===');
for (const m of console_msgs) console.log(m);
console.log('\n=== FAILED REQUESTS ===');
for (const f of failed) console.log(f || '(none)');
if (failed.length === 0) console.log('(none)');
console.log('\n=== DOM STATS ===');
console.log(JSON.stringify(stats, null, 2));
console.log(`\nscreenshot: ${SCREENSHOT_PATH}`);
