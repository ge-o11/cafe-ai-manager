import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:5174';
const OUT = 'C:/Users/jorj/OneDrive/Desktop/cafe-screenshots';
mkdirSync(OUT, { recursive: true });

const ADMIN_EMAIL = 'abodetiti11@gmail.com';
const ADMIN_PASS = '123456789$';
const ADMIN_PIN = '2002';

async function ss(page, name, ms = 1800) {
  await page.waitForTimeout(ms);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
  console.log(`✅ ${name}`);
}

// Wait for hub to fully load (isLoading = false shows "מי אתה?")
async function waitForHub(page) {
  await page.waitForSelector('text=מי אתה', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(300);
}

// Enter admin PIN via the hub UI (client-side navigation)
async function enterAdminPIN(page) {
  // Click manager card - works only when isAdmin = true (button has onClick handler)
  for (let attempt = 0; attempt < 6; attempt++) {
    // Hub must show "מי אתה?" (fully loaded)
    const hubLoaded = await page.locator('text=מי אתה').isVisible().catch(() => false);
    if (!hubLoaded) {
      await page.waitForSelector('text=מי אתה', { timeout: 10000 }).catch(() => {});
    }

    // Click the מנהל button
    await page.locator('button').filter({ hasText: 'מנהל' }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);

    // Did PIN modal open?
    const pinModal = await page.locator('text=הזינו קוד גישה').isVisible().catch(() => false);
    if (pinModal) {
      // Enter 2002
      for (const digit of ADMIN_PIN) {
        await page.locator('.grid.grid-cols-3 button').filter({ hasText: digit }).first().click();
        await page.waitForTimeout(130);
      }
      await page.waitForTimeout(500);
      console.log('  ✔ Admin PIN entered');
      return true;
    }

    console.log(`  ⏳ isAdmin not ready yet (attempt ${attempt + 1}/6), waiting 2s...`);
    await page.waitForTimeout(2000);
  }
  console.log('  ⚠️ Could not enter admin view');
  return false;
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: false, args: ['--start-maximized'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 860 } });
  const page = await ctx.newPage();

  // ── PUBLIC ────────────────────────────────────
  await page.goto(BASE + '/');
  await ss(page, '01-landing', 2500);

  await page.goto(BASE + '/menu');
  await ss(page, '02-menu', 2000);

  await page.goto(BASE + '/hub');
  await ss(page, '03-hub', 1000);

  await page.goto(BASE + '/punch');
  await ss(page, '04-punch', 1200);

  await page.goto(BASE + '/waiter');
  await ss(page, '05-waiter', 2000);

  await page.goto(BASE + '/kitchen');
  await ss(page, '06-kitchen', 2000);

  // ── LOGIN ─────────────────────────────────────
  await page.goto(BASE + '/2002-admin/login');
  await page.waitForTimeout(800);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASS);
  await ss(page, '07-login', 400);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/hub', { timeout: 10000 });

  // Wait for Hub to fully load (isLoading = false)
  await waitForHub(page);
  console.log('✅ Hub loaded');

  // ── HUB ADMIN VIEW ────────────────────────────
  const ok = await enterAdminPIN(page);
  if (!ok) { await browser.close(); process.exit(1); }
  await ss(page, '08-hub-admin-view', 600);

  // ── ADMIN DASHBOARD (client-side navigate) ────
  await page.locator('button').filter({ hasText: 'ניהול' }).first().click();
  await page.waitForTimeout(2500);
  await ss(page, '09-admin-dashboard', 500);

  // Capture dashboard tabs
  const tabs = page.locator('[role="tab"]');
  const tabCount = await tabs.count();
  console.log(`  Tabs: ${tabCount}`);
  for (let i = 0; i < Math.min(tabCount, 4); i++) {
    const label = await tabs.nth(i).innerText().catch(() => `tab${i}`);
    await tabs.nth(i).click();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: join(OUT, `10-dashboard-tab${i}.png`) });
    console.log(`✅ 10-dashboard-tab${i} (${label.trim()})`);
  }

  // ── REPORTS (client-side from hub) ────────────
  await page.goBack(); // back to hub admin view
  await page.waitForTimeout(400);
  await page.goto(BASE + '/hub');
  await waitForHub(page);
  if (await enterAdminPIN(page)) {
    await page.locator('button').filter({ hasText: 'דוחות' }).first().click();
    await ss(page, '11-reports', 3000);
  }

  // ── PERFORMANCE ───────────────────────────────
  await page.goto(BASE + '/hub');
  await waitForHub(page);
  if (await enterAdminPIN(page)) {
    await page.locator('button').filter({ hasText: 'ביצועי עובדים' }).first().click();
    await ss(page, '12-performance', 2000);
  }

  // ── HISTORY ──────────────────────────────────
  await page.goto(BASE + '/hub');
  await waitForHub(page);
  if (await enterAdminPIN(page)) {
    await page.locator('button').filter({ hasText: 'היסטוריה' }).first().click();
    await ss(page, '13-history', 2000);
  }

  // ── AI INSIGHTS ──────────────────────────────
  await page.goto(BASE + '/hub');
  await waitForHub(page);
  if (await enterAdminPIN(page)) {
    await page.locator('button').filter({ hasText: 'המלצות AI' }).first().click();
    await ss(page, '14-insights', 4000);
  }

  // ── PROMO ────────────────────────────────────
  await page.goto(BASE + '/hub');
  await waitForHub(page);
  if (await enterAdminPIN(page)) {
    await page.locator('button').filter({ hasText: 'פרסומות' }).first().click();
    await ss(page, '15-promo', 2000);
  }

  // ── INVENTORY (direct URL - accessible from admin dashboard) ─────────────
  // Navigate via back button from promo page back to hub, then to inventory
  // Since inventory is not in hub, go directly via URL after being on admin page
  // First go back to hub as admin
  await page.goto(BASE + '/hub');
  await waitForHub(page);
  if (await enterAdminPIN(page)) {
    // Navigate to admin dashboard first (client-side)
    await page.locator('button').filter({ hasText: 'ניהול' }).first().click();
    await page.waitForTimeout(1500);
    // Now navigate to inventory via JavaScript (stays in SPA context)
    await page.evaluate(() => window.history.pushState({}, '', '/inventory'));
    // Trigger React Router to recognize the navigation
    await page.goto(BASE + '/inventory');
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {});
    await ss(page, '16-inventory', 2000);
  }

  await browser.close();
  console.log('\n🎉 Done! Screenshots saved to: ' + OUT);
})();
