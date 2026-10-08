"use client";

import { cn } from "cn";
import { laneVar } from "@/lib/lanes";

type LaneOption = { id: string; name: string; color: string };

/** Escoger un carril con chips de color. Es un grupo de radio accesible. */
export function LanePicker({
  lanes,
  value,
  onChange,
  name = "lane",
}: {
  lanes: LaneOption[];
  value: string;
  onChange: (id: string) => void;
  name?: string;
}) {
  return (
    <div role="radiogroup" aria-label="Carril" className="flex flex-wrap gap-1.5">
      {lanes.map((lane) => {
        const checked = lane.id === value;
        return (
          <label
            key={lane.id}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-150 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              checked ? "border-[var(--lane)] bg-portal font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
            style={{ "--lane": laneVar(lane.color) } as React.CSSProperties}
          >
            <input type="radio" name={name} value={lane.id} checked={checked} onChange={() => onChange(lane.id)} className="sr-only" />
            <span className="size-2 rounded-full bg-[var(--lane)]" aria-hidden="true" />
            {lane.name}
          </label>
        );
      })}
    </div>
  );
}
