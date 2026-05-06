create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  employee_number text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint employees_number_unique unique (employee_number),
  constraint employees_number_format check (employee_number ~ '^\d{4}$')
);

alter table public.employees enable row level security;

-- Anyone can read employees (needed to validate PIN without admin login)
create policy "employees_select_public"
  on public.employees for select
  using (true);

-- Only admins can insert/update/delete
create policy "employees_all_admins"
  on public.employees for all
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
