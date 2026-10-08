/**
 * Qué avisos tocan ahora para un usuario. Función pura: el endpoint del programador
 * (src/app/api/notifications/tick) le pasa los datos y envía lo que devuelve.
 *
 * Avisos (los de mayor retorno, decididos con Sergio):
 * 1. Terminó un bloque y su tarea sigue abierta → "¿Terminaste X?".
 * 2. Empieza un bloque abierto entre dos bloques → escoger qué carril despacha.
 * 3. Una tarea se volvió rezagada → una sola vez por tarea, en horas razonables.
 */
import { localTime } from "./time";
import { formatMinute } from "./week";

export type NotifyBlock = { id: string; laneId: string; dayOfWeek: number; startMinute: number; endMinute: number };
export type NotifyTask = {
  id: string;
  laneId: string;
  title: string;
  startedAt: string | null;
  createdAt: string;
  agingNotifiedAt: string | null;
};

export type NotifyInput = {
  now: Date;
  timeZone: string;
  agingDays: number;
  lanes: { id: string; name: string }[];
  blocks: NotifyBlock[];
  /** Tareas abiertas en el orden de sus colas. */
  tasks: NotifyTask[];
  /** La última tarea única que vio el usuario (profiles.last_task_id). */
  lastTaskId: string | null;
  /** Cuántos minutos hacia atrás revisar: el programador corre cada 2 min; se deja margen. */
  windowMinutes?: number;
};

export type Notification = {
  /** Clave única para no enviar el mismo aviso dos veces (notification_log). */
  key: string;
  title: string;
  body: string;
  /** Si trae taskId, en Android aparecen los botones "Sí, la terminé" / "No". */
  taskId?: string;
  url: string;
};

const DAY = 86_400_000;
/** Los avisos de rezagadas solo salen de 8:00 a 20:59, hora local. */
export const AGING_HOURS = { from: 8 * 60, to: 21 * 60 };

export function planNotifications(input: NotifyInput): { notifications: Notification[]; agingTaskIds: string[] } {
  const { now, timeZone, lanes, blocks, tasks, lastTaskId } = input;
  const window = input.windowMinutes ?? 4;
  const local = localTime(now, timeZone);
  const dateKey = `${local.year}-${local.month}-${local.day}`;
  const laneName = new Map(lanes.map((l) => [l.id, l.name]));
  const live = blocks.filter((b) => laneName.has(b.laneId));
  const notifications: Notification[] = [];

  // Bloques que terminaron en la ventana. Un bloque que termina a medianoche (1440)
  // se revisa en los primeros minutos del día siguiente.
  const yesterday = (local.weekday + 6) % 7;
  const ended = live.filter(
    (b) =>
      (b.dayOfWeek === local.weekday && b.endMinute <= local.minute && b.endMinute > local.minute - window) ||
      (b.endMinute === 1440 && b.dayOfWeek === yesterday && local.minute < window),
  );

  for (const block of ended) {
    const lane = laneName.get(block.laneId)!;
    const sameDay = block.dayOfWeek === local.weekday;
    // La tarea que quedó abierta: la que está en curso, o la tarea única del bloque si sigue sin terminar.
    const open =
      tasks.find((t) => t.startedAt) ??
      (lastTaskId ? tasks.find((t) => t.id === lastTaskId && t.laneId === block.laneId) : undefined) ??
      null;
    // Bloque abierto: el hueco entre este bloque y el siguiente de hoy.
    const startsNow = sameDay && live.some((b) => b.dayOfWeek === local.weekday && b.startMinute === block.endMinute);
    const later = sameDay
      ? live.filter((b) => b.dayOfWeek === local.weekday && b.startMinute > block.endMinute).sort((a, b) => a.startMinute - b.startMinute)[0]
      : undefined;
    const openGap = !startsNow && later ? `Empieza un bloque abierto hasta las ${formatMinute(later.startMinute)}: escoge qué carril despacha.` : null;

    if (open) {
      notifications.push({
        key: `end:${block.id}:${dateKey}`,
        title: `Terminó el bloque de ${lane}`,
        body: [`¿Terminaste «${open.title}»?`, openGap].filter(Boolean).join(" "),
        taskId: open.id,
        url: "/",
      });
    } else if (openGap) {
      notifications.push({
        key: `open:${block.id}:${dateKey}`,
        title: "Bloque abierto",
        body: `Terminó ${lane}. ${openGap}`,
        url: "/",
      });
    }
  }

  // Rezagadas: una sola vez por tarea, agrupadas en un aviso, solo en horas razonables.
  const agingTaskIds: string[] = [];
  if (local.minute >= AGING_HOURS.from && local.minute < AGING_HOURS.to) {
    const aging = tasks.filter(
      (t) => !t.agingNotifiedAt && laneName.has(t.laneId) && now.getTime() - new Date(t.createdAt).getTime() >= input.agingDays * DAY,
    );
    if (aging.length) {
      agingTaskIds.push(...aging.map((t) => t.id));
      const first = aging[0];
      notifications.push({
        key: `aging:${aging.map((t) => t.id).sort().join(",")}`,
        title: aging.length === 1 ? "Una tarea se volvió rezagada" : `${aging.length} tareas se volvieron rezagadas`,
        body:
          aging.length === 1
            ? `«${first.title}» lleva ${input.agingDays} días o más en ${laneName.get(first.laneId)}.`
            : `«${first.title}» en ${laneName.get(first.laneId)} y ${aging.length - 1} más llevan ${input.agingDays} días o más en cola.`,
        url: `/carriles/${first.laneId}`,
      });
    }
  }

  return { notifications, agingTaskIds };
}
