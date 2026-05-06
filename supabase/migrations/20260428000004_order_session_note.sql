-- Session-level note for orders (customer info, allergies, preferences)
ALTER TABLE public.orders
ADD COLUMN session_note TEXT DEFAULT NULL;
