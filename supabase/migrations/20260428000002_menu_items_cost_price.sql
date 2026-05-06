-- Add cost_price to menu_items for profitability tracking
ALTER TABLE public.menu_items
ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT NULL;
