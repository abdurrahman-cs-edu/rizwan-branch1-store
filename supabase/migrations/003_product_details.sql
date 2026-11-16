-- APPLIED to the Website project (wmsyollcbgqfvaslivjx). Kept as a record.
-- Adds product detail fields shown on the product page, like rizwanclothing.com.
-- Undo (only if needed):
--   alter table public.products drop column color, drop column season,
--     drop column shirt_fabric, drop column dupatta_fabric, drop column trouser_fabric;
--   (then re-create view website_catalogue without those columns, see 002)

alter table public.products
  add column if not exists color text,
  add column if not exists season text,
  add column if not exists shirt_fabric text,
  add column if not exists dupatta_fabric text,
  add column if not exists trouser_fabric text;

alter table public.products
  drop constraint if exists products_season_check;
alter table public.products
  add constraint products_season_check check (season is null or season in ('summer','winter'));

create or replace view public.website_catalogue as
select
  p.id, p.slug, p.name, p.fabric, p.price, p.sale_price, p.description,
  p.images, p.collection_slug, p.includes, p.sold_out, p.is_new,
  p.website_sort, p.website_added_at,
  p.color, p.season, p.shirt_fabric, p.dupatta_fabric, p.trouser_fabric
from public.products p
where p.is_visible = true;

alter view public.website_catalogue set (security_invoker = true);
grant select on public.website_catalogue to anon, authenticated;
