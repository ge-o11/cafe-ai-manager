import { readFileSync } from "fs";

const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZG1nc2tmdnprZnRiYWNodGdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY5Mjc5NiwiZXhwIjoyMDkyMjY4Nzk2fQ.X1zSkuSCvfeITG_-Gg7EylBShsDKopBeX3rn2cS0jug";
const URL  = "https://kfdmgskfvzkftbachtgg.supabase.co";

const text = readFileSync(
  "C:\\Users\\jorj\\OneDrive\\Desktop\\DataCafeNof\\categories-export-2026-04-20_20-33-13.csv",
  "utf-8"
);

const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim());
const headers = lines[0].split(";");

const rows = lines.slice(1).map(line => {
  const vals = line.split(";");
  const obj = {};
  headers.forEach((h, i) => {
    const v = vals[i] ?? "";
    obj[h] = v === "" ? null : v === "true" ? true : v === "false" ? false : v;
  });
  return obj;
});

console.log(`Parsed ${rows.length} categories`);

const res = await fetch(`${URL}/rest/v1/categories`, {
  method: "POST",
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify(rows),
});

if (!res.ok) {
  console.error("Error:", await res.text());
  process.exit(1);
}

console.log(`✓ ${rows.length} categories upserted successfully`);
rows.forEach(r => console.log(`  [${r.sort_order}] ${r.name_en} (${r.id})`));
