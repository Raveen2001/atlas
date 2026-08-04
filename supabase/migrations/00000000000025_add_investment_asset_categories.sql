-- Add offline-investment categories (land, gold, silver) to assets
alter table public.assets drop constraint assets_category_check;

alter table public.assets add constraint assets_category_check
  check (category in ('land', 'gold', 'silver', 'jewellery', 'electronics', 'appliance', 'furniture', 'vehicle', 'fitness', 'kitchen', 'other'));
