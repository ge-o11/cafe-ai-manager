-- ─────────────────────────────────────────────────────────────────────────────
-- Waiter system upgrade
-- Adds: discount tracking, employee_id link on orders,
--       role/hourly_rate on employees, restaurant_tables for cleaning state
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Discount tracking + employee link on orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS employee_id        TEXT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_type      TEXT          DEFAULT NULL
    CONSTRAINT orders_discount_type_check CHECK (discount_type IN ('percent','fixed')),
  ADD COLUMN IF NOT EXISTS discount_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_reason    TEXT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_approved_by TEXT        DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_employee_id ON orders (employee_id);

-- 2. Employee role + hourly rate (idempotent)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS role        TEXT          DEFAULT NULL
    CONSTRAINT employees_role_check CHECK (role IN ('waiter','kitchen','manager')),
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT NULL;

-- 3. Persistent table-level cleaning state
CREATE TABLE IF NOT EXISTS restaurant_tables (
  table_number  INTEGER     PRIMARY KEY,
  needs_cleaning BOOLEAN    NOT NULL DEFAULT FALSE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_restaurant_tables"
  ON restaurant_tables FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_write_restaurant_tables"
  ON restaurant_tables FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Publish real-time changes for table-status channel
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
