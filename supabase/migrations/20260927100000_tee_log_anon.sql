-- ══════════════════════════════════════════════════════════════════
--  tee_log: anonym gar nicht erst abfragbar
--
--  Die Leseregel gilt nur fuer angemeldete Nutzer; anonym kam bisher
--  eine leere Liste zurueck, weil Supabase neuen Tabellen den Lesezugriff
--  fuer anon mitgibt und erst die Zeilenregel filtert. Wie bei tee soll
--  anon die Tabelle gar nicht abfragen duerfen.
--
--  Dazu prueft sich hier nach, was am 27.09.2026 nicht sicher zu sehen
--  war: dass tee_senden() wirklich ins Protokoll schreibt.
-- ══════════════════════════════════════════════════════════════════

revoke all on public.tee_log from anon;
revoke all on sequence public.tee_log_id_seq from anon, authenticated;
grant select on public.tee_log to authenticated;

do $$
begin
  if position('tee_log' in pg_get_functiondef('public.tee_senden(uuid)'::regprocedure)) = 0 then
    raise exception 'tee_senden schreibt nicht ins Protokoll';
  end if;
  if has_table_privilege('anon', 'public.tee_log', 'select') then
    raise exception 'anon darf tee_log noch lesen';
  end if;
  if has_table_privilege('authenticated', 'public.tee_log', 'insert') then
    raise exception 'authenticated darf in tee_log schreiben';
  end if;
end $$;
