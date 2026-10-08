-- Una sola cosa: solo puede haber UNA tarea en curso por usuario.
-- Primero deja en curso solo la empezada más recientemente de cada usuario.
update public.tasks t
set started_at = null
where t.started_at is not null
  and t.completed_at is null
  and exists (
    select 1 from public.tasks other
    where other.user_id = t.user_id
      and other.started_at is not null
      and other.completed_at is null
      and (other.started_at, other.id) > (t.started_at, t.id)
  );

create unique index tasks_one_in_progress_idx
  on public.tasks (user_id)
  where started_at is not null and completed_at is null;
