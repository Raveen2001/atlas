-- Realised P&L tracking: profit actually booked when a stock holding is sold
-- (CNC) or MF units are redeemed, measured against average buy cost. Written
-- by kite-sync-pnl; day P&L (pnl_amount) stays pure mark-to-market.

-- Per-trade history. order_id is the Kite order id for both kinds and
-- doubles as the idempotency key: stock sells come from the day's completed
-- CNC SELL orders (upserted on same-day reruns); MF redemptions complete
-- days after placement and each order is recorded exactly once.
create table if not exists public.kite_realised_trades (
  order_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('stock', 'mf')),
  symbol text not null, -- tradingsymbol (stocks) / ISIN (MF)
  name text,            -- scheme name for MF
  quantity numeric(14, 4) not null,
  avg_buy_price numeric(14, 4) not null,
  sell_price numeric(14, 4) not null, -- execution NAV for MF
  realised_pnl numeric(12, 2) not null,
  trade_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists kite_realised_trades_user_date_idx
  on public.kite_realised_trades (user_id, trade_date desc);

alter table public.kite_realised_trades enable row level security;

-- Writes go through the service role in kite-sync-pnl; users only read.
create policy "Users can view own realised trades" on public.kite_realised_trades
  for select using (auth.uid() = user_id);

-- realised_pnl:   day's total booked profit (sum of that day's rows in
--                 kite_realised_trades); null when nothing was sold
-- stock_holdings: daily snapshot { "<tradingsymbol>": { qty, avg_price } }
--                 so cost basis survives a full same-day sell (the scrip may
--                 no longer appear in the holdings API response)
alter table public.investment_logs
  add column if not exists realised_pnl numeric(12, 2),
  add column if not exists stock_holdings jsonb;
