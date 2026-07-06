-- Add optional daily returns % fields for personal vs Nifty 50 comparison
alter table public.investment_logs
  add column returns_pct numeric(6,3),
  add column nifty50_pct numeric(6,3);
