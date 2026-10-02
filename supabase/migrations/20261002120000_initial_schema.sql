-- That Single Thing: esquema inicial
-- Carriles (frentes de vida) con colas de tareas, bloques semanales que asignan
-- franjas a carriles, y un perfil por usuario con su zona horaria y el foco manual.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Carriles
-- ---------------------------------------------------------------------------
create table public.lanes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  color       text not null,
  position    double precision not null default 0,
  created_at  timestamptz not null default now(),
  archived_at timestamptz,
  unique (id, user_id)
);
create index lanes_user_position_idx on public.lanes (user_id, position) where archived_at is null;

-- ---------------------------------------------------------------------------
-- Tareas: la prioridad es solo el orden (position) dentro del carril.
-- ---------------------------------------------------------------------------
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lane_id      uuid not null,
  title        text not null check (char_length(title) between 1 and 500),
  notes        text not null default '',
  position     double precision not null default 0,
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  completed_at timestamptz,
  -- La tarea solo puede vivir en un carril del mismo usuario.
  foreign key (lane_id, user_id) references public.lanes (id, user_id) on delete cascade
);
create index tasks_queue_idx on public.tasks (lane_id, position) where completed_at is null;
create index tasks_user_age_idx on public.tasks (user_id, created_at) where completed_at is null;

-- ---------------------------------------------------------------------------
-- Bloques: franja semanal (minutos desde medianoche, hora local del usuario) asignada a un carril.
-- ---------------------------------------------------------------------------
create table public.blocks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lane_id      uuid not null,
  day_of_week  smallint not null check (day_of_week between 0 and 6), -- 0 = domingo
  start_minute smallint not null check (start_minute between 0 and 1439),
  end_minute   smallint not null check (end_minute between 1 and 1440),
  created_at   timestamptz not null default now(),
  check (end_minute > start_minute),
  foreign key (lane_id, user_id) references public.lanes (id, user_id) on delete cascade,
  -- Un mismo día no puede tener dos bloques que se crucen.
  exclude using gist (
    user_id with =,
    day_of_week with =,
    int4range(start_minute, end_minute) with &&
  )
);

-- ---------------------------------------------------------------------------
-- Perfil: preferencias y foco manual ("fuera del plan") hasta focus_until.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  timezone      text not null default 'America/Bogota',
  rot_days      smallint not null default 7 check (rot_days between 1 and 90),
  focus_lane_id uuid,
  focus_until   timestamptz,
  created_at    timestamptz not null default now(),
  foreign key (focus_lane_id, id) references public.lanes (id, user_id) on delete set null (focus_lane_id)
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Seguridad: cada usuario solo ve y toca lo suyo.
-- ---------------------------------------------------------------------------
alter table public.lanes    enable row level security;
alter table public.tasks    enable row level security;
alter table public.blocks   enable row level security;
alter table public.profiles enable row level security;

create policy "lanes: dueño" on public.lanes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tasks: dueño" on public.tasks for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "blocks: dueño" on public.blocks for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profiles: leer el propio" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles: editar el propio" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

revoke all on public.lanes, public.tasks, public.blocks, public.profiles from anon;
grant select, insert, update, delete on public.lanes, public.tasks, public.blocks to authenticated;
grant select, update on public.profiles to authenticated;
