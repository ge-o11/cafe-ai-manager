-- Payment method tracking for orders
CREATE TYPE public.payment_method AS ENUM ('cash', 'credit', 'app', 'other');

ALTER TABLE public.orders
ADD COLUMN payment_method public.payment_method DEFAULT NULL,
ADD COLUMN payment_note TEXT DEFAULT NULL,
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Auto-stamp paid_at when an order transitions to 'paid'
CREATE OR REPLACE FUNCTION public.set_paid_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
        NEW.paid_at = now();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_paid_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_paid_at();
