-- Allow hard-deleting menu items even if past orders reference them.
-- The original FK had ON DELETE RESTRICT, blocking deletion of any item that
-- had ever been ordered. We switch it to CASCADE so deleting a menu item
-- also removes its order_items rows.

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.menu_items(id)
  ON DELETE CASCADE;
