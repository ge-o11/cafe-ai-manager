-- Populate modifiers for every menu item based on standard cafe ingredients.
-- Each array lists removable ingredients a waiter can toggle off per customer request.
-- Empty array = no customisable ingredients for that item.

-- ── Starters / מנות פתיחה ─────────────────────────────────────────────────────
UPDATE menu_items SET modifiers = ARRAY['חריף','גבינה','שום']
  WHERE id = '3d2de157-40ab-49ce-83cc-1a9fb1fcbaa4'; -- הום פרייז

UPDATE menu_items SET modifiers = ARRAY['קפרים','פרמזן','בצל ירוק','פטרוזיליה','שמן זית']
  WHERE id = '11e922f4-d164-4891-a62d-4c678dbb6637'; -- קרפאצ'יו

UPDATE menu_items SET modifiers = ARRAY['חריף','חרדל','שום']
  WHERE id = '44f18f55-19db-497a-b4fd-c2eda70b07df'; -- מיני מרגז

UPDATE menu_items SET modifiers = ARRAY['רוטב חריף','שום','דבש','עשבי תיבול']
  WHERE id = 'bec4571d-fa6c-4528-be25-df732b56d3ed'; -- כנפיים

UPDATE menu_items SET modifiers = ARRAY['לימון','שום','חרדל']
  WHERE id = '7865caff-22f0-4100-981f-e8f520dd6262'; -- שניצילונים

UPDATE menu_items SET modifiers = ARRAY['רוטב','שום']
  WHERE id = 'ecb93970-14ec-4eac-b7ac-9f8214fc4060'; -- אצבעות גבינה

-- ── Salads / סלטים ────────────────────────────────────────────────────────────
UPDATE menu_items SET modifiers = ARRAY['בצל','עגבניה','מלפפון','גבינה','קרוטונים','חרדל']
  WHERE id = '964f9429-1612-4056-9ab0-ec57eeb99f24'; -- סלט עוף

UPDATE menu_items SET modifiers = ARRAY['בצל','עגבניה','מלפפון','אבוקדו','לימון']
  WHERE id = '3f43b14a-5c3c-48ef-a7dc-300591263253'; -- סלט שרימפס

UPDATE menu_items SET modifiers = ARRAY['בצל','עגבניה','מלפפון','קרוטונים','רוטב']
  WHERE id = 'f31062b3-7cac-47c1-8ee1-f57a12ebe32a'; -- סלט אנטריקוט

UPDATE menu_items SET modifiers = ARRAY['בצל','עגבניה','מלפפון','זיתים','לימון']
  WHERE id = '847c234e-3879-431f-aab5-6a8314b693a1'; -- סלט טונה

UPDATE menu_items SET modifiers = ARRAY['בצל','עגבניה','מלפפון','זיתים','גבינה','חמוצים']
  WHERE id = '2a587810-9022-4a20-afb5-7b63c6ba1c3d'; -- סלט רגיל

UPDATE menu_items SET modifiers = ARRAY['בצל','עגבניה','מלפפון','רוטב']
  WHERE id = '4ffaee9e-4636-441e-a456-170139efe840'; -- סלט סלופי

-- ── Burgers / בורגרים ─────────────────────────────────────────────────────────
UPDATE menu_items SET modifiers = ARRAY['בצל','חרדל','קטשופ','מיונז','חסה','עגבניה','גבינה','חמוצים']
  WHERE id = '5e162f6c-39de-4c3c-91a5-32feda641d08'; -- בורגר 160 גרם

UPDATE menu_items SET modifiers = ARRAY['בצל','חרדל','קטשופ','מיונז','חסה','עגבניה','גבינה','חמוצים']
  WHERE id = 'fbf14375-791f-44c6-8248-6f23f92fd552'; -- בורגר 250 גרם

UPDATE menu_items SET modifiers = ARRAY['בצל','חרדל','קטשופ','מיונז','חסה','עגבניה','גבינה','חמוצים']
  WHERE id = 'f7988f65-dc2b-4cb7-949c-ea85158151a3'; -- בורגר 320 גרם

UPDATE menu_items SET modifiers = ARRAY['בצל','חרדל','קטשופ','מיונז','חסה','עגבניה','גבינה','חמוצים']
  WHERE id = '0cb2958f-7964-4e84-94ff-4794251e2600'; -- בורגר 480 גרם

UPDATE menu_items SET modifiers = ARRAY['בצל','חרדל','קטשופ','מיונז','חסה','עגבניה']
  WHERE id = 'f84df142-3e7e-4f8c-956b-30afc0d69530'; -- בורגר טבעוני

UPDATE menu_items SET modifiers = ARRAY['בצל','קטשופ','מיונז','עגבניה']
  WHERE id = '876cafd4-5b6a-4140-a19b-e9dfc0a7adea'; -- בורגר ילדים 100 גרם

