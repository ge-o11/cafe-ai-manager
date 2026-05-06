import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OVERLOAD_MSG =
  "יש עומס זמני על המערכת החכמה. אפשר לנסות שוב בעוד דקה, או לבצע את הפעולה ידנית.";

// ─── Regex constants ──────────────────────────────────────────────────────────
// ALL Hebrew characters must live inside new RegExp() strings, never inside
// /regex/ literals — esbuild fails with "Unterminated regexp literal" otherwise.

const heroIntentRegex = new RegExp(
  [
    "gallery", "slider", "hero", "banner",
    "rotating image", "rotating images",
    "background image", "background images",
    "גלריה",
    "סליידר",
    "סליידר\\s*ראשי",
    "תמונות\\s*רקע",
    "רקע\\s*מתחלף",
    "באנר",
  ].join("|"),
  "iu"
);

const reCurrencyTrail = new RegExp(
  "(\\d+(?:\\.\\d+)?)\\s*(?:שח|₪|ils)?\\s*$",
  "i"
);

const reLeadingPrep = new RegExp(
  "^(של|את|of|the)\\s+",
  "i"
);

const rePriceTrail = new RegExp(
  "\\s+(ל|to|-|:)\\s*\\d[\\d.]*(?:\\s*(?:שח|₪|ils))?\\s*$",
  "i"
);

const reNameIntro = new RegExp(
  "^(בשם\\s+ה|בשם|named|called|with the name|with name)\\s+",
  "i"
);

const reItemInCategory = new RegExp(
  "\\s+(ב|in|at)\\s*(קטגוריה|category)?\\s*",
  "i"
);
const reItemPriceWord = new RegExp(
  "\\s+(ל|to|for|price)\\s*",
  "gi"
);

// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Types ────────────────────────────────────────────────────────────────────

interface DbRecord {
  id: string;
  name_en?: string;
  name_he?: string;
  name_ar?: string;
  name_ru?: string;
  [key: string]: unknown;
}

interface SimpleCommand {
  type: string;
  data: Record<string, unknown>;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findByName(name: string, items: DbRecord[]): DbRecord | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  return (
    items.find((item) => {
      const hit = (s?: string) => {
        if (!s) return false;
        const sl = s.toLowerCase();
        return sl.includes(lower) || lower.includes(sl);
      };
      return hit(item.name_en) || hit(item.name_he) || hit(item.name_ar) || hit(item.name_ru);
    }) ?? null
  );
}

function extractTrailingNumber(text: string): number | null {
  const m = text.match(reCurrencyTrail);
  return m ? parseFloat(m[1]) : null;
}

function stripConnectors(text: string): string {
  return text
    .replace(reLeadingPrep, "")
    .replace(rePriceTrail, "")
    .trim();
}

function stripNameIntro(text: string): string {
  const m = text.match(reNameIntro);
  if (m) return text.slice(m[0].length).trim();
  return text.trim();
}

// ─── Deterministic command detection ─────────────────────────────────────────

