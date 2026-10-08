/**
 * Lógica pura de la semana: franjas, cruces entre bloques, huecos (bloques abiertos) y balance.
 * Los minutos son desde la medianoche local del perfil (0–1440).
 */

export type WeekBlock = { id: string; laneId: string; dayOfWeek: number; startMinute: number; endMinute: number };

export const STEP = 15;

/** Franjas rápidas que llenan las horas de un bloque nuevo. */
export const PRESETS = [
  { id: "manana", name: "Mañana", start: 8 * 60, end: 12 * 60 },
  { id: "tarde", name: "Tarde", start: 13 * 60, end: 17 * 60 },
  { id: "noche", name: "Noche", start: 18 * 60, end: 21 * 60 },
] as const;

/** Lunes primero, como se lee una semana de trabajo. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;
export const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;
export const DAY_LETTER = ["D", "L", "M", "M", "J", "V", "S"] as const;

export const formatMinute = (minute: number) => `${Math.floor(minute / 60)}:${String(minute % 60).padStart(2, "0")}`;

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m}` : `${h} h`;
}

/** Opciones de hora en pasos de 15 minutos, de 0:00 a 24:00. */
export const TIME_OPTIONS = Array.from({ length: 1440 / STEP + 1 }, (_, i) => i * STEP);

export type BlockDraft = { laneId: string; startMinute: number; endMinute: number; days: number[] };

/** Error de validación de un bloque, o null si está bien. */
export function validateDraft(draft: BlockDraft): string | null {
  if (!draft.laneId) return "Escoge un carril.";
  if (!draft.days.length) return "Escoge al menos un día.";
  const { startMinute: s, endMinute: e } = draft;
  if (s % STEP || e % STEP || s < 0 || e > 1440) return "Las horas van en pasos de 15 minutos.";
  if (e <= s) return "El bloque tiene que terminar después de empezar.";
  return null;
}

/** Primer bloque existente que se cruza con el borrador en alguno de sus días (ignorando `exceptId`). */
export function findOverlap(blocks: WeekBlock[], draft: BlockDraft, exceptId?: string): WeekBlock | null {
  return (
    blocks.find(
      (b) =>
        b.id !== exceptId &&
        draft.days.includes(b.dayOfWeek) &&
        b.startMinute < draft.endMinute &&
        draft.startMinute < b.endMinute,
    ) ?? null
  );
}

export type DayItem =
  | { kind: "block"; block: WeekBlock }
  | { kind: "open"; startMinute: number; endMinute: number };

/** Los bloques de un día en orden, con los huecos entre ellos como bloques abiertos. */
export function dayTimeline(blocks: WeekBlock[], dayOfWeek: number): DayItem[] {
  const day = blocks.filter((b) => b.dayOfWeek === dayOfWeek).sort((a, b) => a.startMinute - b.startMinute);
  const items: DayItem[] = [];
  day.forEach((block, i) => {
    const prev = day[i - 1];
    if (prev && block.startMinute > prev.endMinute) {
      items.push({ kind: "open", startMinute: prev.endMinute, endMinute: block.startMinute });
    }
    items.push({ kind: "block", block });
  });
  return items;
}

/** Horas de foco a la semana por carril. */
export function hoursByLane(blocks: WeekBlock[]): Map<string, number> {
  const hours = new Map<string, number>();
  for (const b of blocks) hours.set(b.laneId, (hours.get(b.laneId) ?? 0) + (b.endMinute - b.startMinute) / 60);
  return hours;
}

/** El siguiente bloque de hoy que empieza después de `minute`. */
export function nextBlockToday<T extends Pick<WeekBlock, "dayOfWeek" | "startMinute">>(blocks: T[], dayOfWeek: number, minute: number): T | null {
  return (
    blocks
      .filter((b) => b.dayOfWeek === dayOfWeek && b.startMinute > minute)
      .sort((a, b) => a.startMinute - b.startMinute)[0] ?? null
  );
}