-- ── Main Plates / צלחות ───────────────────────────────────────────────────────
UPDATE menu_items SET modifiers = ARRAY['לימון','תחמיץ','חסה','אורז','ציפס']
  WHERE id = '311883cf-425c-4f05-adc9-6cb772a55b2d'; -- צלחת שניצל

UPDATE menu_items SET modifiers = ARRAY['לימון','שום','עשבי תיבול','אורז']
  WHERE id = '565d1590-da7c-4f9f-860a-8c9e87f948a3'; -- צלחת חזה עוף

UPDATE menu_items SET modifiers = ARRAY['שום','עשבי תיבול','פלפל שחור','אורז']
  WHERE id = '9e819803-40ea-45f0-b676-b756b7596b2a'; -- צלחת אנטריקוט

UPDATE menu_items SET modifiers = ARRAY['שום','בצל','חריף','אורז','פטרוזיליה']
  WHERE id = '2848c2cb-51bb-41f2-9016-aa5a46584f7f'; -- צלחת קבב

UPDATE menu_items SET modifiers = ARRAY['שום','לימון','חמאה','שמנת','פטרוזיליה']
  WHERE id = '46fa019f-dbcf-486e-8424-a36731d15ccd'; -- צלחת שרימפס

-- ── Tortillas / טורטיות ───────────────────────────────────────────────────────
UPDATE menu_items SET modifiers = ARRAY['בצל','עגבניה','חסה','גבינה','מיונז','חרדל','חריף']
  WHERE id = '23275025-65be-4ebb-92ba-27eceea8ef30'; -- טורטייה חזה עוף

UPDATE menu_items SET modifiers = ARRAY['בצל','עגבניה','חסה','גבינה','מיונז','חרדל']
  WHERE id = '0a42ff05-e68a-4c8c-a4ed-aa9686de60ba'; -- טורטייה אנטריקוט

UPDATE menu_items SET modifiers = ARRAY['בצל','עגבניה','חסה','גבינה','מיונז']
  WHERE id = '4f8a15c4-3bb4-4d9e-b6e6-88075e74dc6c'; -- טורטייה רצועות אנטריקוט

UPDATE menu_items SET modifiers = ARRAY['בצל','עגבניה','חסה','גבינה','מיונז','חרדל']
  WHERE id = 'b3bd0f45-5985-4774-acda-eec0e4ca111b'; -- טורטייה שניצל

UPDATE menu_items SET modifiers = ARRAY['בצל','עגבניה','חסה','גבינה','חריף']
  WHERE id = 'f58a3b60-fc3e-46e9-b0d9-4095657821d0'; -- טורטייה קבב

UPDATE menu_items SET modifiers = ARRAY['בצל','עגבניה','חסה','גבינה','רוטב']
  WHERE id = 'c5c1d1bb-5ecb-4fb6-9b01-d390a3f0afd5'; -- טורטייה סולפי

-- ── Desserts / קינוחים ────────────────────────────────────────────────────────
UPDATE menu_items SET modifiers = ARRAY['שמנת','אגוזים','גנאש שוקולד']
  WHERE id = '22389ca1-ee32-4df0-8d3b-0d77fdce2be2'; -- סניקרס

UPDATE menu_items SET modifiers = ARRAY['שמנת','ספוג']
  WHERE id = '2abce98d-d710-4418-8593-c355cf379e83'; -- טרמיסו

UPDATE menu_items SET modifiers = ARRAY['שמנת','אגוזים']
  WHERE id = '8f2c4544-1fdd-4a46-9d8b-e4a2edab64e2'; -- סופלה שוקולד

UPDATE menu_items SET modifiers = ARRAY['שמנת','פירורים']
  WHERE id = '30b6ab41-45f7-4944-ad34-14a5249a1bf9'; -- גבינה פירורים

UPDATE menu_items SET modifiers = ARRAY['שמנת','קינמון']
  WHERE id = 'db9407a0-6f4b-4530-a1b0-d725b3bbaff7'; -- טרליצי

UPDATE menu_items SET modifiers = ARRAY['שמנת','ביסקוויט לוטוס']
  WHERE id = '069de619-44b7-4e87-8c1e-f7c23ac68182'; -- לוטוס

UPDATE menu_items SET modifiers = ARRAY['שמנת','אגוזים','גלידה']
  WHERE id = '25823ae4-7827-4a7d-a1c2-0fe44607d782'; -- גלידה

-- ── Toast / טוסט ──────────────────────────────────────────────────────────────
UPDATE menu_items SET modifiers = ARRAY['בצל','חרדל','קטשופ','פטריות','גבינה','עגבניה']
  WHERE id = '5b459f83-c5fb-454c-8c20-2bb07780e017'; -- טוסט בשר

UPDATE menu_items SET modifiers = ARRAY['בצל','גבינה','עגבניה','חרדל','מיונז']
  WHERE id = 'c8097c1d-72ef-4c77-a844-1654aefaa312'; -- טוסט אישי

UPDATE menu_items SET modifiers = ARRAY['עגבניה','בצל','חרדל']
  WHERE id = '160efa52-f278-43d2-b035-ef339af46824'; -- טוסט גבינה