function detectSimpleCommand(
  message: string,
  imageUrls: string[],
  categories: DbRecord[],
  menuItems: DbRecord[]
): SimpleCommand | null {
  console.log("[simple] incoming message:", message);

  const msg = message.trim();
  const lower = msg.toLowerCase();

  // 1. Update item image
  if (imageUrls.length > 0) {
    const prefixes = [
      "עדכן תמונה של ", "עדכן את התמונה של ",
      "שנה תמונה של ", "שנה את התמונה של ",
      "update image of ", "update the image of ",
      "change image of ", "change the image of ",
    ];
    for (const p of prefixes) {
      if (lower.startsWith(p.toLowerCase())) {
        const item = findByName(stripNameIntro(stripConnectors(msg.slice(p.length))), menuItems);
        if (item) {
          console.log("[simple] matched update_item image:", item.id);
          return {
            type: "update_item",
            data: { id: item.id, image_url: imageUrls[0] },
            message: "תמונת המנה עודכנה בהצלחה.",
          };
        }
      }
    }
  }

  // 2. Delete item
  const deleteItemPrefixes = [
    "מחק מנה ", "מחק את המנה ", "מחק פריט ", "מחק את הפריט ",
    "הסר מנה ", "הסר את המנה ",
    "תמחק מנה ", "תמחק את המנה ",
    "delete item ", "remove item ", "delete menu item ",
  ];
  for (const p of deleteItemPrefixes) {
    if (lower.startsWith(p.toLowerCase())) {
      const item = findByName(stripNameIntro(stripConnectors(msg.slice(p.length))), menuItems);
      if (item) {
        console.log("[simple] matched delete_item:", item.id);
        return { type: "delete_item", data: { id: item.id }, message: "המנה נמחקה בהצלחה." };
      }
    }
  }

  // 3. Delete category
  const deleteCategoryPrefixes = [
    "מחק קטגוריה ", "מחק את הקטגוריה ",
    "הסר קטגוריה ", "הסר את הקטגוריה ",
    "תמחק קטגוריה ", "תמחק את הקטגוריה ",
    "delete category ", "remove category ",
  ];
  for (const p of deleteCategoryPrefixes) {
    if (lower.startsWith(p.toLowerCase())) {
      const cat = findByName(stripNameIntro(stripConnectors(msg.slice(p.length))), categories);
      if (cat) {
        console.log("[simple] matched delete_category:", cat.id);
        return { type: "delete_category", data: { id: cat.id }, message: "הקטגוריה נמחקה בהצלחה." };
      }
    }
  }

  // 4. Update item price
  const updatePricePrefixes = [
    "עדכן את המחיר של ", "שנה את המחיר של ",
    "עדכן מחיר של ", "שנה מחיר של ",
    "עדכן מחיר ", "שנה מחיר ",
    "update price of ", "change price of ", "set price of ",
    "update price ", "change price ", "set price ",
  ];
  for (const p of updatePricePrefixes) {
    if (lower.startsWith(p.toLowerCase())) {
      const rest = msg.slice(p.length);
      const price = extractTrailingNumber(rest);
      if (price !== null) {
        const item = findByName(stripNameIntro(stripConnectors(rest)), menuItems);
        if (item) {
          console.log("[simple] matched update_item price:", item.id, price);
          return {
            type: "update_item",
            data: { id: item.id, price },
            message: `מחיר המנה עודכן ל-${price} בהצלחה.`,
          };
        }
      }
      break;
    }
  }

  // 5. Create category
  const createCategoryPrefixes = [
    "צור קטגוריה חדשה ", "הוסף קטגוריה חדשה ",
    "הוסיף קטגוריה חדשה ", "תוסיף קטגוריה חדשה ",
    "צור קטגוריה ", "הוסף קטגוריה ",
    "הוסיף קטגוריה ", "תוסיף קטגוריה ",
    "create category ", "add category ", "new category ",
  ];
  for (const p of createCategoryPrefixes) {
    if (lower.startsWith(p.toLowerCase())) {
      const catName = stripNameIntro(msg.slice(p.length).trim());
      if (catName.length > 0) {
        console.log("[simple] matched create_category:", catName);
        return {
          type: "create_category",
          data: {
            name_en: catName,
            name_he: catName,
            name_ar: catName,
            name_ru: catName,
            is_active: true,
            sort_order: categories.length + 1,
          },
          message: `הקטגוריה "${catName}" נוצרה בהצלחה עם תרגום אוטומטי לכל השפות.`,
        };
      }
    }
  }

  // 6. Create item
  const createItemPrefixes = [
    "הוסף מנה ", "הוסיף מנה ", "תוסיף מנה ", "צור מנה ",
    "add item ", "add menu item ", "create item ",
  ];
  for (const p of createItemPrefixes) {
    if (lower.startsWith(p.toLowerCase())) {
      const rest = msg.slice(p.length);
      const price = extractTrailingNumber(rest);
      if (price === null) break;

      let matchedCat: DbRecord | null = null;
      for (const cat of categories) {
        const names = [cat.name_en, cat.name_he, cat.name_ar, cat.name_ru].filter(
          (n): n is string => !!n
        );
        if (names.some((n) => rest.toLowerCase().includes(n.toLowerCase()))) {
          matchedCat = cat;
          break;
        }
      }
      if (!matchedCat) break;

      let itemName = rest.replace(reCurrencyTrail, "").trim();
      const catNames = [matchedCat.name_en, matchedCat.name_he, matchedCat.name_ar, matchedCat.name_ru].filter(
        (n): n is string => !!n
      );
      for (const cn of catNames) {
        itemName = itemName.replace(new RegExp(cn, "i"), "").trim();
      }
      itemName = itemName
        .replace(reItemInCategory, " ")
        .replace(reItemPriceWord, " ")
        .trim();

      if (itemName.length > 0) {
        console.log("[simple] matched create_item:", itemName, "cat:", matchedCat.id, "price:", price);
        return {
          type: "create_item",
          data: {
            name_en: itemName,
            name_he: itemName,
            name_ar: itemName,
            name_ru: itemName,
            category_id: matchedCat.id,
            price,
            is_active: true,
            sort_order: menuItems.length + 1,
          },
          message: `המנה "${itemName}" נוצרה בהצלחה עם תרגום אוטומטי לכל השפות.`,
        };
      }
      break;
    }
  }

  console.log("[simple] no simple match, falling back to OpenAI");
  return null;
}

