// browser_smoke.mjs - load an exported Picotron page in headless Chromium,
// click to start it, take screenshots and fail if the game area stays blank.
// Catches what a headless -x run cannot: the real web player's rendering
// (e.g. the Picotron 0.3 colour-table change that turned a cart all black).
//
//   node tools/picotron/browser_smoke.mjs <url> <out_prefix> [seconds]
//
// Playwright is resolved from $PLAYWRIGHT_MODULE (path to the package) or
// the local node_modules.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const [url, out = 'smoke', secs = '8'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
const errors = [];
const cartLog = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { const t = m.text(); if (/^\[\d+\]/.test(t) || /error/i.test(t)) cartLog.push(t); });

await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);
await page.mouse.click(500, 300);                 // the web player starts on a click
await page.waitForTimeout(Number(secs) * 1000);

const canvas = await page.$('canvas');
if (!canvas) {
  console.log(`smoke FAIL: no <canvas> on ${url} (page errors: ${errors.join('; ') || 'none'})`);
  await browser.close();
  process.exit(1);
}
const box = await canvas.boundingBox();
const png = await page.screenshot({ path: `${out}.png`, clip: box });

// analyse the screenshot's pixels in a scratch page (no image deps needed)
const probe = await browser.newPage();
const stats = await probe.evaluate(async (b64) => {
  const img = new Image();
  img.src = 'data:image/png;base64,' + b64;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let lit = 0, n = 0;
  const colours = new Set();
  for (let i = 0; i < d.length; i += 4 * 5) {
    const v = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    if (d[i] + d[i + 1] + d[i + 2] > 48) lit++;
    colours.add(v); n++;
  }
  return { lit: lit / n, colours: colours.size };
}, png.toString('base64'));
await browser.close();

// a black/blank or garbled screen has a handful of colours at most; a real
// frame has more (a dim 32-colour scene can legitimately use only ~16)
const ok = stats.lit > 0.25 && stats.colours >= 8 && errors.length === 0;
console.log(`smoke ${ok ? 'PASS' : 'FAIL'}: ${(stats.lit * 100).toFixed(0)}% lit pixels, ${stats.colours} colours, ${errors.length} page errors`);
for (const e of errors) console.log('  page error: ' + e);
for (const l of cartLog.slice(-20)) console.log('  cart: ' + l);
process.exit(ok ? 0 : 1);
