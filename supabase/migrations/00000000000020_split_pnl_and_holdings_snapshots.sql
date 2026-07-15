-- Split day P&L and realised P&L into stock/MF components, and move the daily
-- holdings snapshots (mf_units, stock_holdings) out of investment_logs into a
-- dedicated kite_holdings_snapshots table.
--
-- investment_logs keeps the combined totals the UI reads (pnl_amount,
-- realised_pnl) and gains explicit breakdown columns:
--   stock_pnl / mf_pnl                 → mark-to-market day P&L per asset class
--   realised_stock_pnl / realised_mf_pnl → booked profit per asset class
-- pnl_amount stays = stock_pnl + mf_pnl (mf added when the NAV backfill runs),
-- realised_pnl stays = realised_stock_pnl + realised_mf_pnl.

-- ── New snapshots table ──────────────────────────────────────
-- One row per user per day. Written by kite-sync-pnl and read the following
-- run(s) for MF NAV backfill and realised-sell cost-basis fallback.
--   mf_units:       { "<isin>": { units, avg_price } }
--   stock_holdings: { "<tradingsymbol>": { qty, avg_price } }
create table if not exists public.kite_holdings_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  mf_units jsonb,
  stock_holdings jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, snapshot_date)
);

create index if not exists kite_holdings_snapshots_user_date_idx
  on public.kite_holdings_snapshots (user_id, snapshot_date desc);

alter table public.kite_holdings_snapshots enable row level security;

-- Writes go through the service role in kite-sync-pnl; users only read.
create policy "Users can view own holdings snapshots" on public.kite_holdings_snapshots
  for select using (auth.uid() = user_id);

create trigger on_kite_holdings_snapshots_updated before update on public.kite_holdings_snapshots
  for each row execute function public.handle_updated_at();

-- ── Migrate existing snapshots out of investment_logs ────────
insert into public.kite_holdings_snapshots (user_id, snapshot_date, mf_units, stock_holdings)
select user_id, logged_date, mf_units, stock_holdings
from public.investment_logs
where mf_units is not null or stock_holdings is not null
on conflict (user_id, snapshot_date) do nothing;

-- ── Breakdown columns on investment_logs ─────────────────────
alter table public.investment_logs
  add column if not exists stock_pnl numeric(12, 2),
  add column if not exists mf_pnl numeric(12, 2),
  add column if not exists realised_stock_pnl numeric(12, 2),
  add column if not exists realised_mf_pnl numeric(12, 2);

-- Backfill the realised split exactly from the per-trade history.
update public.investment_logs il set
  realised_stock_pnl = agg.stock_total,
  realised_mf_pnl = agg.mf_total
from (
  select user_id, trade_date,
    coalesce(sum(realised_pnl) filter (where kind = 'stock'), 0) as stock_total,
    coalesce(sum(realised_pnl) filter (where kind = 'mf'), 0) as mf_total
  from public.kite_realised_trades
  group by user_id, trade_date
) agg
where il.user_id = agg.user_id and il.logged_date = agg.trade_date;

-- ── Drop the moved snapshot columns ──────────────────────────
alter table public.investment_logs
  drop column if exists mf_units,
  drop column if exists stock_holdings;
