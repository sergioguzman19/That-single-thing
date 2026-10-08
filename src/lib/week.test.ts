import { describe, expect, it } from "vitest";
import { dayTimeline, findOverlap, formatDuration, formatMinute, hoursByLane, nextBlockToday, validateDraft, type WeekBlock } from "./week";

const b = (id: string, laneId: string, dayOfWeek: number, start: string, end: string): WeekBlock => {
  const m = (t: string) => Number(t.split(":")[0]) * 60 + Number(t.split(":")[1]);
  return { id, laneId, dayOfWeek, startMinute: m(start), endMinute: m(end) };
};
const week = [
  b("1", "concejo", 1, "8:00", "12:00"),
  b("2", "clientes", 1, "13:00", "17:00"),
  b("3", "hyrox", 1, "18:00", "21:00"),
  b("4", "concejo", 2, "8:00", "12:00"),
];

describe("semana", () => {
  it("formatea horas y duraciones", () => {
    expect(formatMinute(8 * 60)).toBe("8:00");
    expect(formatMinute(13 * 60 + 15)).toBe("13:15");
    expect(formatDuration(240)).toBe("4 h");
    expect(formatDuration(90)).toBe("1 h 30");
    expect(formatDuration(45)).toBe("45 min");
  });

  it("valida un bloque", () => {
    const ok = { laneId: "x", startMinute: 480, endMinute: 720, days: [1] };
    expect(validateDraft(ok)).toBeNull();
    expect(validateDraft({ ...ok, days: [] })).toMatch(/día/);
    expect(validateDraft({ ...ok, endMinute: 480 })).toMatch(/después/);
    expect(validateDraft({ ...ok, startMinute: 481 })).toMatch(/15 minutos/);
    expect(validateDraft({ ...ok, laneId: "" })).toMatch(/carril/);
  });

  it("detecta cruces solo en los días escogidos", () => {
    const draft = { laneId: "x", startMinute: 11 * 60, endMinute: 14 * 60, days: [1] };
    expect(findOverlap(week, draft)?.id).toBe("1");
    expect(findOverlap(week, { ...draft, days: [3] })).toBeNull();
  });

  it("bloques que se tocan no se cruzan", () => {
    expect(findOverlap(week, { laneId: "x", startMinute: 12 * 60, endMinute: 13 * 60, days: [1] })).toBeNull();
  });

  it("al editar, el bloque no choca consigo mismo", () => {
    expect(findOverlap(week, { laneId: "concejo", startMinute: 8 * 60, endMinute: 12 * 60 + 30, days: [1] }, "1")).toBeNull();
  });

  it("arma el día con sus huecos como bloques abiertos", () => {
    const day = dayTimeline(week, 1);
    expect(day.map((i) => (i.kind === "open" ? `abierto ${i.startMinute}-${i.endMinute}` : i.block.id))).toEqual([
      "1",
      "abierto 720-780",
      "2",
      "abierto 1020-1080",
      "3",
    ]);
  });

  it("suma horas por carril", () => {
    const h = hoursByLane(week);
    expect(h.get("concejo")).toBe(8);
    expect(h.get("hyrox")).toBe(3);
  });

  it("encuentra el siguiente bloque de hoy", () => {
    expect(nextBlockToday(week, 1, 10 * 60)?.id).toBe("2");
    expect(nextBlockToday(week, 1, 19 * 60)).toBeNull();
  });
});
