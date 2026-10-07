import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LANE_COLORS } from "./lanes";
import { MOTION } from "./motion";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const migrations = readFileSync(
  new URL("../../supabase/migrations/20261007120000_audit_adjustments.sql", import.meta.url),
  "utf8",
);

describe("tokens de diseño", () => {
  it("las duraciones de motion.ts coinciden con las animaciones de globals.css", () => {
    const duration = (name: string) => Number(css.match(new RegExp(`--animate-${name}: \\S+ (\\d+)ms`))?.[1]);
    expect(duration("portal-arrive")).toBe(MOTION.arrive);
    expect(duration("portal-dispatch")).toBe(MOTION.dispatch);
    expect(duration("portal-glow")).toBe(MOTION.glow);
    expect(duration("lane-draw")).toBe(MOTION.draw);
  });

  it("cada color de carril tiene token en claro y oscuro", () => {
    for (const { id } of LANE_COLORS) {
      expect(css.match(new RegExp(`--lane-${id}:`, "g"))?.length).toBe(2);
      expect(css).toContain(`--color-lane-${id}: var(--lane-${id})`);
    }
  });

  it("la base de datos acepta exactamente los colores de carril de la identidad", () => {
    const allowed = migrations.match(/check \(color in \(([^)]+)\)\)/)?.[1].match(/'(\w+)'/g)?.map((c) => c.slice(1, -1));
    expect(allowed?.sort()).toEqual(LANE_COLORS.map((c) => c.id).sort());
  });
});
