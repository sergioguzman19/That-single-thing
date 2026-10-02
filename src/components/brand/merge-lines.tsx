import { cn } from "cn";
import { laneVar } from "@/lib/lanes";

type Props = {
  lanes: { id: string; color: string }[];
  activeId?: string | null;
  className?: string;
};

/**
 * Firma: los carriles bajan y convergen en un solo punto, el umbral del portal.
 * El carril activo se dibuja con su color; los demás quedan como trazos tenues.
 */
export function MergeLines({ lanes, activeId, className }: Props) {
  const n = lanes.length;
  return (
    <svg
      viewBox="0 0 1000 200"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("block h-24 w-full", className)}
    >
      {lanes.map((lane, i) => {
        const x = ((i + 0.5) / n) * 1000;
        const active = lane.id === activeId;
        return (
          <path
            key={lane.id}
            d={`M${x} 0 C ${x} 120, 500 80, 500 200`}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeWidth={active ? 2 : 1}
            style={{ stroke: active ? laneVar(lane.color) : "var(--foreground)" }}
            strokeOpacity={active ? 1 : 0.12}
          />
        );
      })}
    </svg>
  );
}
