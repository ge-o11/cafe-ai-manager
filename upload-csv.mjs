import { readFileSync } from "fs";
import { join } from "path";

const NEW_URL = "https://kfdmgskfvzkftbachtgg.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZG1nc2tmdnprZnRiYWNodGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY5Mjc5NiwiZXhwIjoyMDkyMjY4Nzk2fQ.X1zSkuSCvfeITG_-Gg7EylBShsDKopBeX3rn2cS0jug";
const CSV_DIR = "C:\\Users\\jorj\\OneDrive\\Desktop\\DataCafeNof";

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(";");
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(";");
    const obj = {};
    headers.forEach((h, idx) => {
      const val = values[idx] ?? "";
      if (val === "") obj[h] = null;
      else if (val === "true") obj[h] = true;
      else if (val === "false") obj[h] = false;
      else obj[h] = val;
    });
    rows.push(obj);
  }
  return rows;
}

async function supabaseGet(table) {
  const res = await fetch(`${NEW_URL}/rest/v1/${table}?select=*`, {
    headers: { apikey: NEW_KEY, Authorization: `Bearer ${NEW_KEY}` },
  });
  if (!res.ok) throw new Error(`GET ${table}: ${await res.text()}`);
  return res.json();
}

async function supabaseUpsert(table, rows) {
  const res = await fetch(`${NEW_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: NEW_KEY,
      Authorization: `Bearer ${NEW_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

function readCSV(filename) {
  try {
    const text = readFileSync(join(CSV_DIR, filename), "utf-8");
    return parseCSV(text);
  } catch {
    return null;
  }
}

async function run() {
  // ── 1. menu_items ──────────────────────────────────────────────
  // menu_items-export-2026-04-20_19-52-45.csv is the newer one
  console.log("\n── menu_items ──");
  const menuRows = readCSV("menu_items-export-2026-04-20_19-52-45.csv");
  if (!menuRows?.length) { console.log("  empty or missing"); }
  else {
    // Extract unique category_ids and ensure categories exist
    const catIds = [...new Set(menuRows.map(r => r.category_id).filter(Boolean))];
    const existingCats = await supabaseGet("categories");
    const existingCatIds = new Set(existingCats.map(c => c.id));
    const missingCatIds = catIds.filter(id => !existingCatIds.has(id));

    if (missingCatIds.length) {
      console.log(`  creating ${missingCatIds.length} placeholder categories...`);
      const placeholders = missingCatIds.map((id, i) => ({
        id,
        name_en: `Category ${i + 1}`,
        name_he: `קטגוריה ${i + 1}`,
        name_ar: `فئة ${i + 1}`,
        name_ru: `Категория ${i + 1}`,
        sort_order: i,
        is_active: true,
      }));
      await supabaseUpsert("categories", placeholders);
      console.log("  placeholder categories created");
    }

    await supabaseUpsert("menu_items", menuRows);
    console.log(`  ✓ ${menuRows.length} rows uploaded`);
  }

  // ── 2. hero_images ──────────────────────────────────────────────
  console.log("\n── hero_images ──");
  const heroRows = readCSV("hero_images-export-2026-04-20_19-52-19.csv");
  if (!heroRows?.length) { console.log("  empty — skipped"); }
  else {
    await supabaseUpsert("hero_images", heroRows);
    console.log(`  ✓ ${heroRows.length} rows uploaded`);
  }

  // ── 3. orders ──────────────────────────────────────────────────
  // waiter_id references auth.users — try inserting, report failures
  console.log("\n── orders ──");
  const orderRows = readCSV("orders-export-2026-04-20_19-53-22.csv");
  if (!orderRows?.length) { console.log("  empty — skipped"); }
  else {
    try {
      await supabaseUpsert("orders", orderRows);
      console.log(`  ✓ ${orderRows.length} rows uploaded`);
    } catch (e) {
      console.log(`  ⚠ orders skipped (waiter_id references auth.users not yet migrated): ${JSON.parse(e.message)?.message ?? e.message}`);
    }
  }

  // ── 4. order_items ──────────────────────────────────────────────
  console.log("\n── order_items ──");
  const orderItemRows = readCSV("order_items-export-2026-04-20_19-53-06.csv");
  if (!orderItemRows?.length) { console.log("  empty — skipped"); }
  else {
    try {
      await supabaseUpsert("order_items", orderItemRows);
      console.log(`  ✓ ${orderItemRows.length} rows uploaded`);
    } catch (e) {
      console.log(`  ⚠ order_items skipped (depends on orders): ${JSON.parse(e.message)?.message ?? e.message}`);
    }
  }

  // ── 5. ai_chat_messages ─────────────────────────────────────────
  console.log("\n── ai_chat_messages ──");
  const chatRows = readCSV("ai_chat_messages-export-2026-04-20_19-54-03.csv");
  if (!chatRows?.length) { console.log("  empty — skipped"); }
  else {
    try {
      await supabaseUpsert("ai_chat_messages", chatRows);
      console.log(`  ✓ ${chatRows.length} rows uploaded`);
    } catch (e) {
      console.log(`  ⚠ ai_chat_messages skipped (user_id references auth.users): ${JSON.parse(e.message)?.message ?? e.message}`);
    }
  }

  // ── 6. user_roles ───────────────────────────────────────────────
  console.log("\n── user_roles ──");
  console.log("  ⚠ skipped — auth.users must be recreated manually in Supabase dashboard");

  console.log("\n✓ Migration complete!");
}

run().catch(err => { console.error("Fatal:", err.message); process.exit(1); });
