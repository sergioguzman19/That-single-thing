import { describe, expect, it } from "vitest";
import { neighbors, positionAtEnd, positionAtStart, positionBetween, renumber } from "./ordering";

describe("orden de la cola", () => {
  it("una cola vacía empieza en 1", () => {
    expect(positionAtEnd([])).toBe(1);
    expect(positionAtStart([])).toBe(1);
  });

  it("al final queda después de la última y de primera antes de la primera", () => {
    expect(positionAtEnd([1, 2, 3])).toBe(4);
    expect(positionAtStart([1, 2, 3])).toBe(0);
    expect(positionAtStart([-2, 5])).toBe(-3);
  });

  it("entre dos queda en el punto medio", () => {
    expect(positionBetween(1, 2)).toBe(1.5);
    expect(positionBetween(null, 1)).toBe(0);
    expect(positionBetween(3, null)).toBe(4);
    expect(positionBetween(null, null)).toBe(1);
  });

  it("pide renumerar cuando ya no cabe", () => {
    expect(positionBetween(1, 1 + 1e-9)).toBeNull();
  });

  it("muchas inserciones seguidas en el mismo hueco mantienen el orden hasta pedir renumerar", () => {
    let low = 1;
    const high = 2;
    let steps = 0;
    for (;;) {
      const p = positionBetween(low, high);
      if (p === null) break;
      expect(p).toBeGreaterThan(low);
      expect(p).toBeLessThan(high);
      low = p;
      steps++;
    }
    expect(steps).toBeGreaterThan(15);
  });

  it("renumera en el orden dado", () => {
    expect(renumber(["a", "b", "c"]).map((r) => r.position)).toEqual([1, 2, 3]);
  });

  it("encuentra las vecinas de la tarea movida", () => {
    const pos = new Map([["a", 1], ["b", 2], ["c", 3]]);
    expect(neighbors(["c", "a", "b"], "c", pos)).toEqual({ before: null, after: 1 });
    expect(neighbors(["a", "c", "b"], "c", pos)).toEqual({ before: 1, after: 2 });
    expect(neighbors(["a", "b", "c"], "c", pos)).toEqual({ before: 2, after: null });
  });
});