// ─── Direct DB execution ──────────────────────────────────────────────────────

async function executeSimpleCommand(
  cmd: SimpleCommand,
  supabase: ReturnType<typeof createClient>
): Promise<{ response: string; actionsApplied: boolean }> {
  switch (cmd.type) {
    case "create_category":
      await supabase.from("categories").insert(cmd.data);
      break;
    case "delete_category":
      await supabase.from("categories").delete().eq("id", cmd.data.id);
      break;
    case "create_item":
      await supabase.from("menu_items").insert(cmd.data);
      break;
    case "update_item": {
      const { id, ...updates } = cmd.data;
      await supabase.from("menu_items").update(updates).eq("id", id);
      break;
    }
    case "delete_item":
      await supabase.from("menu_items").delete().eq("id", cmd.data.id);
      break;
  }
  return { response: cmd.message, actionsApplied: true };
}

// ─── OpenAI GPT-4o-mini ───────────────────────────────────────────────────────

type OAIMessage = { role: string; content: string | object[] };

async function callOpenAI(
  messages: OAIMessage[],
  maxTokens = 2000,
  retriesLeft = 2
): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY")!;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty response from OpenAI");
    return text;
  }

  const errText = await res.text();
  console.error(`OpenAI error ${res.status}:`, errText);

  if (res.status === 429 && retriesLeft > 0) {
    await delay(2000);
    return callOpenAI(messages, maxTokens, retriesLeft - 1);
  }

  throw new Error(`OpenAI ${res.status}`);
}

// ─── Translation ──────────────────────────────────────────────────────────────

interface NameTranslations {
  name_en: string;
  name_he: string;
  name_ar: string;
  name_ru: string;
}

