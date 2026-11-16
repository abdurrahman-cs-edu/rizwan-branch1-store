-- APPLIED to the Website project (wmsyollcbgqfvaslivjx). Kept as a record.
-- Small key/value table for shop settings that the admin can edit (first use: the size chart).
-- Everyone can read it, only admins can write it.
-- Undo (only if needed): drop table public.site_settings;
--   (the website then shows the default size chart from lib/config.js)

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Anyone can read site settings" on public.site_settings;
create policy "Anyone can read site settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can add site settings" on public.site_settings;
create policy "Admins can add site settings"
  on public.site_settings for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can change site settings" on public.site_settings;
create policy "Admins can change site settings"
  on public.site_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.site_settings (key, value)
values (
  'size_chart',
  '{"unit":"inches","sizes":["S","M","L","XL"],"rows":[{"label":"Length","values":["44","45","46","46"]},{"label":"Chest","values":["19","21","22.5","25"]},{"label":"Arm Hole","values":["8","9.5","10","11"]},{"label":"Waist","values":["18","20","21.5","24"]},{"label":"Hip","values":["20","21.5","24","25.5"]},{"label":"Sleeves","values":["21","22","23","23"]}]}'::jsonb
)
on conflict (key) do nothing;
