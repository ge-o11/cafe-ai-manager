const OLD_URL = "https://byqiorifheddpxmrztxz.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cWlvcmlmaGVkZHB4bXJ6dHh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUzMTUwNSwiZXhwIjoyMDg2MTA3NTA1fQ.Tgf5WdMBFkYHmGF7ZnRkRFxuzmwp7Yn6RjJhK2rFgaE";

const NEW_URL = "https://kfdmgskfvzkftbachtgg.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZG1nc2tmdnprZnRiYWNodGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY5Mjc5NiwiZXhwIjoyMDkyMjY4Nzk2fQ.X1zSkuSCvfeITG_-Gg7EylBShsDKopBeX3rn2cS0jug";

async function fetchAll(baseUrl, key, table) {
  const res = await fetch(`${baseUrl}/rest/v1/${table}?select=*&order=id`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${table}: ${await res.text()}`);
  return res.json();
}

async function insertAll(baseUrl, key, table, rows) {
  if (!rows.length) { console.log(`  [${table}] no rows to insert`); return; }
  const res = await fetch(`${baseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Failed to insert into ${table}: ${await res.text()}`);
}

async function migrate() {
  // Order matters: categories before menu_items, orders before order_items
  const tables = ["categories", "menu_items", "hero_images", "orders", "order_items"];

  for (const table of tables) {
    process.stdout.write(`Migrating ${table}... `);
    const rows = await fetchAll(OLD_URL, OLD_KEY, table);
    console.log(`fetched ${rows.length} rows`);
    if (rows.length > 0) {
      await insertAll(NEW_URL, NEW_KEY, table, rows);
      console.log(`  [${table}] ✓ inserted ${rows.length} rows`);
    }
  }

  console.log("\nMigration complete!");
}

migrate().catch(err => { console.error("Error:", err.message); process.exit(1); });
