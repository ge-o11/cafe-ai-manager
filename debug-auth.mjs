import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5174';
const ADMIN_EMAIL = 'abodetiti11@gmail.com';
const ADMIN_PASS = '123456789$';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 860 } });
  const page = await ctx.newPage();

  // Capture browser console
  page.on('console', msg => console.log(`[browser ${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[page error] ${err.message}`));

  // Login
  await page.goto(BASE + '/2002-admin/login');
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/hub', { timeout: 10000 });
  console.log('📍 On hub after login');

  // Check localStorage
  const lsKeys = await page.evaluate(() => Object.keys(localStorage));
  console.log('localStorage keys:', lsKeys);

  const supabaseKey = lsKeys.find(k => k.includes('supabase') || k.includes('sb-'));
  if (supabaseKey) {
    const val = await page.evaluate((k) => localStorage.getItem(k), supabaseKey);
    const parsed = JSON.parse(val || '{}');
    console.log('Session user:', parsed?.user?.email);
    console.log('Access token (first 30):', parsed?.access_token?.substring(0, 30));
  }

  // Wait for auth to settle
  await page.waitForTimeout(3000);

  // Try navigating to reports and capture console
  console.log('\n📍 Navigating to /reports...');
  await page.goto(BASE + '/reports');
  await page.waitForTimeout(8000); // Long wait to see what happens

  console.log('📍 Final URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200));
  console.log('📍 Body text:', bodyText);

  await browser.close();
})();
