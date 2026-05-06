-- Inventory tracking table
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    track_inventory BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read inventory (waiters need to know what's available)
CREATE POLICY "Authenticated users can read inventory"
ON public.inventory
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify inventory directly
CREATE POLICY "Admins can manage inventory"
ON public.inventory
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-deduct inventory when an order item is created
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.inventory
    SET quantity = GREATEST(0, quantity - NEW.quantity)
    WHERE menu_item_id = NEW.product_id
      AND track_inventory = true;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduct_inventory
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.deduct_inventory_on_order();

-- Auto-create an inventory row whenever a new menu item is added
CREATE OR REPLACE FUNCTION public.create_inventory_for_menu_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.inventory (menu_item_id, quantity, low_stock_threshold, track_inventory)
    VALUES (NEW.id, 0, 5, false)
    ON CONFLICT (menu_item_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_inventory_on_menu_item
AFTER INSERT ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.create_inventory_for_menu_item();

-- Seed inventory rows for all existing menu items
INSERT INTO public.inventory (menu_item_id, quantity, low_stock_threshold, track_inventory)
SELECT id, 0, 5, false FROM public.menu_items
ON CONFLICT (menu_item_id) DO NOTHING;

-- updated_at trigger
CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
