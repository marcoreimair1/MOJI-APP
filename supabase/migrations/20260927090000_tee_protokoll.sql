-- ══════════════════════════════════════════════════════════════════
--  Jeder Becher mit Datum
--
--  Die Tabelle tee zaehlt je Paar nur eine Summe und merkt sich das
--  letzte Datum jeder Seite. Fuer den Jahresrueckblick reicht das nicht:
--  "mit wem hast du dieses Jahr die meisten Bubble Teas getauscht" und
--  "wie viele Kolleg:innen hast du beschenkt" brauchen jeden einzelnen
--  Becher mit seinem Tag.
--
--  tee_log haelt genau das fest: wer, an wen, an welchem Tag (Wiener
--  Zeit). Geschrieben wird ausschliesslich in tee_senden(), und nur dann,
--  wenn der Becher wirklich gezaehlt wurde — also nicht, wenn die
--  Tages- oder die Wechselregel greift.
--
--  Lesen darf man nur Zeilen, an denen man selbst beteiligt ist. Mit
--  dem Konto verschwinden auch seine Zeilen (on delete cascade).
--
--  Bubble Tea gibt es seit dem 15.09.2026, das Protokoll ab heute. Fuer
--  2026 nimmt die App deshalb die Summe je Paar; ab 2027 zaehlt das
--  Protokoll allein (TEE_LOG_AB in index.html).
-- ══════════════════════════════════════════════════════════════════

create table if not exists public.tee_log (
  id    bigserial primary key,
  von   uuid not null references auth.users(id) on delete cascade,
  an    uuid not null references auth.users(id) on delete cascade,
  am    date not null default ((now() at time zone 'Europe/Vienna')::date),
  zeit  timestamptz not null default now()
);

create index if not exists tee_log_von_am on public.tee_log (von, am);
create index if not exists tee_log_an_am  on public.tee_log (an, am);

alter table public.tee_log enable row level security;

drop policy if exists tee_log_lesen on public.tee_log;
create policy tee_log_lesen on public.tee_log
  for select to authenticated
  using (von = auth.uid() or an = auth.uid());

revoke insert, update, delete on public.tee_log from anon, authenticated;

-- Dieselbe Funktion wie seit dem Wechselspiel (20260921060000), mit
-- einer Zeile mehr: ist der Becher gezaehlt, landet er im Protokoll.
create or replace function public.tee_senden(an uuid)
returns table (punkte integer, level integer, schon_heute boolean, wartet boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  ich    uuid := auth.uid();
  klein  uuid;
  gross  uuid;
  heute  date := (now() at time zone 'Europe/Vienna')::date;
  z      public.tee%rowtype;
  war    boolean := false;
  dran   boolean := false;   -- true = die andere Seite ist am Zug
  meins  date;
  seins  date;
begin
  if ich is null then
    raise exception 'nicht angemeldet';
  end if;
  if an is null or an = ich then
    raise exception 'kein gueltiger Empfaenger';
  end if;

  -- Nur innerhalb derselben Firma.
  if not exists (
    select 1 from public.mitglieder m1, public.mitglieder m2
    where m1.user_id = ich and m2.user_id = an and m1.firma = m2.firma
  ) then
    raise exception 'nicht dieselbe Firma';
  end if;

  klein := least(ich, an);
  gross := greatest(ich, an);

  insert into public.tee (a, b) values (klein, gross)
    on conflict (a, b) do nothing;

  select * into z from public.tee t where t.a = klein and t.b = gross for update;

  if ich = klein then
    meins := z.letzt_a; seins := z.letzt_b;
  else
    meins := z.letzt_b; seins := z.letzt_a;
  end if;

  -- Habe ich heute schon? Dann bleibt alles, wie es ist.
  war := (meins is not null and meins >= heute);

  -- Bin ich zuletzt drangewesen und die andere Seite seither nicht?
  dran := (meins is not null and (seins is null or seins < meins));

  if not war and not dran then
    if ich = klein then
      update public.tee t set punkte = t.punkte + 1, letzt_a = heute
        where t.a = klein and t.b = gross returning * into z;
    else
      update public.tee t set punkte = t.punkte + 1, letzt_b = heute
        where t.a = klein and t.b = gross returning * into z;
    end if;
    insert into public.tee_log (von, an, am) values (ich, an, heute);
  end if;

  return query select
    z.punkte,
    public.tee_level(z.punkte),
    war,
    dran;
end;
$$;

revoke all on function public.tee_senden(uuid) from public;
revoke all on function public.tee_senden(uuid) from anon;
grant execute on function public.tee_senden(uuid) to authenticated;

-- Selbstpruefung: Tabelle, Leseregel und der Eintrag in der Funktion.
do $$
begin
  if to_regclass('public.tee_log') is null then
    raise exception 'tee_log fehlt';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'tee_log' and policyname = 'tee_log_lesen') then
    raise exception 'tee_log hat keine Leseregel';
  end if;
  if position('tee_log' in pg_get_functiondef('public.tee_senden(uuid)'::regprocedure)) = 0 then
    raise exception 'tee_senden schreibt nicht ins Protokoll';
  end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'tee_senden' and 'wartet' = any(p.proargnames)
  ) then
    raise exception 'tee_senden gibt kein wartet zurueck';
  end if;
end $$;
