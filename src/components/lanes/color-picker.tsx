"use client";

import { cn } from "cn";
import { LANE_COLORS, laneVar } from "@/lib/lanes";

/** Los 7 colores de carril. Los que ya usan otros carriles se ven tenues, pero se pueden repetir. */
export function ColorPicker({ value, onChange, used = [] }: { value: string; onChange: (id: string) => void; used?: string[] }) {
  return (
    <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2.5">
      {LANE_COLORS.map((c) => {
        const checked = c.id === value;
        return (
          <label key={c.id} title={c.name} className="relative cursor-pointer">
            <input type="radio" name="color" value={c.id} checked={checked} onChange={() => onChange(c.id)} className="peer sr-only" aria-label={c.name} />
            <span
              className={cn(
                "block size-8 rounded-full ring-offset-2 ring-offset-background transition-shadow duration-150 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                checked && "ring-2 ring-foreground",
                !checked && used.includes(c.id) && "opacity-35",
              )}
              style={{ background: laneVar(c.id) }}
            />
          </label>
        );
      })}
    </div>
  );
}
