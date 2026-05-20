-- ============================================================
-- RUN THIS ENTIRE FILE IN ONE GO IN SUPABASE SQL EDITOR
-- https://supabase.com/dashboard/project/kfdmgskfvzkftbachtgg/sql/new
-- ============================================================

-- ── 1. Settings table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.settings;
CREATE POLICY "Authenticated users can read settings"
ON public.settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings"
ON public.settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.settings (key, value) VALUES ('table_count', '20')
ON CONFLICT (key) DO NOTHING;

DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 2. Inventory table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    track_inventory BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read inventory" ON public.inventory;
CREATE POLICY "Authenticated users can read inventory"
ON public.inventory FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;
CREATE POLICY "Admins can manage inventory"
ON public.inventory FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.deduct_inventory_on_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE public.inventory
    SET quantity = GREATEST(0, quantity - NEW.quantity)
    WHERE menu_item_id = NEW.product_id AND track_inventory = true;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deduct_inventory ON public.order_items;
CREATE TRIGGER trg_deduct_inventory
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.deduct_inventory_on_order();

CREATE OR REPLACE FUNCTION public.create_inventory_for_menu_item()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.inventory (menu_item_id, quantity, low_stock_threshold, track_inventory)
    VALUES (NEW.id, 0, 5, false) ON CONFLICT (menu_item_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_inventory_on_menu_item ON public.menu_items;
CREATE TRIGGER trg_create_inventory_on_menu_item
AFTER INSERT ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.create_inventory_for_menu_item();

INSERT INTO public.inventory (menu_item_id, quantity, low_stock_threshold, track_inventory)
SELECT id, 0, 5, false FROM public.menu_items ON CONFLICT (menu_item_id) DO NOTHING;

DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 3. cost_price on menu_items ──────────────────────────────
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) DEFAULT NULL;

