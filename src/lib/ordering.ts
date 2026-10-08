/**
 * Orden de las colas con posiciones fraccionarias: mover una tarea solo cambia esa fila.
 * Al final = máximo + 1; de primera = mínimo − 1; entre dos = punto medio.
 * Si dos vecinas quedan demasiado cerca para partir el espacio, hay que renumerar la cola.
 */

const MIN_GAP = 1e-6;

export function positionAtEnd(positions: number[]): number {
  return positions.length ? Math.max(...positions) + 1 : 1;
}

export function positionAtStart(positions: number[]): number {
  return positions.length ? Math.min(...positions) - 1 : 1;
}

/**
 * Posición para quedar entre `before` (la que queda arriba) y `after` (la que queda abajo).
 * Cualquiera de las dos puede faltar: sin `before` va de primera; sin `after`, al final.
 * Devuelve null si no cabe y hay que renumerar.
 */
export function positionBetween(before: number | null, after: number | null): number | null {
  if (before === null && after === null) return 1;
  if (before === null) return (after as number) - 1;
  if (after === null) return before + 1;
  if (after - before < MIN_GAP) return null;
  return (before + after) / 2;
}

/** Posiciones limpias 1, 2, 3… para renumerar una cola en su orden actual. */
export function renumber<T>(items: T[]): { item: T; position: number }[] {
  return items.map((item, i) => ({ item, position: i + 1 }));
}

/**
 * Dónde cae una tarea movida dentro de una lista ya ordenada.
 * `ids` es el orden después de soltarla; devuelve las vecinas con su posición.
 */
export function neighbors(ids: string[], movedId: string, positions: Map<string, number>) {
  const i = ids.indexOf(movedId);
  const before = i > 0 ? (positions.get(ids[i - 1]) ?? null) : null;
  const after = i < ids.length - 1 ? (positions.get(ids[i + 1]) ?? null) : null;
  return { before, after };
}
