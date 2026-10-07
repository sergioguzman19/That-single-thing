import { cn } from "cn";
import { laneVar } from "@/lib/lanes";

type Props = {
  lanes: { id: string; color: string }[];
  activeId?: string | null;
  className?: string;
};

/**
 * Firma: los carriles bajan y convergen en un solo punto, el umbral del portal.
 * El carril activo se dibuja con su color, trazándose de arriba hacia el umbral
 * cada vez que cambia; los demás quedan como trazos tenues.
 */
export function MergeLines({ lanes, activeId, className }: Props) {
  const n = lanes.length;
  const path = (i: number) => {
    const x = ((i + 0.5) / n) * 1000;
    return `M${x} 0 C ${x} 120, 500 80, 500 200`;
  };
  const activeIndex = lanes.findIndex((lane) => lane.id === activeId);
  const active = activeIndex >= 0 ? lanes[activeIndex] : null;
  const maskId = `merge-reveal-${activeId ?? "none"}`;

  return (
    <svg
      viewBox="0 0 1000 200"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("block h-24 w-full", className)}
    >
      {lanes.map((lane, i) => (
        <path
          key={lane.id}
          d={path(i)}
          fill="none"
          vectorEffect="non-scaling-stroke"
          strokeWidth={1}
          style={{ stroke: "var(--foreground)" }}
          strokeOpacity={0.12}
        />
      ))}
      {active ? (
        // key = carril activo: al cambiar, el trazo se vuelve a dibujar.
        <g key={active.id}>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="200">
            <rect
              width="1000"
              height="200"
              fill="white"
              className="animate-lane-draw"
              style={{ transformBox: "fill-box", transformOrigin: "top" }}
            />
          </mask>
          <path
            d={path(activeIndex)}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeWidth={2}
            style={{ stroke: laneVar(active.color) }}
            mask={`url(#${maskId})`}
          />
        </g>
      ) : null}
    </svg>
  );
}
