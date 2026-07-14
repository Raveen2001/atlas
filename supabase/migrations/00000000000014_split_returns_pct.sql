-- Split single returns_pct into stock_pct + mf_pct so equity (real-time) and
-- MF (day-lagged, back-filled) can be tracked independently by kite-sync-pnl.
-- mf_total_value snapshot pairs with mf_total_pnl to derive next-day mf_pct.
alter table public.investment_logs
  rename column returns_pct to stock_pct;

alter table public.investment_logs
  add column if not exists mf_pct numeric(6, 3),
  add column if not exists mf_total_value numeric(14, 2);
