-- ══════════════════════════════════════════════════════════════════
--  „Zuletzt online" wieder richtig
--
--  Befund vom 27.09.2026, von Marco gemeldet: in der Firmenansicht
--  waren alle kurz zuvor online. Ursache war die Migration
--  20260927120000_monatsmail_alle.sql. Sie hat in allen Profilen die
--  Erinnerung eingeschaltet und dabei jede Zeile in records geaendert —
--  und der Ausloeser records_mitglied setzt bei JEDER Aenderung
--  mitglieder.zuletzt auf now(). 20 von 21 standen danach auf
--  2026-09-27 14:32:28 UTC (der eine andere war seither wirklich da).
--
--  1. Zurueck: fuer genau diese Zeilen der juengste echte Hinweis von
--     vorher — letztes Speichern (records.updated_at, von der Migration
--     nicht beruehrt), letzte Aktivitaet der Anmeldesitzung
--     (auth.sessions) oder letzte Anmeldung. Die App schreibt zuletzt
--     beim Oeffnen (moji_gesehen) — dabei laeuft fast immer auch die
--     Sitzung, der Wert liegt also hoechstens knapp daneben.
--  2. Ursache: der Ausloeser setzt zuletzt nur noch, wenn die Person
--     selbst speichert (auth.uid() = user_id). Aenderungen aus einer
--     Migration oder vom Dienst lassen es stehen.
-- ══════════════════════════════════════════════════════════════════

-- ─── 1 · Zurueck auf die Zeit von vorher ──────────────────────────
with mig as (
  select min(gesichert) as t from public.mail_zustimmung_vorher
),
sitzung as (
  select user_id, max(greatest(coalesce(refreshed_at, updated_at), updated_at)) as z
  from auth.sessions group by user_id
),
neu as (
  select m.user_id, greatest(r.updated_at, s.z, u.last_sign_in_at) as z
  from public.mitglieder m
  left join public.records r on r.user_id = m.user_id
  left join sitzung s        on s.user_id = m.user_id
  left join auth.users u     on u.id = m.user_id
  where m.zuletzt = (select t from mig)
)
update public.mitglieder m
   set zuletzt = neu.z
  from neu
 where m.user_id = neu.user_id
   and neu.z is not null
   and neu.z < (select t from mig);


-- ─── 2 · Nur wer selbst speichert, war online ─────────────────────
create or replace function public.mitglied_nachziehen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d  jsonb;
  vn text;
  av smallint;
begin
  begin
    d  := new.data::jsonb;
    vn := btrim(coalesce(d->>'vorname', ''));
    -- Ohne Namen kein Eintrag: wer den Funnel nie beendet hat, gehoert
    -- nicht in eine Namensliste.
    if vn = '' then
      return new;
    end if;

    -- Fehlt die Nummer, bleibt sie NULL — und unten stehen lassen statt
    -- ueberschreiben.
    av := nullif(d->>'avatar', '')::smallint;

    insert into public.mitglieder (user_id, vorname, kuerzel, avatar, filiale, stufe, zuletzt)
    values (
      new.user_id,
      vn,
      upper(left(btrim(coalesce(d->>'nachname', '')), 1)),
      coalesce(av, 1),              -- eine neue Zeile braucht irgendeinen Wert
      btrim(coalesce(d->>'filiale', '')),
      public.moji_stufe(d),
      now()
    )
    on conflict (user_id) do update set
      vorname = excluded.vorname,
      kuerzel = excluded.kuerzel,
      avatar  = coalesce(av, public.mitglieder.avatar),
      filiale = excluded.filiale,
      stufe   = excluded.stufe,
      -- Seit 27.09.2026: nur wenn die Person selbst speichert. Eine
      -- Migration oder der Dienst ist niemand, der online war.
      zuletzt = case when auth.uid() = new.user_id
                     then greatest(public.mitglieder.zuletzt, excluded.zuletzt)
                     else public.mitglieder.zuletzt end;
  exception when others then
    -- Der Ausloeser darf das Sichern der Arbeitszeit niemals blockieren.
    raise warning 'mitglied_nachziehen: %', sqlerrm;
  end;
  return new;
end;
$$;


-- ─── Selbstpruefung ───────────────────────────────────────────────
do $$
declare
  t      timestamptz := (select min(gesichert) from public.mail_zustimmung_vorher);
  probe  uuid;
  vorher timestamptz;
  ohne   timestamptz;
  selbst timestamptz;
begin
  if exists (select 1 from public.mitglieder where zuletzt = t) then
    raise exception 'noch % Zeilen auf dem Zeitpunkt der Migration',
      (select count(*) from public.mitglieder where zuletzt = t);
  end if;

  select m.user_id, m.zuletzt into probe, vorher
    from public.mitglieder m join public.records r on r.user_id = m.user_id
   where btrim(coalesce(r.data->>'vorname', '')) <> ''
   limit 1;
  if probe is null then return; end if;

  -- a) Aenderung ohne angemeldete Person (Migration, Dienst): bleibt.
  begin
    update public.records set data = data where user_id = probe;
    select zuletzt into ohne from public.mitglieder where user_id = probe;
    raise exception using errcode = 'P0101', message = 'probe zurueck';
  exception when sqlstate 'P0101' then null;
  end;
  if ohne is distinct from vorher then
    raise exception 'eine Aenderung ohne Person hat zuletzt verschoben';
  end if;

  -- b) Die Person speichert selbst: jetzt.
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', probe, 'role', 'authenticated')::text, true);
    update public.records set data = data where user_id = probe;
    select zuletzt into selbst from public.mitglieder where user_id = probe;
    raise exception using errcode = 'P0102', message = 'probe zurueck';
  exception when sqlstate 'P0102' then null;
  end;
  perform set_config('request.jwt.claims', '', true);
  if selbst is null or selbst <= vorher then
    raise exception 'eigenes Speichern setzt zuletzt nicht mehr';
  end if;
  if (select zuletzt from public.mitglieder where user_id = probe) is distinct from vorher then
    raise exception 'Probe nicht zurueckgerollt';
  end if;
end $$;
