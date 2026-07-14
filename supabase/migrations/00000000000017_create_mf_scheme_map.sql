-- ISIN ↔ AMFI scheme_code map. Populated from AMFI's NAVAll.txt by the
-- mf-scheme-map-sync edge function; consumed by kite-sync-pnl to translate
-- Kite's tradingsymbol (ISIN) into a scheme_code for MFAPI lookups.
create table if not exists public.mf_scheme_map (
  isin text primary key,
  scheme_code text not null,
  scheme_name text,
  isin_type text, -- 'growth_or_payout' | 'div_reinvest'
  updated_at timestamptz not null default now()
);

create index if not exists mf_scheme_map_scheme_code_idx
  on public.mf_scheme_map (scheme_code);
