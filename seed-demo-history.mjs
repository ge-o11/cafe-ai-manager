/**
 * seed-demo-history.mjs
 * Generates 90 days of realistic café order history in Supabase.
 *
 * Usage:
 *   node seed-demo-history.mjs           # safe insert (skips if demo data exists)
 *   node seed-demo-history.mjs --force   # delete existing demo data then re-seed
 *   node seed-demo-history.mjs --dry-run # preview counts, no writes
 *
 * Marker: all seeded orders have  payment_note = "demo_seed"
 * Safe:   never touches real orders (payment_note != "demo_seed")
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://kfdmgskfvzkftbachtgg.supabase.co";
const SERVICE_KEY  =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZG1nc2tmdnprZnRiYWNodGdnIiwi" +
  "cm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY5Mjc5NiwiZXhwIjoyMDky" +
  "MjY4Nzk2fQ.X1zSkuSCvfeITG_-Gg7EylBShsDKopBeX3rn2cS0jug";

const DEMO_NOTE  = "demo_seed"; // payment_note marker on all seeded orders
const DAYS_BACK  = 90;
const FORCE      = process.argv.includes("--force");
const DRY_RUN    = process.argv.includes("--dry-run");
const TABLE_COUNT = 12; // number of tables in the café

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

const BASE_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function dbGet(table, qs = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}${qs}`;
  const res  = await fetch(url, { headers: BASE_HEADERS });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET ${table}${qs} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : [];
}

async function dbPost(table, rows) {
  if (DRY_RUN || !rows.length) return rows;
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res  = await fetch(url, {
    method: "POST",
    headers: { ...BASE_HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${table} → ${res.status} ${text}`);
  return rows;
}

async function dbDelete(table, qs) {
  if (DRY_RUN) { console.log(`  [dry-run] DELETE ${table}${qs}`); return; }
  const url = `${SUPABASE_URL}/rest/v1/${table}${qs}`;
  const res  = await fetch(url, {
    method: "DELETE",
    headers: BASE_HEADERS,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`DELETE ${table}${qs} → ${res.status} ${text}`);
}

// ─── UUID generator (no dependencies) ────────────────────────────────────────

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Pseudo-random helpers (reproducible within a run) ───────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Realistic café hour distribution (07:00 – 22:00)
const HOUR_SLOTS   = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const HOUR_WEIGHTS = [1, 2, 3,  5, 10, 14, 12,  9,  7,  6, 10, 12,  8,  5,  3,  2];

function randomOrderTime(dayDate, boostEvening = false) {
  const weights = [...HOUR_WEIGHTS];
  if (boostEvening) { weights[11] += 6; weights[12] += 6; weights[13] += 6; }
  const hour   = pickWeighted(HOUR_SLOTS, weights);
  const minute = randInt(0, 59);
  const second = randInt(0, 59);
  const d = new Date(dayDate);
  d.setHours(hour, minute, second, 0);
  return d;
}

// ─── Demo employee definitions ────────────────────────────────────────────────

const DEMO_EMPLOYEES = [
  { name: "מיכל לוי",    employee_number: "1001", role: "waiter",  hourly_rate: 32.50 },
  { name: "דוד כהן",    employee_number: "1002", role: "waiter",  hourly_rate: 32.50 },
  { name: "שירה אבירם", employee_number: "1003", role: "waiter",  hourly_rate: 32.50 },
  { name: "יוסי מזרחי", employee_number: "1004", role: "waiter",  hourly_rate: 32.50 },
  { name: "נועה גרין",  employee_number: "2001", role: "kitchen", hourly_rate: 38.00 },
  { name: "איתי שמש",   employee_number: "2002", role: "kitchen", hourly_rate: 38.00 },
  { name: "ליאור בר",   employee_number: "2003", role: "kitchen", hourly_rate: 38.00 },
  { name: "טל ניסים",   employee_number: "9001", role: "manager", hourly_rate: 55.00 },
];

// ─── Shift seeding ────────────────────────────────────────────────────────────

async function seedShifts(employees, alreadySeededDates) {
  const waiters  = employees.filter((e) => e.role === "waiter");
  const kitchen  = employees.filter((e) => e.role === "kitchen");
  const managers = employees.filter((e) => e.role === "manager");
  // Fallback if roles are not assigned
  const allW = waiters.length  ? waiters  : employees;
  const allK = kitchen.length  ? kitchen  : employees;

  const shifts = [];
  const today  = new Date();
  const start  = new Date(today);
  start.setDate(today.getDate() - DAYS_BACK);
  start.setHours(0, 0, 0, 0);

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().slice(0, 10);
    if (alreadySeededDates.has(dateKey)) continue;

    const dow = d.getDay(); // 0=Sun … 6=Sat

    // Determine who works today
    let onDutyWaiters, onDutyKitchen, onDutyManagers = [];

    if (dow === 6) {
      // Saturday — skeleton crew
      onDutyWaiters = [pick(allW)];
      onDutyKitchen = [pick(allK)];
    } else if (dow === 5) {
      // Friday evening — peak
      onDutyWaiters = [...allW].sort(() => 0.5 - Math.random()).slice(0, 3);
      onDutyKitchen = [...allK].sort(() => 0.5 - Math.random()).slice(0, Math.min(2, allK.length));
      if (managers.length) onDutyManagers = managers.slice(0, 1);
    } else {
      const wCount  = Math.min(randInt(2, 3), allW.length);
      const kCount  = Math.min(randInt(2, 3), allK.length);
      onDutyWaiters = [...allW].sort(() => 0.5 - Math.random()).slice(0, wCount);
      onDutyKitchen = [...allK].sort(() => 0.5 - Math.random()).slice(0, kCount);
      if (managers.length && Math.random() < 0.6) onDutyManagers = managers.slice(0, 1);
    }

    const allOnDuty = [...onDutyWaiters, ...onDutyKitchen, ...onDutyManagers];

    for (const emp of allOnDuty) {
      const earlyShift = Math.random() < 0.5;
      let clockInH, clockOutH;

      if (emp.role === "kitchen") {
        clockInH  = earlyShift ? 8  : 14;
        clockOutH = earlyShift ? 16 : 22;
      } else if (emp.role === "manager") {
        clockInH  = earlyShift ? 9  : 14;
        clockOutH = earlyShift ? 17 : 23;
      } else {
        clockInH  = earlyShift ? 8  : 15;
        clockOutH = earlyShift ? 16 : 23;
      }

      const clockIn  = new Date(d);
      clockIn.setHours(clockInH,  randInt(0, 20), randInt(0, 59), 0);
      const clockOut = new Date(d);
      clockOut.setHours(clockOutH, randInt(0, 30), randInt(0, 59), 0);

      // Guard: clock_out must be after clock_in
      if (clockOut <= clockIn) clockOut.setTime(clockIn.getTime() + 7 * 3_600_000);

      shifts.push({
        employee_id: emp.id,
        clock_in:    clockIn.toISOString(),
        clock_out:   clockOut.toISOString(),
      });
    }
  }

  if (!shifts.length) {
    console.log("  [shifts] nothing new to insert (already seeded or no employees)");
    return 0;
  }

  // Insert in batches of 100
  for (let i = 0; i < shifts.length; i += 100) {
    await dbPost("shifts", shifts.slice(i, i + 100));
  }
  return shifts.length;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  🌱  Café AI Manager — Demo History Seed");
  if (DRY_RUN) console.log("  ⚠️   DRY RUN — no data will be written");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ── 1. Check existing demo data ───────────────────────────────────────────
  const existing = await dbGet("orders", `?payment_note=eq.${DEMO_NOTE}&limit=1&select=id`);

  if (existing.length > 0 && !FORCE) {
    console.log("⚠️  Demo data already exists in the database.");
    console.log("   To re-seed, run:  node seed-demo-history.mjs --force\n");
    return;
  }

  if (FORCE && existing.length > 0 && !DRY_RUN) {
    console.log("🗑️  Removing existing demo orders (cascades to order_items)...");
    await dbDelete("orders", `?payment_note=eq.${DEMO_NOTE}`);
    console.log("   Done.\n");
  }

  // ── 2. Get admin user UUID (needed for waiter_id FK → auth.users) ─────────
  const userRoles = await dbGet("user_roles", "?select=user_id&limit=1");
  if (!userRoles.length) {
    console.error(
      "❌  No rows found in user_roles.\n" +
      "    Log in to the admin panel at least once, then re-run this script."
    );
    process.exit(1);
  }
  const adminUserId = userRoles[0].user_id;
  console.log(`👤  Admin user UUID: ${adminUserId}`);

  // ── 3. Fetch or create employees ──────────────────────────────────────────
  let employees = await dbGet(
    "employees",
    "?select=id,name,role,employee_number,hourly_rate&order=employee_number"
  );

  if (employees.length === 0) {
    console.log("👥  No employees found — creating 8 demo employees...");
    if (!DRY_RUN) {
      const inserted = await dbPost("employees", DEMO_EMPLOYEES);
      // Re-fetch to get generated IDs
      employees = await dbGet(
        "employees",
        "?select=id,name,role,employee_number,hourly_rate&order=employee_number"
      );
    } else {
      // Fake IDs for dry-run
      employees = DEMO_EMPLOYEES.map((e) => ({ ...e, id: uuid() }));
    }
    console.log(`   ✓ Created ${employees.length} employees.`);
  } else {
    console.log(`👥  Found ${employees.length} existing employees.`);
    employees.forEach((e) =>
      console.log(`    • ${e.name} [${e.employee_number}] ${e.role ?? "no-role"}`)
    );
  }

  const waiters  = employees.filter((e) => e.role === "waiter");
  const kitchen  = employees.filter((e) => e.role === "kitchen");
  const allW = waiters.length  ? waiters  : employees; // fallback
  const allK = kitchen.length  ? kitchen  : employees;

  // ── 4. Fetch active menu items ────────────────────────────────────────────
  const menuItems = await dbGet(
    "menu_items",
    "?select=id,price,name_he&is_active=eq.true&order=sort_order"
  );
  if (!menuItems.length) {
    console.error("❌  No active menu items found. Add menu items first.");
    process.exit(1);
  }
  console.log(`🍽️   Found ${menuItems.length} active menu items.`);

  // Assign popularity weights: top 20% → weight 5, next 50% → 2, rest → 1
  const shuffledItems = [...menuItems].sort(() => 0.5 - Math.random());
  const itemWeights   = shuffledItems.map((_, i) => {
    if (i < Math.floor(menuItems.length * 0.2)) return 5;
    if (i < Math.floor(menuItems.length * 0.7)) return 2;
    return 1;
  });

  // ── 5. Build orders and order_items ──────────────────────────────────────
  console.log(`\n📅  Building orders for the last ${DAYS_BACK} days...\n`);

  const PAYMENT_METHODS = ["cash",   "credit", "app",  "other"];
  const PAYMENT_WEIGHTS = [45,       40,       10,     5     ];
  const DISCOUNT_REASONS = ["עובד", "מנוי", "VIP", "פגם קל", "מבצע"];

  const ordersToInsert    = [];
  const orderItemsToInsert = [];
  const dayStats          = [];

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  for (let daysAgo = DAYS_BACK; daysAgo >= 0; daysAgo--) {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - daysAgo);
    dayDate.setHours(0, 0, 0, 0);

    const dow = dayDate.getDay(); // 0=Sun … 6=Sat

    // Realistic order count by day of week
    let orderCount;
    if      (dow === 6) orderCount = randInt(12, 20); // Sat  — quieter
    else if (dow === 5) orderCount = randInt(28, 35); // Fri  — peak
    else if (dow === 0) orderCount = randInt(20, 28); // Sun  — moderate
    else                orderCount = randInt(22, 32); // Mon–Thu

    const boostEvening = dow === 4 || dow === 5; // Thu/Fri → more evening orders
    let dayRevenue = 0;

    for (let i = 0; i < orderCount; i++) {
      // Stagger order times realistically
      const orderTime = randomOrderTime(dayDate, boostEvening);
      // Kitchen completes 5–25 min after order, payment 2–10 min later
      const kitchenMs = (randInt(5, 25) * 60 + randInt(0, 59)) * 1_000;
      const payMs     = (randInt(2, 10) * 60 + randInt(0, 59)) * 1_000;
      const paidAt    = new Date(orderTime.getTime() + kitchenMs + payMs);

      const waiter = pick(allW);
      const cook   = pick(allK);

      // Pick 1–4 distinct items
      const numItems   = pickWeighted([1, 2, 3, 4], [15, 40, 33, 12]);
      const pickedItems = [];
      const usedIds    = new Set();

      for (let j = 0; j < numItems; j++) {
        let item = pickWeighted(shuffledItems, itemWeights);
        // Retry once to reduce duplicate item picks per order
        if (usedIds.has(item.id)) item = pickWeighted(shuffledItems, itemWeights);
        if (usedIds.has(item.id)) continue;
        usedIds.add(item.id);
        const qty = pickWeighted([1, 2, 3], [65, 28, 7]);
        pickedItems.push({ item, qty });
      }

      // Safety: always at least one item
      if (!pickedItems.length) {
        const item = menuItems[Math.floor(Math.random() * menuItems.length)];
        pickedItems.push({ item, qty: 1 });
      }

      const subtotal = pickedItems.reduce(
        (s, p) => s + p.item.price * p.qty, 0
      );

      // ~10% of orders have a discount
      let discountType   = null;
      let discountAmount = 0;
      let discountReason = null;
      if (Math.random() < 0.10) {
        discountType   = Math.random() < 0.6 ? "percent" : "fixed";
        discountAmount = discountType === "percent"
          ? pick([5, 10, 15, 20])
          : pick([5, 10, 20, 30]);
        discountReason = pick(DISCOUNT_REASONS);
      }

      const totalPrice   = +(subtotal.toFixed(2));
      const paymentMethod = pickWeighted(PAYMENT_METHODS, PAYMENT_WEIGHTS);
      const orderId      = uuid();

      ordersToInsert.push({
        id:                  orderId,
        table_number:        randInt(1, TABLE_COUNT),
        waiter_id:           adminUserId,   // FK → auth.users (required constraint)
        employee_id:         waiter.id,     // TEXT field for performance reports
        status:              "paid",
        total_price:         totalPrice,
        payment_method:      paymentMethod,
        payment_note:        DEMO_NOTE,     // ← demo marker for safe cleanup
        paid_at:             paidAt.toISOString(),
        session_note:        null,
        discount_type:       discountType,
        discount_amount:     discountAmount,
        discount_reason:     discountReason,
        discount_approved_by: discountReason ? cook.id : null,
        created_at:          orderTime.toISOString(),
        updated_at:          paidAt.toISOString(),
      });

      for (const { item, qty } of pickedItems) {
        orderItemsToInsert.push({
          id:         uuid(),
          order_id:   orderId,
          product_id: item.id,
          quantity:   qty,
          unit_price: item.price,
          notes:      null,
          created_at: orderTime.toISOString(),
        });
      }

      dayRevenue += totalPrice;
    }

    dayStats.push({
      date:    dayDate.toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" }),
      orders:  orderCount,
      revenue: dayRevenue.toFixed(2),
    });
  }

  // ── 6. Preview summary ────────────────────────────────────────────────────
  const totalOrders  = ordersToInsert.length;
  const totalItems   = orderItemsToInsert.length;
  const totalRevenue = ordersToInsert.reduce((s, o) => s + o.total_price, 0);
  const avgPerDay    = totalRevenue / (DAYS_BACK + 1);

  console.log("📊  Preview:");
  console.log(`    Days:    ${DAYS_BACK + 1}`);
  console.log(`    Orders:  ${totalOrders}`);
  console.log(`    Items:   ${totalItems}`);
  console.log(`    Revenue: ₪${totalRevenue.toFixed(2)}`);
  console.log(`    Avg/day: ₪${avgPerDay.toFixed(2)}`);
  console.log(`    Avg orders/day: ${(totalOrders / (DAYS_BACK + 1)).toFixed(1)}`);

  // Show last 7 days sample
  console.log("\n📅  Last 7 days:");
  dayStats.slice(-7).forEach((d) =>
    console.log(`    ${d.date.padEnd(20)} ${String(d.orders).padStart(3)} orders  ₪${d.revenue}`)
  );

  if (DRY_RUN) {
    console.log("\n✅  Dry run complete — no data written.\n");
    return;
  }

  // ── 7. Insert orders in batches of 50 ────────────────────────────────────
  process.stdout.write("\n📥  Inserting orders");
  for (let i = 0; i < ordersToInsert.length; i += 50) {
    await dbPost("orders", ordersToInsert.slice(i, i + 50));
    process.stdout.write(".");
  }
  console.log(` ✓ ${totalOrders} orders`);

  // ── 8. Insert order_items in batches of 200 ───────────────────────────────
  process.stdout.write("📥  Inserting order items");
  for (let i = 0; i < orderItemsToInsert.length; i += 200) {
    await dbPost("order_items", orderItemsToInsert.slice(i, i + 200));
    process.stdout.write(".");
  }
  console.log(` ✓ ${totalItems} items`);

  // ── 9. Seed shifts ────────────────────────────────────────────────────────
  process.stdout.write("⏰  Seeding shifts");

  // Collect dates that already have shifts to avoid duplicates
  const existingShifts = await dbGet("shifts", `?select=clock_in&limit=1000`);
  const existingDates  = new Set(existingShifts.map((s) => s.clock_in.slice(0, 10)));

  const shiftCount = await seedShifts(employees, existingDates);
  console.log(shiftCount
    ? ` ✓ ${shiftCount} shifts`
    : " ⚠️  skipped (already seeded)"
  );

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ✅  Seed complete!");
  console.log(`      Orders:  ${totalOrders}`);
  console.log(`      Revenue: ₪${totalRevenue.toFixed(2)}`);
  console.log(`      Shifts:  ${shiftCount}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n💡  Open the Reports page to see the data!");
  console.log("    To remove demo data:  node seed-demo-history.mjs --force\n");
  console.log("    (Then re-run without --force to re-seed fresh data)\n");
}

main().catch((err) => {
  console.error("\n❌  Fatal error:", err.message);
  if (err.message.includes("violates foreign key")) {
    console.error(
      "\n   FK violation — likely cause: no valid auth user.\n" +
      "   Fix: log in to the admin panel at least once, then re-run."
    );
  }
  process.exit(1);
});
