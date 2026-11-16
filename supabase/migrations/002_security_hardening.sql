-- 002_security_hardening.sql
-- ALREADY APPLIED to the Website project (wmsyollcbgqfvaslivjx).
-- Kept here as a record.

-- Products have no secret columns (no cost), so visitors may read visible ones directly.
create policy "public read visible products" on public.products
  for select to anon, authenticated using (is_visible);

alter view public.website_catalogue set (security_invoker = true);

-- Trending: show only the ranking, not the real sales numbers.
-- (Kept as a definer view on purpose: visitors cannot read order tables.)
drop view if exists public.website_trending;
create view public.website_trending as
select i.slug, (row_number() over (order by sum(i.qty) desc))::int as rank
from public.web_order_items i
join public.web_orders o on o.id = i.order_id
where o.created_at >= now() - interval '14 days'
  and o.status <> 'cancelled'
group by i.slug;
grant select on public.website_trending to anon, authenticated;

-- is_admin(): only signed-in users need it (used inside the admin rules).
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
