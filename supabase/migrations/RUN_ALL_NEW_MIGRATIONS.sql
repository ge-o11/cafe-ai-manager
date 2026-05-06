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
