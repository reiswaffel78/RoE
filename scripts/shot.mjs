// Usage: node scripts/shot.mjs <url> <out.png> [width] [height] [waitMs]
import { createRequire } from 'module';
const require = createRequire(process.env.PW_ROOT + '/');
const { chromium } = require('playwright');
const [url, out, w = '1440', h = '900', wait = '2500'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url);
await page.waitForTimeout(+wait);
await page.screenshot({ path: out });
console.log(logs.filter((l) => !l.includes('[vite]')).join('\n'));
await browser.close();