-- ── Coffee & Hot Drinks / קפה ─────────────────────────────────────────────────
UPDATE menu_items SET modifiers = ARRAY['סוכר','חלב']
  WHERE id = 'fe6cd949-c56c-40bf-9b44-0b44bd25fecd'; -- אספרסו קצר / ארוך

UPDATE menu_items SET modifiers = ARRAY['סוכר','חלב']
  WHERE id = '139f115a-b7e8-4039-a55c-378b042f6e6b'; -- אספרסו כפול

UPDATE menu_items SET modifiers = ARRAY['סוכר','חלב','קצפת']
  WHERE id = 'dce26f2d-78a1-4b92-972f-110fda424d7b'; -- הפוך (קפה לאטה)

UPDATE menu_items SET modifiers = ARRAY['סוכר','חלב']
  WHERE id = '261fa74c-1d81-4aa8-bf11-8023f95cd90c'; -- נס קפה קטן

UPDATE menu_items SET modifiers = ARRAY['סוכר','חלב']
  WHERE id = '2c400c79-59d6-4008-ae0c-c920f6746f06'; -- נס קפה

UPDATE menu_items SET modifiers = ARRAY['סוכר','חלב','קצפת']
  WHERE id = '0d6309e4-9a04-42a6-932d-49e2fe5da6e8'; -- קפוצ'ינו

UPDATE menu_items SET modifiers = ARRAY['סוכר','חלב','מרשמלו','קצפת']
  WHERE id = '2dfc0945-720e-42f7-b937-cb87038e056f'; -- הפוך מרשמלו

UPDATE menu_items SET modifiers = ARRAY['סוכר','חלב']
  WHERE id = 'b236caef-20bb-4b50-b0ff-f65789f04785'; -- אמריקאנו חם/קר

UPDATE menu_items SET modifiers = ARRAY['סוכר','חלב']
  WHERE id = '4caa3c20-bfbd-4b50-906d-5afa1cc3c901'; -- אילן

UPDATE menu_items SET modifiers = ARRAY['סוכר','חלב']
  WHERE id = '3e5b5cc5-53b3-467a-a658-0c3dff204be7'; -- קפה שחור

UPDATE menu_items SET modifiers = ARRAY['סוכר','נענע','לימון']
  WHERE id = '01c0850d-ffca-4d2c-959a-4cc575b70860'; -- תה

UPDATE menu_items SET modifiers = ARRAY['סוכר','קינמון','אגוזים','קוקוס']
  WHERE id = '83634c49-45c0-4a8a-af04-8ece42a54a27'; -- סחלב חם

UPDATE menu_items SET modifiers = ARRAY['סוכר','קצפת','קינמון']
  WHERE id = 'fe51038d-2d45-4992-acc5-6967c916585e'; -- שוקו חם

UPDATE menu_items SET modifiers = ARRAY['סוכר','חלב']
  WHERE id = '1045f0b4-3380-4e08-91ec-31f91e39bc2b'; -- קפה ומאפה

-- ── Sides / תוספות ────────────────────────────────────────────────────────────
UPDATE menu_items SET modifiers = ARRAY['חריף','חרדל','שום']
  WHERE id = 'f2aba525-06d7-463e-8019-2ec98f325b5c'; -- מיני מרגז (6 יחידות)

UPDATE menu_items SET modifiers = ARRAY['מלח','תיבול','רוטב']
  WHERE id = 'bc8180a7-bc80-4abd-889f-0581d6141bd4'; -- ציפס גדול

UPDATE menu_items SET modifiers = ARRAY['מלח','תיבול']
  WHERE id = '6c7463aa-1a8e-45e0-b477-40de5d14ea1f'; -- ציפס קטן

UPDATE menu_items SET modifiers = ARRAY['רוטב','שום']
  WHERE id = '71f10b56-a4e6-40dd-967f-6f1cb48dbe96'; -- טבעות בצל

UPDATE menu_items SET modifiers = ARRAY['שמנת','חמאה','שום']
  WHERE id = 'd6feda51-7e5f-494f-ac56-71b65f42623e'; -- כדורי פירה

UPDATE menu_items SET modifiers = ARRAY['מלח','שום']
  WHERE id = 'ed619775-9259-492f-8a1f-21aac6aa0f53'; -- אדממה

UPDATE menu_items SET modifiers = ARRAY['לימון','שום','חרדל']
  WHERE id = '59ccbb87-fec8-48e1-8708-4ea9220a2a14'; -- שניצלונים (תוספת)

UPDATE menu_items SET modifiers = ARRAY['חריף','חרדל']
  WHERE id = '91f50753-64ce-4a0d-a1e4-9d0af0f6a636'; -- אצבעות גבינה (8 יחידות)

-- ── Drinks / משקאות ───────────────────────────────────────────────────────────
-- Carbonated drinks & juices – no customisable ingredients, leave as default '{}'
-- (Hookah flavours are also not ingredient-based)
