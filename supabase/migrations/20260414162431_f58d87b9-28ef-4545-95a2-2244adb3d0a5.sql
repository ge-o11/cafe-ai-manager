
-- Add Russian columns to categories
ALTER TABLE public.categories ADD COLUMN name_ru text NOT NULL DEFAULT '';

-- Backfill categories name_ru from name_en
UPDATE public.categories SET name_ru = name_en WHERE name_ru = '';

-- Add Russian columns to menu_items
ALTER TABLE public.menu_items ADD COLUMN name_ru text NOT NULL DEFAULT '';
ALTER TABLE public.menu_items ADD COLUMN description_ru text;

-- Backfill menu_items name_ru from name_en
UPDATE public.menu_items SET name_ru = name_en WHERE name_ru = '';
UPDATE public.menu_items SET description_ru = description_en;
