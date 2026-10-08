-- Fase 3 · Ahora.
-- Última tarea que fue "that single thing" y cuándo terminaba su período. Al abrir la app,
-- si ese período ya pasó y la tarea quedó empezada sin terminar, se pregunta "¿Terminaste X?".

alter table public.profiles
  add column last_task_id uuid references public.tasks (id) on delete set null,
  add column last_period_end timestamptz;

-- Para contar las hechas de hoy.
create index tasks_completed_idx on public.tasks (user_id, completed_at) where completed_at is not null;
