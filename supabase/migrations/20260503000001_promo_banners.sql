create table if not exists public.promo_banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  duration_seconds integer not null default 20,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.promo_banners enable row level security;

create policy "promo_banners_select_public"
  on public.promo_banners for select
  using (true);

create policy "promo_banners_all_admins"
  on public.promo_banners for all
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'
    )
  );
