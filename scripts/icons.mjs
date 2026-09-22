// Renders public/icons/icon.svg to PNG sizes via Chromium.
import { createRequire } from 'module';
import { readFileSync } from 'fs';
const require = createRequire(process.env.PW_ROOT + '/');
const { chromium } = require('playwright');
const svg = readFileSync('public/icons/icon.svg', 'utf8');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await page.screenshot({ path: `public/icons/icon-${size}.png`, omitBackground: true });
    await page.close();
}
await browser.close();
