import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductStat {
  name_he: string;
  units: number;
  revenue?: number;
}

interface DayStat {
  day: string;
  revenue: number;
}

interface HourStat {
  hour: string;
  orders: number;
}

interface CategoryStat {
  name_he: string;
  revenue: number;
  pct: number;
}

interface PeriodStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
}

interface Stats {
  current: PeriodStats;
  previous: PeriodStats;
  top5Products: ProductStat[];
  bottom5Products: ProductStat[];
  revenueByDay: DayStat[];
  revenueByHour: HourStat[];
  categoryBreakdown: CategoryStat[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(current: number, previous: number): string {
  if (previous === 0) return "נתון חדש";
  const change = Math.round(((current - previous) / previous) * 100);
  return change >= 0 ? `+${change}%` : `${change}%`;
}

function buildUserPrompt(stats: Stats): string {
  const { current, previous, top5Products, bottom5Products, revenueByDay, revenueByHour, categoryBreakdown } = stats;

  const revChange = pct(current.totalRevenue, previous.totalRevenue);
  const ordersChange = pct(current.totalOrders, previous.totalOrders);

  const topProducts = top5Products
    .map((p, i) => `${i + 1}. ${p.name_he} — ${p.units} יחידות${p.revenue ? `, ₪${p.revenue}` : ""}`)
    .join("\n");

  const slowProducts = bottom5Products
    .map((p, i) => `${i + 1}. ${p.name_he} — ${p.units} יחידות`)
    .join("\n");

  const busiestDay = [...revenueByDay].sort((a, b) => b.revenue - a.revenue)[0];
  const slowestDay = [...revenueByDay].sort((a, b) => a.revenue - b.revenue)[0];

  const busiestHour = [...revenueByHour].sort((a, b) => b.orders - a.orders)[0];
  const slowestHour = [...revenueByHour].filter(h => h.orders > 0).sort((a, b) => a.orders - b.orders)[0];

  const cats = categoryBreakdown
    .sort((a, b) => b.revenue - a.revenue)
    .map(c => `${c.name_he}: ₪${c.revenue} (${c.pct}%)`)
    .join(" | ");

  return `נתוני מכירות לשבוע האחרון:

**השוואה שבועית:**
- הכנסה השבוע: ₪${current.totalRevenue} (${revChange} לעומת שבוע שעבר, ₪${previous.totalRevenue})
- הזמנות: ${current.totalOrders} (${ordersChange} לעומת ${previous.totalOrders})
- ממוצע להזמנה: ₪${current.avgOrderValue}

**5 המוצרים הנמכרים ביותר:**
${topProducts}

**מוצרים איטיים (לפחות 2 מכירות):**
${slowProducts || "אין נתונים"}

**ימים עמוסים vs. שקטים:**
- הכי עמוס: ${busiestDay?.day ?? "—"} (₪${busiestDay?.revenue ?? 0})
- הכי שקט: ${slowestDay?.day ?? "—"} (₪${slowestDay?.revenue ?? 0})

**שעות שיא:**
- שעת שיא: ${busiestHour?.hour ?? "—"} (${busiestHour?.orders ?? 0} הזמנות)
- שעה הכי שקטה: ${slowestHour?.hour ?? "—"} (${slowestHour?.orders ?? 0} הזמנות)

**פילוח לפי קטגוריה:**
${cats || "אין נתונים"}

החזר JSON בדיוק בפורמט הזה (ללא טקסט נוסף):
{
  "recommendations": [
    {
      "title": "כותרת קצרה",
      "body": "הסבר מפורט של 2-3 משפטים",
      "promoIdea": "הצעת מבצע קצרה וחדה (משפט אחד) שקשורה להמלצה הזו"
    }
  ],
  "weeklyPromotion": {
    "title": "שם המבצע",
    "description": "תיאור המבצע ב-2 משפטים",
    "discount": "פרטי ההנחה לדוגמה: 20% הנחה",
    "targetItems": ["פריט 1", "פריט 2"],
    "bestDays": "הימים המומלצים להפעלת המבצע",
    "imagePrompt": "Professional food photography for an Israeli cafe. Close-up appetizing top-down shot of [list exactly the targetItems foods by their visual appearance, e.g. 'a juicy burger with fries', 'a breakfast plate with eggs and toast']. Beautifully arranged on a rustic wooden table, warm natural lighting, shallow depth of field, vibrant food colors. NO text, NO logos, NO social media UI, NO decorations. Clean minimal background. Square format, photorealistic."
  }
}

צור 5-6 המלצות. המבצע השבועי יהיה מבצע שפוגע ישירות בנקודת החולשה שגילית בנתונים (למשל יום שקט, שעה חלשה, מוצר שצריך דחיפה).`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as { stats?: Stats; imagePrompt?: string };

    // ── Image-only mode ──────────────────────────────────────────────────────
    if (body.imagePrompt) {
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const imgRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: body.imagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
      });
      if (!imgRes.ok) {
        const errText = await imgRes.text();
        console.error(`Image gen error ${imgRes.status}:`, errText);
        let errMsg = `שגיאה ${imgRes.status}`;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson?.error?.message || errJson?.error?.code || errMsg;
        } catch {}
        return new Response(JSON.stringify({ imageBase64: null, error: errMsg }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const imgData = await imgRes.json();
      // gpt-image-1 returns b64_json directly; older models may return url
      const b64Direct = imgData.data?.[0]?.b64_json;
      if (b64Direct) {
        return new Response(JSON.stringify({ imageBase64: b64Direct }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const imageUrl = imgData.data?.[0]?.url;
      if (!imageUrl) {
        return new Response(JSON.stringify({ imageBase64: null, error: "לא התקבלה תמונה מה-API" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Fetch URL and convert to base64
      const imageRes = await fetch(imageUrl);
      const buffer = await imageRes.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binary);
      return new Response(JSON.stringify({ imageBase64: b64 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { stats } = body;

    if (!stats) {
      return new Response(JSON.stringify({ error: "Missing stats" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 2500,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "אתה יועץ עסקי מומחה לבתי קפה. נתח נתוני מכירות וספק המלצות קונקרטיות ומבצע שבועי. החזר תמיד JSON בלבד לפי הסכמה שתקבל.",
          },
          {
            role: "user",
            content: buildUserPrompt(stats),
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`OpenAI error ${res.status}:`, errText);
      return new Response(JSON.stringify({ error: `OpenAI error: ${res.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const rawContent: string = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: { recommendations?: unknown[]; weeklyPromotion?: unknown };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = { recommendations: [], weeklyPromotion: null };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
