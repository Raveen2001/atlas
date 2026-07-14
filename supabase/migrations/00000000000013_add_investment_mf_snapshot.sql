-- Cumulative MF unrealized P&L snapshot (from Kite getMFHoldings sum of pnl).
-- Used by kite-sync-pnl to derive per-day MF contribution as
--   today.mf_total_pnl - yesterday.mf_total_pnl
-- MF NAVs publish once a day (~9pm IST), so the resulting day P&L reflects the
-- previous publish's movement, not intraday.
alter table investment_logs
  add column if not exists mf_total_pnl numeric(14, 2);