async function translateName(name: string): Promise<NameTranslations> {
  try {
    const raw = await callOpenAI(
      [
        {
          role: "user",
          content:
            'Return ONLY a JSON object, no markdown, no explanation:\n{"en":"...","he":"...","ar":"...","ru":"..."}\nTranslate this name to English, Hebrew, Arabic, Russian: ' +
            name,
        },
      ],
      120,
      3
    );
    console.log("[translate] raw:", raw);
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      const p = JSON.parse(m[0]);
      if (p.en && p.he && p.ar && p.ru) {
        console.log("[translate] OK:", p);
        return { name_en: p.en, name_he: p.he, name_ar: p.ar, name_ru: p.ru };
      }
      console.log("[translate] incomplete keys:", p);
    }
  } catch (e) {
    console.log("[translate] failed:", String(e));
  }
  return { name_en: name, name_he: name, name_ar: name, name_ru: name };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.log("[auth] getUser failed:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("[auth] userId:", user.id);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    console.log("[auth] roleData:", roleData, "roleError:", roleError?.message);

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, imageUrls, conversationHistory } = await req.json();

    const [{ data: categories }, { data: menuItems }, { data: heroImages }] =
      await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("menu_items").select("*").order("sort_order"),
        supabase.from("hero_images").select("*").order("sort_order"),
      ]);

    // ── Deterministic path ────────────────────────────────────────────────────
    const simpleCmd = detectSimpleCommand(
      message,
      imageUrls ?? [],
      (categories as DbRecord[]) ?? [],
      (menuItems as DbRecord[]) ?? []
    );

    if (simpleCmd) {
      if (
        (simpleCmd.type === "create_category" || simpleCmd.type === "create_item") &&
        typeof simpleCmd.data.name_en === "string"
      ) {
        const originalName = simpleCmd.data.name_en as string;
        console.log("[translate] translating:", originalName);
        const t = await translateName(originalName);
        simpleCmd.data.name_en = t.name_en;
        simpleCmd.data.name_he = t.name_he;
        simpleCmd.data.name_ar = t.name_ar;
        simpleCmd.data.name_ru = t.name_ru;

        const translationWorked =
          t.name_en !== originalName ||
          t.name_he !== originalName ||
          t.name_ar !== originalName ||
          t.name_ru !== originalName;

        if (!translationWorked) {
          const label = simpleCmd.type === "create_category" ? "הקטגוריה" : "המנה";
          simpleCmd.message = `${label} "${originalName}" נוצרה. התרגום האוטומטי נכשל — ניתן לעדכן ידנית.`;
        }
      }

      console.log("[simple] executing:", simpleCmd.type);
      const result = await executeSimpleCommand(simpleCmd, supabase);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── OpenAI chat path ──────────────────────────────────────────────────────
    const normalizedMessage = String(message || "").toLowerCase();
    const explicitHeroIntent = heroIntentRegex.test(normalizedMessage);

    const systemPrompt = `You are an AI assistant for Cafe Nof menu management. You help the admin manage the cafe's digital menu.

Current Menu State:
Categories: ${JSON.stringify(categories || [], null, 2)}
Menu Items: ${JSON.stringify(menuItems || [], null, 2)}
Hero/Gallery Images: ${JSON.stringify(heroImages || [], null, 2)}

CRITICAL RULE - IMAGE SEPARATION:
- Menu item images and gallery/hero/slider images are COMPLETELY SEPARATE systems.
- When the user uploads an image to update a MENU ITEM, use it ONLY as the image_url for that specific menu item. Do NOT add it to the hero_images/gallery.
- When the user uploads an image for the GALLERY, SLIDER, HERO, or ROTATING IMAGES, use the "add_hero_image" or "update_hero_image" action. Do NOT use it as a menu item image.
- NEVER automatically add a menu item image to the gallery/hero images.
- NEVER automatically add a gallery image as a menu item image.
- Only update gallery/hero images when the user EXPLICITLY mentions: gallery, slider, hero, rotating images, background images, or banner.

MULTILINGUAL SUPPORT:
- The menu supports 4 languages: English (en), Hebrew (he), Arabic (ar), Russian (ru).
- When creating or updating items/categories, ALWAYS provide ALL 4 language fields: name_en, name_he, name_ar, name_ru (and description_en, description_he, description_ar, description_ru for items).
- If the user provides text in only one language, translate to the other 3 languages automatically.
- For example, if user says "add espresso", generate name_en="Espresso", name_he="אספרסו", name_ar="إسبريسو", name_ru="Эспрессо".

You can help with:
1. Adding new categories (need name_en, name_he, name_ar, name_ru)
2. Adding new menu items (need category_id, name_en, name_he, name_ar, name_ru, price, and descriptions in all 4 languages)
3. Updating existing items (prices, descriptions, names, images)
4. Deleting items or categories
5. Managing hero/gallery/slider images (ONLY when explicitly requested)
6. Answering questions about the menu

When the user wants to make changes, respond with a JSON block containing the actions to take:
\`\`\`json
{
  "actions": [
    {
      "type": "create_category" | "update_category" | "delete_category" | "create_item" | "update_item" | "delete_item" | "add_hero_image" | "update_hero_image" | "delete_hero_image",
      "data": { ... }
    }
  ],
  "message": "Your response message to the user"
}
\`\`\`

For create_category: data should have name_en, name_he, name_ar, name_ru, sort_order (optional), is_active (optional)
For update_category: data should have id and any fields to update
For delete_category: data should have id
For create_item: data should have category_id, name_en, name_he, name_ar, name_ru, price, and optionally description_en, description_he, description_ar, description_ru, image_url, sort_order, is_active
For update_item: data should have id and any fields to update (including image_url for item image)
For delete_item: data should have id
For add_hero_image: data should have image_url, sort_order (optional), is_active (optional) — ONLY when user explicitly asks to add to gallery/slider/hero
For update_hero_image: data should have id and any fields to update
For delete_hero_image: data should have id

IMPORTANT: When the user sends images, their public URLs will be provided. Use these URLs as the image_url ONLY for the specific purpose the user requested:
- If they say "update the image of [item name]" → use update_item with image_url
- If they say "add to gallery/slider/hero" → use add_hero_image with image_url
- If unclear, ASK the user what they want to do with the image. Do NOT assume.

If the user is just asking a question or no action is needed, respond with regular text without JSON.

Be helpful and conversational. Understand Hebrew, English, Arabic, and Russian. Respond in the same language the user writes in.`;

    // Build messages array in OpenAI format
    const messages: OAIMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    for (const msg of conversationHistory || []) {
      messages.push({ role: msg.role, content: msg.content });
    }

    if (imageUrls && imageUrls.length > 0) {
      const content: object[] = [
        { type: "text", text: message + "\n\nAttached image URLs: " + imageUrls.join(", ") },
      ];
      for (const url of imageUrls) {
        content.push({ type: "image_url", image_url: { url } });
      }
      messages.push({ role: "user", content });
    } else {
      messages.push({ role: "user", content: message });
    }

    let assistantMessage: string;
    try {
      assistantMessage = await callOpenAI(messages, 2000);
    } catch (err) {
      console.error("[openai] failed:", err);
      return new Response(
        JSON.stringify({ response: OVERLOAD_MSG, actionsApplied: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let actionsApplied = false;
    let responseMessage = assistantMessage;

    const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const actionData = JSON.parse(jsonMatch[1]);
        if (actionData.actions && Array.isArray(actionData.actions)) {
          const containsHeroAction = actionData.actions.some(
            (action: { type?: string }) =>
              ["add_hero_image", "update_hero_image", "delete_hero_image"].includes(action.type || "")
          );

          if (containsHeroAction && !explicitHeroIntent) {
            responseMessage =
              "התמונה או הבקשה נקלטו, אבל לא בוצע עדכון לגלריה כי לא ביקשת זאת במפורש. אם רצית לעדכן רק תמונת מנה — זה יישאר ברמת המנה בלבד.";
          } else {
            for (const action of actionData.actions) {
              switch (action.type) {
                case "create_category":
                  await supabase.from("categories").insert(action.data);
                  break;
                case "update_category": {
                  const { id: catId, ...catUpdates } = action.data;
                  await supabase.from("categories").update(catUpdates).eq("id", catId);
                  break;
                }
                case "delete_category":
                  await supabase.from("categories").delete().eq("id", action.data.id);
                  break;
                case "create_item":
                  await supabase.from("menu_items").insert(action.data);
                  break;
                case "update_item": {
                  const { id: itemId, ...itemUpdates } = action.data;
                  await supabase.from("menu_items").update(itemUpdates).eq("id", itemId);
                  break;
                }
                case "delete_item":
                  await supabase.from("menu_items").delete().eq("id", action.data.id);
                  break;
                case "add_hero_image":
                  await supabase.from("hero_images").insert(action.data);
                  break;
                case "update_hero_image": {
                  const { id: heroId, ...heroUpdates } = action.data;
                  await supabase.from("hero_images").update(heroUpdates).eq("id", heroId);
                  break;
                }
                case "delete_hero_image":
                  await supabase.from("hero_images").delete().eq("id", action.data.id);
                  break;
              }
            }
            actionsApplied = true;
          }
        }
        responseMessage = actionData.message || "Changes applied successfully.";
      } catch (e) {
        console.error("Error parsing actions:", e);
      }
    }

    return new Response(
      JSON.stringify({ response: responseMessage, actionsApplied }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
