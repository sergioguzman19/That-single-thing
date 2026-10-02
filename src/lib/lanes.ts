/** Colores disponibles para un carril. El valor se guarda en lanes.color. */
export const LANE_COLORS = [
  { id: "maya", name: "Azul maya" },
  { id: "patio", name: "Verde patio" },
  { id: "izamal", name: "Ocre Izamal" },
  { id: "buganvilia", name: "Buganvilia" },
  { id: "anil", name: "Añil" },
  { id: "flamboyan", name: "Flamboyán" },
  { id: "henequen", name: "Henequén" },
] as const;

export type LaneColor = (typeof LANE_COLORS)[number]["id"];

/** Variable CSS del color de un carril, para usar como `--lane` en style. */
export const laneVar = (color: LaneColor | string) => `var(--lane-${color})`;
