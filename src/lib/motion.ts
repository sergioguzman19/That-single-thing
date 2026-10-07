/** Duraciones del movimiento (ms). Espejo de las animaciones de globals.css. */
export const MOTION = {
  quick: 150,
  dispatch: 280,
  draw: 420,
  arrive: 520,
  glow: 600,
} as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
