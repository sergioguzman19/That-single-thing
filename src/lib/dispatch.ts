/**
 * Motor de despacho: decide qué carril despacha y cuál es la tarea única.
 * Función pura: recibe la hora, la zona horaria y el estado; no lee nada por su cuenta.
 * Reglas completas en docs/ROADMAP.md.
 */
import { instantAt, localTime, type LocalTime } from "./time";

export type DispatchLane = { id: string };
export type DispatchTask = { id: string; laneId: string };
export type Block = { laneId: string; dayOfWeek: number; startMinute: number; endMinute: number };
export type Focus = { laneId: string; until: Date } | null;

export type DispatchInput = {
  now: Date;
  timeZone: string;
  /** Carriles activos. */
  lanes: DispatchLane[];
  /** Tareas abiertas, ya ordenadas por su cola (la primera de cada carril es su cabeza). */
  tasks: DispatchTask[];
  blocks: Block[];
  focus: Focus;
};

export type DispatchMode =
  | "scheduled" // hay bloque programado y despacha su carril
  | "override" // hay bloque programado pero el usuario escogió otro carril (fuera del plan)
  | "open" // sin bloque programado; el usuario escogió el carril
  | "choose"; // sin bloque programado y sin carril escogido: hay que preguntar

export type Dispatch = {
  mode: DispatchMode;
  local: LocalTime;
  /** Bloque programado activo, si lo hay. */
  block: (Block & { endsAt: Date }) | null;
  /** Carril que despacha (null en "choose"). */
  laneId: string | null;
  /** La tarea única: la cabeza de la cola del carril que despacha. */
  taskId: string | null;
  /** Cuándo termina este período (fin del bloque, fin del foco o próximo cambio). */
  periodEnd: Date;
};

const activeBlock = (blocks: Block[], local: LocalTime) =>
  blocks.find((b) => b.dayOfWeek === local.weekday && b.startMinute <= local.minute && local.minute < b.endMinute) ?? null;

/** Minuto en que empieza el siguiente bloque de hoy, o 1440 (medianoche) si no hay más. */
function nextBoundary(blocks: Block[], local: LocalTime) {
  const starts = blocks.filter((b) => b.dayOfWeek === local.weekday && b.startMinute > local.minute).map((b) => b.startMinute);
  return starts.length ? Math.min(...starts) : 1440;
}

/**
 * Hasta cuándo dura un foco escogido ahora (fuera del plan o en bloque abierto):
 * hasta que termine el bloque actual; si no hay, hasta el siguiente bloque o el fin del día.
 */
export function focusUntil(now: Date, timeZone: string, blocks: Block[]): Date {
  const local = localTime(now, timeZone);
  const block = activeBlock(blocks, local);
  return instantAt(local, block ? block.endMinute : nextBoundary(blocks, local), timeZone);
}

export function dispatch({ now, timeZone, lanes, tasks, blocks, focus }: DispatchInput): Dispatch {
  const local = localTime(now, timeZone);
  const laneIds = new Set(lanes.map((l) => l.id));
  const liveBlocks = blocks.filter((b) => laneIds.has(b.laneId));
  const current = activeBlock(liveBlocks, local);
  const block = current ? { ...current, endsAt: instantAt(local, current.endMinute, timeZone) } : null;
  const validFocus = focus && focus.until > now && laneIds.has(focus.laneId) ? focus : null;
  const head = (laneId: string | null) => (laneId ? (tasks.find((t) => t.laneId === laneId)?.id ?? null) : null);

  if (block) {
    const override = validFocus && validFocus.laneId !== block.laneId;
    const laneId = override ? validFocus.laneId : block.laneId;
    return { mode: override ? "override" : "scheduled", local, block, laneId, taskId: head(laneId), periodEnd: block.endsAt };
  }

  if (validFocus) {
    return { mode: "open", local, block: null, laneId: validFocus.laneId, taskId: head(validFocus.laneId), periodEnd: validFocus.until };
  }

  return {
    mode: "choose",
    local,
    block: null,
    laneId: null,
    taskId: null,
    periodEnd: instantAt(local, nextBoundary(liveBlocks, local), timeZone),
  };
}
