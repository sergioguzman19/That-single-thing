import type { Board } from "@/lib/data/lanes";
import type { LaneSummary } from "./lane-list";

export const toSummaries = (board: Board): LaneSummary[] =>
  board.lanes.map((lane) => ({
    id: lane.id,
    name: lane.name,
    color: lane.color,
    count: lane.tasks.length,
    agingCount: lane.agingCount,
    firstTitle: lane.tasks[0]?.title ?? null,
  }));
