-- Rupee benchmark: what the same capital would have earned in Nifty 50.
-- Base values are the previous-day (start of day) value of each sleeve, so
-- nifty_pnl = nifty50_pct% x (stock_base_value + mf_base_value).
alter table public.investment_logs
  add column stock_base_value numeric(14,2),
  add column mf_base_value numeric(14,2),
  add column nifty_pnl numeric(14,2);
