
-- Fix overly permissive update policy on orders - only waiter or admin can update
DROP POLICY "Authenticated users can update orders" ON public.orders;
CREATE POLICY "Waiter or admin can update orders"
ON public.orders FOR UPDATE TO authenticated
USING (waiter_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Fix overly permissive update policy on order_items
DROP POLICY "Authenticated users can update order items" ON public.order_items;
CREATE POLICY "Authenticated users can update own order items"
ON public.order_items FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (waiter_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

-- Fix overly permissive delete policy on order_items
DROP POLICY "Authenticated users can delete order items" ON public.order_items;
CREATE POLICY "Authenticated users can delete own order items"
ON public.order_items FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (waiter_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));
