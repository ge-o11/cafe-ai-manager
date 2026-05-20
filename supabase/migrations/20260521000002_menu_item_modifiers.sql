-- Add modifiers column to menu_items
-- Stores a list of removable ingredients (e.g. ["בצל","גבינה","עגבניה"])
-- Waiters can toggle these off per order item; removal auto-generates order notes.
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS modifiers TEXT[] NOT NULL DEFAULT '{}';
