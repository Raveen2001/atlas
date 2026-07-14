-- Switch MF day-P&L bookkeeping from cumulative-pnl snapshots to per-fund
-- units snapshots + NAV-table lookup. Fixes correctness on buys/redemptions
-- and market holidays.
--
-- mf_units:      { "<tradingsymbol>": <units>, ... } captured by kite-sync-pnl
--                on each daily write; used the following run to compute that
--                row's mf_day_pnl once the next NAV publishes.
alter table public.investment_logs
  add column if not exists mf_units jsonb;

alter table public.investment_logs
  drop column if exists mf_total_pnl,
  drop column if exists mf_total_value;
