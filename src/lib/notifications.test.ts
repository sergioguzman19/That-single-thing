import { describe, expect, it } from "vitest";
import { type NotifyInput, planNotifications } from "./notifications";

const TZ = "America/Bogota";
// Jueves 8 de octubre de 2026, hora de Bogotá (UTC−5).
const at = (hhmm: string, day = 8) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(2026, 9, day, h + 5, m));
};
const lanes = [
  { id: "concejo", name: "Concejo" },
  { id: "empresa", name: "Empresa" },
];
// Jueves (4): Concejo 8–12, Empresa 13–17, Empresa 17–18 (pegado).
const blocks = [
  { id: "b1", laneId: "concejo", dayOfWeek: 4, startMinute: 480, endMinute: 720 },
  { id: "b2", laneId: "empresa", dayOfWeek: 4, startMinute: 780, endMinute: 1020 },
  { id: "b3", laneId: "empresa", dayOfWeek: 4, startMinute: 1020, endMinute: 1080 },
];
const task = (id: string, laneId: string, over: Partial<NotifyInput["tasks"][number]> = {}) => ({
  id,
  laneId,
  title: `Tarea ${id}`,
  startedAt: null,
  createdAt: at("07:00").toISOString(),
  agingNotifiedAt: null,
  ...over,
});
const base = (over: Partial<NotifyInput>): NotifyInput => ({
  now: at("12:01"),
  timeZone: TZ,
  agingDays: 7,
  lanes,
  blocks,
  tasks: [task("c1", "concejo"), task("e1", "empresa")],
  lastTaskId: null,
  ...over,
});

describe("avisos de fin de bloque", () => {
  it("terminó el bloque con la tarea en curso: pregunta y avisa el bloque abierto que sigue", () => {
    const { notifications } = planNotifications(base({ tasks: [task("c1", "concejo", { startedAt: at("08:05").toISOString() })] }));
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ key: "end:b1:2026-10-8", title: "Terminó el bloque de Concejo", taskId: "c1" });
    expect(notifications[0].body).toContain("¿Terminaste «Tarea c1»?");
    expect(notifications[0].body).toContain("bloque abierto hasta las 13:00");
  });

  it("la tarea única del bloque sin terminar también cuenta aunque no se haya empezado", () => {
    const { notifications } = planNotifications(base({ lastTaskId: "c1" }));
    expect(notifications[0]).toMatchObject({ taskId: "c1" });
  });

  it("sin tarea abierta pero con hueco: solo avisa el bloque abierto", () => {
    const { notifications } = planNotifications(base({}));
    expect(notifications).toEqual([expect.objectContaining({ key: "open:b1:2026-10-8", title: "Bloque abierto" })]);
  });

  it("bloques pegados no anuncian bloque abierto", () => {
    const { notifications } = planNotifications(base({ now: at("17:01") }));
    expect(notifications).toHaveLength(0);
  });

  it("después del último bloque del día no hay bloque abierto que avisar", () => {
    const { notifications } = planNotifications(base({ now: at("18:01") }));
    expect(notifications).toHaveLength(0);
  });

  it("solo dentro de la ventana: ni antes ni mucho después", () => {
    expect(planNotifications(base({ now: at("11:59") })).notifications).toHaveLength(0);
    expect(planNotifications(base({ now: at("12:10") })).notifications).toHaveLength(0);
  });

  it("un bloque que termina a medianoche se avisa al empezar el día siguiente", () => {
    const night = [{ id: "n", laneId: "concejo", dayOfWeek: 4, startMinute: 1320, endMinute: 1440 }];
    const { notifications } = planNotifications(
      base({ now: at("00:01", 9), blocks: night, tasks: [task("c1", "concejo", { startedAt: at("22:10").toISOString() })] }),
    );
    expect(notifications[0]).toMatchObject({ key: "end:n:2026-10-9", taskId: "c1" });
  });
});

describe("avisos de rezagadas", () => {
  const old = task("viejo", "concejo", { createdAt: at("10:00", 1).toISOString() });

  it("avisa una tarea que cumplió los días de rezagada", () => {
    const { notifications, agingTaskIds } = planNotifications(base({ now: at("10:30"), tasks: [old] }));
    expect(agingTaskIds).toEqual(["viejo"]);
    expect(notifications[0].title).toBe("Una tarea se volvió rezagada");
    expect(notifications[0].url).toBe("/carriles/concejo");
  });

  it("no repite el aviso", () => {
    const { agingTaskIds } = planNotifications(base({ now: at("10:30"), tasks: [{ ...old, agingNotifiedAt: at("09:00").toISOString() }] }));
    expect(agingTaskIds).toEqual([]);
  });

  it("no avisa de noche", () => {
    expect(planNotifications(base({ now: at("22:30"), tasks: [old] })).agingTaskIds).toEqual([]);
    expect(planNotifications(base({ now: at("07:59"), tasks: [old] })).agingTaskIds).toEqual([]);
  });

  it("agrupa varias en un solo aviso", () => {
    const { notifications } = planNotifications(base({ now: at("10:30"), tasks: [old, { ...old, id: "viejo2" }] }));
    expect(notifications.filter((n) => n.key.startsWith("aging"))).toHaveLength(1);
    expect(notifications[0].title).toBe("2 tareas se volvieron rezagadas");
  });
});
