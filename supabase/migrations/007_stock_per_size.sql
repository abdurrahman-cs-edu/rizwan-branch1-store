-- APPLIED to the Website project (wmsyollcbgqfvaslivjx). Kept as a record.
-- Quantity per size.
--   products.stock = {"S":3,"M":5,"L":0,"XL":2,"XXL":0}   (null = quantity is not counted)
--   * a new order item takes its quantity from the stock (the order is refused if there is not enough)
--   * cancelling an order gives the quantity back; re-opening a cancelled order takes it again
--   * website_catalogue.sold_out becomes true by itself when every size is at 0
-- Backup: backup_products_20261116 (copy of products, taken before this change).
--
-- UNDO (only if needed):
--   drop trigger if exists web_order_items_take_stock on public.web_order_items;
--   drop trigger if exists web_orders_stock_on_status on public.web_orders;
--   drop function if exists public.take_stock_for_item();
--   drop function if exists public.restock_on_status_change();
--   create or replace view public.website_catalogue as   -- the shape from 006, without stock
--     select p.id, p.slug, p.name, p.fabric, p.price,
--       case when p.sale_active and coalesce(p.sale_percent,0) > 0
--            then round(p.price * (100 - p.sale_percent) / 100.0) else null end as sale_price,
--       p.description, p.images, p.collection_slug, p.includes, p.sold_out, p.is_new,
--       p.website_sort, p.website_added_at, p.color, p.season,
--       p.shirt_fabric, p.dupatta_fabric, p.trouser_fabric,
--       case when p.sale_active and coalesce(p.sale_percent,0) > 0
--            then p.sale_percent else null end as sale_percent
--     from public.products p where p.is_visible = true;
--   (if the view refuses because of the extra column: drop view public.website_catalogue; then create it again)
--   alter table public.products drop constraint if exists products_stock_check;
--   alter table public.products drop column stock;

alter table public.products add column if not exists stock jsonb;

alter table public.products drop constraint if exists products_stock_check;
alter table public.products
  add constraint products_stock_check
  check (stock is null or jsonb_typeof(stock) = 'object');

-- The website reads products ONLY through this view.
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
  p.stock
from public.products p
where p.is_visible = true;

alter view public.website_catalogue set (security_invoker = true);
grant select on public.website_catalogue to anon, authenticated;

-- A new order item takes its quantity from the stock.
-- BEFORE INSERT: if there is not enough, the item (and so the whole order) is refused.
create or replace function public.take_stock_for_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid bigint;
  tracked boolean;
  cur int;
begin
  begin
    pid := new.design_id::bigint;
  exception when others then
    return new;
  end;

  select (p.stock is not null),
         case when (p.stock ->> new.size) ~ '^[0-9]+$' then (p.stock ->> new.size)::int else 0 end
    into tracked, cur
    from public.products p
   where p.id = pid
   for update;

  if not found or not tracked then
    return new;  -- unknown product, or its quantity is not counted
  end if;

  if cur < new.qty then
    raise exception 'OUT_OF_STOCK|%|%|%', new.name, new.size, cur using errcode = 'P0001';
  end if;

  update public.products
     set stock = jsonb_set(stock, array[new.size], to_jsonb(cur - new.qty), true)
   where id = pid;
  return new;
end;
$$;

-- Cancelling an order gives the quantity back; re-opening a cancelled order takes it again.
create or replace function public.restock_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  pid bigint;
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    for r in select design_id, size, qty from public.web_order_items where order_id = new.id loop
      begin
        pid := r.design_id::bigint;
      exception when others then
        continue;
      end;
      update public.products
         set stock = jsonb_set(
               stock, array[r.size],
               to_jsonb(coalesce(case when (stock ->> r.size) ~ '^[0-9]+$' then (stock ->> r.size)::int end, 0) + r.qty),
               true)
       where id = pid and stock is not null;
    end loop;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    for r in select design_id, size, qty from public.web_order_items where order_id = new.id loop
      begin
        pid := r.design_id::bigint;
      exception when others then
        continue;
      end;
      update public.products
         set stock = jsonb_set(
               stock, array[r.size],
               to_jsonb(greatest(0, coalesce(case when (stock ->> r.size) ~ '^[0-9]+$' then (stock ->> r.size)::int end, 0) - r.qty)),
               true)
       where id = pid and stock is not null;
    end loop;
  end if;
  return new;
end;
$$;

revoke all on function public.take_stock_for_item() from public, anon, authenticated;
revoke all on function public.restock_on_status_change() from public, anon, authenticated;

drop trigger if exists web_order_items_take_stock on public.web_order_items;
create trigger web_order_items_take_stock
  before insert on public.web_order_items
  for each row execute function public.take_stock_for_item();

drop trigger if exists web_orders_stock_on_status on public.web_orders;
create trigger web_orders_stock_on_status
  after update of status on public.web_orders
  for each row when (old.status is distinct from new.status)
  execute function public.restock_on_status_change();
