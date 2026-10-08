-- Fase 5 · Avisos (Web Push).
-- 1. Dispositivos suscritos. 2. Registro de avisos enviados (no repetir). 3. Rezagadas ya avisadas.
-- 4. Programador cada 2 minutos que SOLO llama a la app cuando hay algo que avisar.

create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
create policy "push_subscriptions: dueño" on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.push_subscriptions from anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- Solo lo escribe el servidor (clave secreta); nadie más lo lee.
create table public.notification_log (
  user_id    uuid not null references auth.users (id) on delete cascade,
  key        text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.notification_log enable row level security;
revoke all on public.notification_log from anon, authenticated;

alter table public.tasks add column aging_notified_at timestamptz;

-- ---------------------------------------------------------------------------
-- Programador
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

/**
 * ¿Hay algo que avisar ahora? Revisa en la base de datos, sin salir a internet:
 * - un bloque terminó en los últimos 4 minutos (hora local de cada usuario), o
 * - hay una tarea que ya es rezagada, no se ha avisado y son entre las 8:00 y las 21:00 locales.
 * Solo si hay algo, llama al endpoint de la app (URL y secreto guardados en Vault, no en el repo).
 */
create function public.notifications_tick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  due boolean;
  url text;
  secret text;
begin
  select exists (
    select 1
    from public.blocks b
    join public.lanes l on l.id = b.lane_id and l.archived_at is null
    join public.profiles p on p.id = b.user_id
    cross join lateral (
      select (now() at time zone p.timezone) as local_now
    ) t
    where (
        b.day_of_week = extract(dow from t.local_now)
        and b.end_minute <= extract(hour from t.local_now) * 60 + extract(minute from t.local_now)
        and b.end_minute > extract(hour from t.local_now) * 60 + extract(minute from t.local_now) - 4
      ) or (
        b.end_minute = 1440
        and b.day_of_week = (extract(dow from t.local_now)::int + 6) % 7
        and extract(hour from t.local_now) * 60 + extract(minute from t.local_now) < 4
      )
  ) or exists (
    select 1
    from public.tasks k
    join public.lanes l on l.id = k.lane_id and l.archived_at is null
    join public.profiles p on p.id = k.user_id
    where k.completed_at is null
      and k.aging_notified_at is null
      and k.created_at <= now() - make_interval(days => p.aging_days)
      and extract(hour from now() at time zone p.timezone) between 8 and 20
  ) into due;

  if not due then
    return;
  end if;

  select decrypted_secret into url from vault.decrypted_secrets where name = 'notifications_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'cron_secret';
  if url is null or secret is null then
    return;
  end if;

  perform net.http_post(
    url := url,
    headers := jsonb_build_object('Authorization', 'Bearer ' || secret, 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
end;
$$;

revoke all on function public.notifications_tick() from public, anon, authenticated;

select cron.schedule('notifications-tick', '*/2 * * * *', $$select public.notifications_tick()$$);
