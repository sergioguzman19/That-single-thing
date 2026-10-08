import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import type { Board, Lane } from "@/lib/data/lanes";
import { laneVar } from "@/lib/lanes";
import { Queue } from "./queue";

/** Encabezado del carril + su cola. Se usa en /carriles/[id] y en el panel derecho del escritorio. */
export function LaneView({ lane, board, back = true }: { lane: Lane; board: Board; back?: boolean }) {
  const lanes = board.lanes.map(({ id, name, color }) => ({ id, name, color }));
  return (
    <section className="grid gap-4" style={{ "--lane": laneVar(lane.color) } as React.CSSProperties}>
      {back ? (
        <Link href="/carriles" className="-mb-1 inline-flex items-center gap-1 justify-self-start text-sm text-muted-foreground hover:text-foreground md:hidden">
          <ChevronLeftIcon className="size-4" />
          Carriles
        </Link>
      ) : null}
      <header className="grid gap-3">
        <div className="flex items-baseline gap-3">
          <span className="size-3 shrink-0 self-center rounded-full bg-[var(--lane)]" aria-hidden="true" />
          <h1 className="text-3xl">{lane.name}</h1>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">{lane.tasks.length} en cola</span>
        </div>
        <div className="h-[3px] rounded-full bg-[var(--lane)]" aria-hidden="true" />
      </header>
      <Queue lane={{ id: lane.id, name: lane.name, color: lane.color }} tasks={lane.tasks} lanes={lanes} />
    </section>
  );
}
