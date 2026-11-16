-- APPLIED to the Website project (wmsyollcbgqfvaslivjx) on 2026-11-16. Kept as a record.
-- 1) A suit can show in MANY collections / seasons (tick boxes in the admin panel):
--      products.collection_slugs  text[]   e.g. {the-ethnic,tropical,winter}
--    The old single columns collection_slug and season stay (kept in step by the admin form).
-- 2) The top menu is managed from the admin panel:
--      collections.in_menu  boolean   (main collections with this ticked appear in the menu,
--      and the collections inside them become the dropdown)
-- 3) A new main collection "Tropical weather" (slug: tropical), shown in the menu.
--    Summer and Winter are also marked "in menu".
-- Existing suits are filled in from what they already have (their collection + their season).
--
-- Backups taken first (copies, nothing else uses them):
--   backup_products_20261116b    = copy of products
--   backup_collections_20261116  = copy of collections
--
-- UNDO (only if needed):
--   create or replace view public.website_catalogue as   -- the shape from 007, without collection_slugs
--     select p.id, p.slug, p.name, p.fabric, p.price,
--       case when p.sale_active and coalesce(p.sale_percent,0) > 0
--            then round(p.price * (100 - p.sale_percent) / 100.0) else null end as sale_price,
--       p.description, p.images, p.collection_slug, p.includes,
--       (p.sold_out or (p.stock is not null and not exists (
--          select 1 from jsonb_each_text(p.stock) e
--          where (case when e.value ~ '^[0-9]+$' then e.value::int else 0 end) > 0))) as sold_out,
--       p.is_new, p.website_sort, p.website_added_at,
--       p.color, p.season, p.shirt_fabric, p.dupatta_fabric, p.trouser_fabric,
--       case when p.sale_active and coalesce(p.sale_percent,0) > 0
--            then p.sale_percent else null end as sale_percent,
--       p.stock
--     from public.products p where p.is_visible = true;
--   (if the view refuses because of the extra column: drop view public.website_catalogue; then create it again,
--    and run: alter view public.website_catalogue set (security_invoker = true);
--             grant select on public.website_catalogue to anon, authenticated;)
--   alter table public.products drop column collection_slugs;
--   alter table public.collections drop column in_menu;
--   delete from public.collections where slug = 'tropical';   -- only if you do not want it
--   (or copy the data back from the two backup tables)

alter table public.products
  add column if not exists collection_slugs text[] not null default '{}';

alter table public.collections
  add column if not exists in_menu boolean not null default false;

-- The Tropical weather collection (a main collection, shown in the menu)
insert into public.collections (slug, name, parent_slug, sort_order, is_visible, in_menu)
select 'tropical', 'Tropical weather', null,
       coalesce((select max(sort_order) from public.collections), 0) + 1, true, true
where not exists (select 1 from public.collections where slug = 'tropical');

update public.collections set in_menu = true where slug in ('summer', 'winter', 'tropical');

-- Fill the new column from what each suit already has (its collection and its season).
update public.products p
set collection_slugs = coalesce((
  select array_agg(distinct s)
  from unnest(array[p.collection_slug, p.season]) as s
  where s is not null and exists (select 1 from public.collections c where c.slug = s)
), '{}')
where cardinality(p.collection_slugs) = 0;

-- The website reads products ONLY through this view (collection_slugs added at the end).
create or replace view public.website_catalogue as
select
  p.id, p.slug, p.name, p.fabric, p.price,
  case when p.sale_active and coalesce(p.sale_percent, 0) > 0
       then round(p.price * (100 - p.sale_percent) / 100.0)
       else null end as sale_price,
  p.description,
  p.images, p.collection_slug, p.includes,
  (p.sold_out
    or (p.stock is not null
        and not exists (
          select 1 from jsonb_each_text(p.stock) e
          where (case when e.value ~ '^[0-9]+$' then e.value::int else 0 end) > 0
        ))) as sold_out,
  p.is_new,
  p.website_sort, p.website_added_at,
  p.color, p.season, p.shirt_fabric, p.dupatta_fabric, p.trouser_fabric,
  case when p.sale_active and coalesce(p.sale_percent, 0) > 0
       then p.sale_percent
       else null end as sale_percent,
  p.stock,
  p.collection_slugs
from public.products p
where p.is_visible = true;

alter view public.website_catalogue set (security_invoker = true);
grant select on public.website_catalogue to anon, authenticated;