-- ── 4. Payment method ────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM ('cash', 'credit', 'app', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method public.payment_method DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_note TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE OR REPLACE FUNCTION public.set_paid_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
        NEW.paid_at = now();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_paid_at ON public.orders;
CREATE TRIGGER trg_set_paid_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_paid_at();

-- ── 5. Session note on orders ────────────────────────────────
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS session_note TEXT DEFAULT NULL;

-- ── 6. Waiter upgrade (discounts, employee_id, restaurant_tables) ────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS employee_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT NULL
    CONSTRAINT orders_discount_type_check CHECK (discount_type IN ('percent','fixed')),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_reason TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_approved_by TEXT DEFAULT NULL;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT NULL
    CONSTRAINT employees_role_check CHECK (role IN ('waiter','kitchen','manager')),
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  table_number  INTEGER     PRIMARY KEY,
  needs_cleaning BOOLEAN    NOT NULL DEFAULT FALSE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read restaurant_tables" ON public.restaurant_tables;
CREATE POLICY "Authenticated users can read restaurant_tables"
ON public.restaurant_tables FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage restaurant_tables" ON public.restaurant_tables;
CREATE POLICY "Authenticated users can manage restaurant_tables"
ON public.restaurant_tables FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 7. Menu item modifiers column ────────────────────────────────────────────
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS modifiers TEXT[] NOT NULL DEFAULT '{}';

-- ── 8. Populate modifiers for every menu item ────────────────────────────────
-- Starters
UPDATE public.menu_items SET modifiers = ARRAY['חריף','גבינה','שום']                                              WHERE id = '3d2de157-40ab-49ce-83cc-1a9fb1fcbaa4';
UPDATE public.menu_items SET modifiers = ARRAY['קפרים','פרמזן','בצל ירוק','פטרוזיליה','שמן זית']                 WHERE id = '11e922f4-d164-4891-a62d-4c678dbb6637';
UPDATE public.menu_items SET modifiers = ARRAY['חריף','חרדל','שום']                                               WHERE id = '44f18f55-19db-497a-b4fd-c2eda70b07df';
UPDATE public.menu_items SET modifiers = ARRAY['רוטב חריף','שום','דבש','עשבי תיבול']                             WHERE id = 'bec4571d-fa6c-4528-be25-df732b56d3ed';
UPDATE public.menu_items SET modifiers = ARRAY['לימון','שום','חרדל']                                              WHERE id = '7865caff-22f0-4100-981f-e8f520dd6262';
UPDATE public.menu_items SET modifiers = ARRAY['רוטב','שום']                                                      WHERE id = 'ecb93970-14ec-4eac-b7ac-9f8214fc4060';
-- Salads
UPDATE public.menu_items SET modifiers = ARRAY['בצל','עגבניה','מלפפון','גבינה','קרוטונים','חרדל']                WHERE id = '964f9429-1612-4056-9ab0-ec57eeb99f24';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','עגבניה','מלפפון','אבוקדו','לימון']                         WHERE id = '3f43b14a-5c3c-48ef-a7dc-300591263253';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','עגבניה','מלפפון','קרוטונים','רוטב']                        WHERE id = 'f31062b3-7cac-47c1-8ee1-f57a12ebe32a';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','עגבניה','מלפפון','זיתים','לימון']                          WHERE id = '847c234e-3879-431f-aab5-6a8314b693a1';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','עגבניה','מלפפון','זיתים','גבינה','חמוצים']                 WHERE id = '2a587810-9022-4a20-afb5-7b63c6ba1c3d';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','עגבניה','מלפפון','רוטב']                                    WHERE id = '4ffaee9e-4636-441e-a456-170139efe840';
-- Burgers
UPDATE public.menu_items SET modifiers = ARRAY['בצל','חרדל','קטשופ','מיונז','חסה','עגבניה','גבינה','חמוצים']    WHERE id = '5e162f6c-39de-4c3c-91a5-32feda641d08';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','חרדל','קטשופ','מיונז','חסה','עגבניה','גבינה','חמוצים']    WHERE id = 'fbf14375-791f-44c6-8248-6f23f92fd552';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','חרדל','קטשופ','מיונז','חסה','עגבניה','גבינה','חמוצים']    WHERE id = 'f7988f65-dc2b-4cb7-949c-ea85158151a3';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','חרדל','קטשופ','מיונז','חסה','עגבניה','גבינה','חמוצים']    WHERE id = '0cb2958f-7964-4e84-94ff-4794251e2600';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','חרדל','קטשופ','מיונז','חסה','עגבניה']                      WHERE id = 'f84df142-3e7e-4f8c-956b-30afc0d69530';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','קטשופ','מיונז','עגבניה']                                    WHERE id = '876cafd4-5b6a-4140-a19b-e9dfc0a7adea';
-- Main Plates
UPDATE public.menu_items SET modifiers = ARRAY['לימון','תחמיץ','חסה','אורז','ציפס']                               WHERE id = '311883cf-425c-4f05-adc9-6cb772a55b2d';
UPDATE public.menu_items SET modifiers = ARRAY['לימון','שום','עשבי תיבול','אורז']                                 WHERE id = '565d1590-da7c-4f9f-860a-8c9e87f948a3';
UPDATE public.menu_items SET modifiers = ARRAY['שום','עשבי תיבול','פלפל שחור','אורז']                             WHERE id = '9e819803-40ea-45f0-b676-b756b7596b2a';
UPDATE public.menu_items SET modifiers = ARRAY['שום','בצל','חריף','אורז','פטרוזיליה']                             WHERE id = '2848c2cb-51bb-41f2-9016-aa5a46584f7f';
UPDATE public.menu_items SET modifiers = ARRAY['שום','לימון','חמאה','שמנת','פטרוזיליה']                           WHERE id = '46fa019f-dbcf-486e-8424-a36731d15ccd';
-- Tortillas
UPDATE public.menu_items SET modifiers = ARRAY['בצל','עגבניה','חסה','גבינה','מיונז','חרדל','חריף']               WHERE id = '23275025-65be-4ebb-92ba-27eceea8ef30';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','עגבניה','חסה','גבינה','מיונז','חרדל']                      WHERE id = '0a42ff05-e68a-4c8c-a4ed-aa9686de60ba';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','עגבניה','חסה','גבינה','מיונז']                             WHERE id = '4f8a15c4-3bb4-4d9e-b6e6-88075e74dc6c';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','עגבניה','חסה','גבינה','מיונז','חרדל']                      WHERE id = 'b3bd0f45-5985-4774-acda-eec0e4ca111b';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','עגבניה','חסה','גבינה','חריף']                               WHERE id = 'f58a3b60-fc3e-46e9-b0d9-4095657821d0';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','עגבניה','חסה','גבינה','רוטב']                               WHERE id = 'c5c1d1bb-5ecb-4fb6-9b01-d390a3f0afd5';
-- Desserts
UPDATE public.menu_items SET modifiers = ARRAY['שמנת','אגוזים','גנאש שוקולד']                                    WHERE id = '22389ca1-ee32-4df0-8d3b-0d77fdce2be2';
UPDATE public.menu_items SET modifiers = ARRAY['שמנת','ספוג']                                                     WHERE id = '2abce98d-d710-4418-8593-c355cf379e83';
UPDATE public.menu_items SET modifiers = ARRAY['שמנת','אגוזים']                                                   WHERE id = '8f2c4544-1fdd-4a46-9d8b-e4a2edab64e2';
UPDATE public.menu_items SET modifiers = ARRAY['שמנת','פירורים']                                                  WHERE id = '30b6ab41-45f7-4944-ad34-14a5249a1bf9';
UPDATE public.menu_items SET modifiers = ARRAY['שמנת','קינמון']                                                   WHERE id = 'db9407a0-6f4b-4530-a1b0-d725b3bbaff7';
UPDATE public.menu_items SET modifiers = ARRAY['שמנת','ביסקוויט לוטוס']                                          WHERE id = '069de619-44b7-4e87-8c1e-f7c23ac68182';
UPDATE public.menu_items SET modifiers = ARRAY['שמנת','אגוזים']                                                   WHERE id = '25823ae4-7827-4a7d-a1c2-0fe44607d782';
-- Toast
UPDATE public.menu_items SET modifiers = ARRAY['בצל','חרדל','קטשופ','פטריות','גבינה','עגבניה']                   WHERE id = '5b459f83-c5fb-454c-8c20-2bb07780e017';
UPDATE public.menu_items SET modifiers = ARRAY['בצל','גבינה','עגבניה','חרדל','מיונז']                             WHERE id = 'c8097c1d-72ef-4c77-a844-1654aefaa312';
UPDATE public.menu_items SET modifiers = ARRAY['עגבניה','בצל','חרדל']                                             WHERE id = '160efa52-f278-43d2-b035-ef339af46824';
-- Coffee & Hot Drinks
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','חלב']                                                      WHERE id = 'fe6cd949-c56c-40bf-9b44-0b44bd25fecd';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','חלב']                                                      WHERE id = '139f115a-b7e8-4039-a55c-378b042f6e6b';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','חלב','קצפת']                                               WHERE id = 'dce26f2d-78a1-4b92-972f-110fda424d7b';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','חלב']                                                      WHERE id = '261fa74c-1d81-4aa8-bf11-8023f95cd90c';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','חלב']                                                      WHERE id = '2c400c79-59d6-4008-ae0c-c920f6746f06';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','חלב','קצפת']                                               WHERE id = '0d6309e4-9a04-42a6-932d-49e2fe5da6e8';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','חלב','מרשמלו','קצפת']                                     WHERE id = '2dfc0945-720e-42f7-b937-cb87038e056f';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','חלב']                                                      WHERE id = 'b236caef-20bb-4b50-b0ff-f65789f04785';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','חלב']                                                      WHERE id = '4caa3c20-bfbd-4b50-906d-5afa1cc3c901';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','חלב']                                                      WHERE id = '3e5b5cc5-53b3-467a-a658-0c3dff204be7';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','נענע','לימון']                                             WHERE id = '01c0850d-ffca-4d2c-959a-4cc575b70860';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','קינמון','אגוזים','קוקוס']                                  WHERE id = '83634c49-45c0-4a8a-af04-8ece42a54a27';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','קצפת','קינמון']                                            WHERE id = 'fe51038d-2d45-4992-acc5-6967c916585e';
UPDATE public.menu_items SET modifiers = ARRAY['סוכר','חלב']                                                      WHERE id = '1045f0b4-3380-4e08-91ec-31f91e39bc2b';
-- Sides
UPDATE public.menu_items SET modifiers = ARRAY['חריף','חרדל','שום']                                               WHERE id = 'f2aba525-06d7-463e-8019-2ec98f325b5c';
UPDATE public.menu_items SET modifiers = ARRAY['מלח','תיבול','רוטב']                                              WHERE id = 'bc8180a7-bc80-4abd-889f-0581d6141bd4';
UPDATE public.menu_items SET modifiers = ARRAY['מלח','תיבול']                                                     WHERE id = '6c7463aa-1a8e-45e0-b477-40de5d14ea1f';
UPDATE public.menu_items SET modifiers = ARRAY['רוטב','שום']                                                      WHERE id = '71f10b56-a4e6-40dd-967f-6f1cb48dbe96';
UPDATE public.menu_items SET modifiers = ARRAY['שמנת','חמאה','שום']                                               WHERE id = 'd6feda51-7e5f-494f-ac56-71b65f42623e';
UPDATE public.menu_items SET modifiers = ARRAY['מלח','שום']                                                       WHERE id = 'ed619775-9259-492f-8a1f-21aac6aa0f53';
UPDATE public.menu_items SET modifiers = ARRAY['לימון','שום','חרדל']                                              WHERE id = '59ccbb87-fec8-48e1-8708-4ea9220a2a14';
UPDATE public.menu_items SET modifiers = ARRAY['חריף','חרדל']                                                     WHERE id = '91f50753-64ce-4a0d-a1e4-9d0af0f6a636';
