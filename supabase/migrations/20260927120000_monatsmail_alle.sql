-- ══════════════════════════════════════════════════════════════════
--  Monats-Erinnerung: fuer alle an, und so, dass wirklich jede ankommt
--
--  1. Zustimmung. Auf Marcos Wunsch vom 27.09.2026 bekommen alle
--     bestehenden Profile die Erinnerung (vorher: 10 ja, 8 nein,
--     3 nie gefragt). Die Antworten von vorher bleiben in
--     mail_zustimmung_vorher liegen — wer es rueckgaengig machen will,
--     hat sie dort. Abschalten kann jeder weiter im Profilmenue.
--
--  2. Alte App-Fassungen. Das Profil wandert als ganzes JSON in
--     records.data; eine App, die den Stand von vorher im Speicher
--     hielt, wuerde beim naechsten Speichern mailOk = false
--     zurueckschreiben. Neue Fassungen schreiben bei jeder eigenen Wahl
--     mailStand mit. Fehlt mailStand im neuen Wert, stand er aber im
--     alten, behaelt ein Ausloeser Zustimmung und Stand von vorher.
--
--  3. Versand. Am 01.09.2026 gingen nur 4 von 10 Mails hinaus, alle in
--     einer Sekunde: Resend nimmt im freien Zugang 2 Anfragen pro Sekunde
--     an, und pg_net wartet ohne Angabe nur 5 Sekunden auf die Funktion.
--     Die Funktion wartet jetzt selbst zwischen den Mails (monatsmail.ts);
--     hier bekommt der Aufruf 2 Minuten, und am Ersten laeuft er dreimal —
--     05:10, 06:10 und 08:10 UTC. mail_log verhindert doppelte Mails,
--     die spaeteren Laeufe holen nur nach, was fehlt.
-- ══════════════════════════════════════════════════════════════════

-- ─── 1 · Sichern, dann einschalten ────────────────────────────────
create table if not exists public.mail_zustimmung_vorher (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  mail_ok      boolean,
  mail_gefragt boolean,
  gesichert    timestamptz not null default now()
);
alter table public.mail_zustimmung_vorher enable row level security;
revoke all on public.mail_zustimmung_vorher from anon, authenticated;

insert into public.mail_zustimmung_vorher (user_id, mail_ok, mail_gefragt)
  select user_id,
         (data->>'mailOk')::boolean,
         (data->>'mailGefragt')::boolean
  from public.records
  on conflict (user_id) do nothing;

update public.records
   set data = data || '{"mailOk": true, "mailGefragt": true, "mailStand": 2}'::jsonb
 where not (data ? 'mailStand');


-- ─── 2 · Alte App-Fassungen schreiben die Zustimmung nicht zurueck ─
create or replace function public.records_zustimmung_halten()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (old.data ? 'mailStand') and not (new.data ? 'mailStand') then
    new.data := new.data || jsonb_build_object(
      'mailOk',      old.data->'mailOk',
      'mailGefragt', old.data->'mailGefragt',
      'mailStand',   old.data->'mailStand');
  end if;
  return new;
end;
$$;

drop trigger if exists records_zustimmung_halten on public.records;
create trigger records_zustimmung_halten
  before update on public.records
  for each row execute function public.records_zustimmung_halten();


-- ─── 3 · Zeitplan: mehr Geduld, drei Laeufe ───────────────────────
select cron.alter_job(
  j.jobid,
  schedule := '10 5,6,8 1 * *',
  command  := replace(j.command,
                'body    := ''{}''::jsonb',
                'body    := ''{}''::jsonb,
    timeout_milliseconds := 120000'))
from cron.job j
where j.jobname = 'moji-monatsmail'
  and position('timeout_milliseconds' in j.command) = 0;


-- ─── Selbstpruefung ───────────────────────────────────────────────
do $$
declare
  probe   uuid;
  ok_alt  boolean;
  ok_neu  boolean;
begin
  if exists (select 1 from public.records where (data->>'mailOk')::boolean is not true) then
    raise exception 'nicht alle Profile haben die Erinnerung an';
  end if;
  if (select count(*) from public.mail_zustimmung_vorher)
     < (select count(*) from public.records) then
    raise exception 'nicht alle Antworten von vorher sind gesichert';
  end if;
  if not exists (select 1 from cron.job where jobname = 'moji-monatsmail'
                 and schedule = '10 5,6,8 1 * *'
                 and position('timeout_milliseconds := 120000' in command) > 0) then
    raise exception 'Zeitplan nicht umgestellt';
  end if;

  select user_id into probe from public.records limit 1;
  if probe is not null then
    -- a) Eine alte Fassung schreibt ohne mailStand und mit Nein: bleibt ja.
    update public.records set data = (data - 'mailStand') || '{"mailOk": false}'::jsonb
      where user_id = probe;
    select (data->>'mailOk')::boolean into ok_alt from public.records where user_id = probe;
    if ok_alt is not true or not (select data ? 'mailStand' from public.records where user_id = probe) then
      raise exception 'alte Fassung haette die Zustimmung ueberschrieben';
    end if;
    -- b) Eine neue Fassung waehlt selbst ab: das gilt. Danach zurueck.
    begin
      update public.records set data = data || '{"mailOk": false, "mailStand": 2}'::jsonb
        where user_id = probe;
      select (data->>'mailOk')::boolean into ok_neu from public.records where user_id = probe;
      raise exception using errcode = 'P0100', message = 'probe zurueck';
    exception when sqlstate 'P0100' then
      null;
    end;
    if ok_neu is not false then
      raise exception 'eine eigene Wahl wuerde nicht gelten';
    end if;
    if (select (data->>'mailOk')::boolean from public.records where user_id = probe) is not true then
      raise exception 'Probe nicht zurueckgerollt';
    end if;
  end if;
end $$;
