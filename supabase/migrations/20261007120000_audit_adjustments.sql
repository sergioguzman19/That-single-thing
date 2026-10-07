-- Ajustes de la auditoría del plan (2026-10-07).
-- 1. "Pudriéndose" pasa a llamarse "rezagada": rot_days → aging_days.
-- 2. El color de un carril solo puede ser uno de los 7 de la identidad.
-- 3. Máximo 6 carriles activos por usuario.
-- 4. Registro de focos (salirse del plan o escoger carril en un bloque abierto),
--    para medir la métrica "te sales del plan menos del 20 % de las veces".

alter table public.profiles rename column rot_days to aging_days;

alter table public.lanes
  add constraint lanes_color_check
  check (color in ('maya', 'patio', 'izamal', 'buganvilia', 'anil', 'flamboyan', 'henequen'));

create function public.enforce_lane_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.archived_at is null and (
    select count(*) from public.lanes
    where user_id = new.user_id and archived_at is null and id <> new.id
  ) >= 6 then
    raise exception 'Máximo 6 carriles activos' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger lanes_limit
  before insert or update of archived_at on public.lanes
  for each row execute function public.enforce_lane_limit();

-- Foco: "override" = salirse del bloque programado; "open" = escoger carril en un bloque abierto.
create table public.focus_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lane_id    uuid not null,
  kind       text not null check (kind in ('override', 'open')),
  created_at timestamptz not null default now(),
  foreign key (lane_id, user_id) references public.lanes (id, user_id) on delete cascade
);
create index focus_events_user_time_idx on public.focus_events (user_id, created_at);

alter table public.focus_events enable row level security;
create policy "focus_events: dueño" on public.focus_events for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.focus_events from anon;
grant select, insert on public.focus_events to authenticated;
