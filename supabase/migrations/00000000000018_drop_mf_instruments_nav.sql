-- Cleanup: drop the mf_instruments_nav table left over from migration 15.
-- We abandoned the Kite MF instruments cache in favor of MFAPI + mf_scheme_map.
drop table if exists public.mf_instruments_nav;
