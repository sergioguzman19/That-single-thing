import { describe, expect, it } from "vitest";
import { type Block, dispatch, type DispatchInput, focusUntil } from "./dispatch";
import { instantAt, localTime } from "./time";

const TZ = "America/Bogota"; // UTC−5, sin cambio de horario
// Martes 6 de octubre de 2026
const at = (hhmm: string, day = 6) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(2026, 9, day, h + 5, m));
};

const lanes = [{ id: "concejo" }, { id: "clientes" }, { id: "hyrox" }];
const tasks = [
  { id: "c1", laneId: "concejo" },
  { id: "c2", laneId: "concejo" },
  { id: "k1", laneId: "clientes" },
];
// Martes (2): Concejo 7–12, Clientes 14–18
const blocks: Block[] = [
  { laneId: "concejo", dayOfWeek: 2, startMinute: 7 * 60, endMinute: 12 * 60 },
  { laneId: "clientes", dayOfWeek: 2, startMinute: 14 * 60, endMinute: 18 * 60 },
];
const base = (over: Partial<DispatchInput>): DispatchInput => ({ now: at("08:00"), timeZone: TZ, lanes, tasks, blocks, focus: null, ...over });

describe("hora local", () => {
  it("convierte a la hora de Bogotá sin importar la zona del servidor", () => {
    const local = localTime(at("19:30"), TZ);
    expect(local).toMatchObject({ year: 2026, month: 10, day: 6, weekday: 2, minute: 19 * 60 + 30 });
  });

  it("a las 7 pm en Bogotá sigue siendo martes aunque en UTC ya sea miércoles", () => {
    expect(localTime(at("21:00"), TZ).weekday).toBe(2);
  });

  it("instantAt es el inverso de localTime", () => {
    expect(instantAt({ year: 2026, month: 10, day: 6 }, 7 * 60, TZ).toISOString()).toBe(at("07:00").toISOString());
    expect(instantAt({ year: 2026, month: 10, day: 6 }, 1440, TZ).toISOString()).toBe(at("00:00", 7).toISOString());
  });

  it("respeta zonas con cambio de horario", () => {
    // Nueva York, 1 de noviembre de 2026: termina el horario de verano.
    const ny = instantAt({ year: 2026, month: 11, day: 2 }, 9 * 60, "America/New_York");
    expect(localTime(ny, "America/New_York").minute).toBe(9 * 60);
  });
});

describe("bloque programado", () => {
  it("despacha su carril y sube la cabeza de la cola", () => {
    const d = dispatch(base({ now: at("08:00") }));
    expect(d).toMatchObject({ mode: "scheduled", laneId: "concejo", taskId: "c1" });
    expect(d.periodEnd.toISOString()).toBe(at("12:00").toISOString());
  });

  it("el bloque termina justo en su minuto final", () => {
    expect(dispatch(base({ now: at("11:59") })).mode).toBe("scheduled");
    expect(dispatch(base({ now: at("12:00") })).mode).toBe("choose");
  });

  it("carril del bloque vacío: despacha ese carril sin tarea", () => {
    const d = dispatch(base({ now: at("15:00"), tasks: tasks.filter((t) => t.laneId !== "clientes") }));
    expect(d).toMatchObject({ mode: "scheduled", laneId: "clientes", taskId: null });
  });

  it("ignora bloques de carriles archivados", () => {
    const d = dispatch(base({ now: at("08:00"), lanes: lanes.filter((l) => l.id !== "concejo") }));
    expect(d.mode).toBe("choose");
  });
});

describe("fuera del plan", () => {
  it("tocar otro carril durante un bloque lo despacha hasta que el bloque termine", () => {
    const focus = { laneId: "clientes", until: at("12:00") };
    expect(dispatch(base({ now: at("09:00"), focus }))).toMatchObject({ mode: "override", laneId: "clientes", taskId: "k1" });
  });

  it("escoger el mismo carril del bloque es simplemente el plan", () => {
    const focus = { laneId: "concejo", until: at("12:00") };
    expect(dispatch(base({ now: at("09:00"), focus })).mode).toBe("scheduled");
  });

  it("un foco vencido ya no cuenta", () => {
    const focus = { laneId: "clientes", until: at("09:00") };
    expect(dispatch(base({ now: at("09:30"), focus })).mode).toBe("scheduled");
  });
});

describe("bloque abierto", () => {
  it("sin bloque y sin carril escogido, hay que preguntar", () => {
    const d = dispatch(base({ now: at("12:30") }));
    expect(d).toMatchObject({ mode: "choose", laneId: null, taskId: null });
    // El período abierto dura hasta el siguiente bloque (Clientes, 14:00).
    expect(d.periodEnd.toISOString()).toBe(at("14:00").toISOString());
  });

  it("con carril escogido, despacha la cabeza de esa cola", () => {
    const focus = { laneId: "concejo", until: at("14:00") };
    expect(dispatch(base({ now: at("12:30"), focus }))).toMatchObject({ mode: "open", laneId: "concejo", taskId: "c1" });
  });

  it("siempre la cabeza de la cola, nunca otra tarea", () => {
    const focus = { laneId: "concejo", until: at("14:00") };
    expect(dispatch(base({ now: at("12:30"), focus, tasks: [tasks[1], tasks[0]] })).taskId).toBe("c2");
  });

  it("sin bloques en todo el día, el período abierto llega hasta medianoche", () => {
    const d = dispatch(base({ now: at("20:00"), blocks: [] }));
    expect(d.periodEnd.toISOString()).toBe(at("00:00", 7).toISOString());
  });

  it("un foco de un carril que ya no existe no cuenta", () => {
    const focus = { laneId: "borrado", until: at("14:00") };
    expect(dispatch(base({ now: at("12:30"), focus })).mode).toBe("choose");
  });
});

describe("duración del foco", () => {
  it("dentro de un bloque, dura hasta que termine el bloque", () => {
    expect(focusUntil(at("09:00"), TZ, blocks).toISOString()).toBe(at("12:00").toISOString());
  });

  it("en un bloque abierto, hasta el siguiente bloque", () => {
    expect(focusUntil(at("12:30"), TZ, blocks).toISOString()).toBe(at("14:00").toISOString());
  });

  it("si no quedan bloques hoy, hasta medianoche", () => {
    expect(focusUntil(at("19:00"), TZ, blocks).toISOString()).toBe(at("00:00", 7).toISOString());
  });

  it("no se arrastra al día siguiente", () => {
    const focus = { laneId: "hyrox", until: focusUntil(at("22:00"), TZ, []) };
    expect(dispatch(base({ now: at("00:30", 7), blocks: [], focus })).mode).toBe("choose");
  });
});
