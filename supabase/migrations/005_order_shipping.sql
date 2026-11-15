-- APPLIED to the Website project (wmsyollcbgqfvaslivjx). Kept as a record.
-- Flat delivery charge per order, added by the create-web-order function.
-- Undo (only if needed): alter table public.web_orders drop column shipping;
alter table public.web_orders
  add column if not exists shipping numeric not null default 0;
