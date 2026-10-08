/**
 * Hora local en una zona horaria, sin depender de la zona del servidor ni del navegador.
 * Todo "ahora" del producto pasa por aquí (ver ROADMAP: nunca calcular la hora local del servidor).
 */

export type LocalTime = {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 = domingo
  minute: number; // minutos desde medianoche, 0-1439
};

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export function localTime(instant: Date, timeZone: string): LocalTime {
  const parts = Object.fromEntries(formatter(timeZone).formatToParts(instant).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: WEEKDAYS[parts.weekday],
    minute: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Diferencia (ms) entre la hora local de la zona y UTC en ese instante. */
function offsetMs(instant: Date, timeZone: string) {
  const parts = Object.fromEntries(formatter(timeZone).formatToParts(instant).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** El instante en que, en esa zona, el día `local` marca `minute` (puede ser 1440 = medianoche siguiente). */
export function instantAt(local: Pick<LocalTime, "year" | "month" | "day">, minute: number, timeZone: string): Date {
  const guess = Date.UTC(local.year, local.month - 1, local.day, 0, minute);
  let result = guess - offsetMs(new Date(guess), timeZone);
  // Segunda pasada por si el cambio de horario cae entre la suposición y el resultado.
  result = guess - offsetMs(new Date(result), timeZone);
  return new Date(result);
}

export const startOfLocalDay = (instant: Date, timeZone: string) => instantAt(localTime(instant, timeZone), 0, timeZone);
