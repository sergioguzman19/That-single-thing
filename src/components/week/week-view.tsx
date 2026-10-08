"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import type { WeekState } from "@/lib/data/week";
import { laneVar } from "@/lib/lanes";
import { localTime } from "@/lib/time";
import { DAY_NAMES, DAY_SHORT, dayTimeline, formatDuration, formatMinute, hoursByLane, WEEK_ORDER, type WeekBlock } from "@/lib/week";
import { BlockDialog, type BlockDialogTarget } from "./block-dialog";

const HOUR_PX = 34;

export function WeekView({ state }: { state: WeekState }) {
  const now = useNow();
  const local = now ? localTime(now, state.timeZone) : null;
  const today = local?.weekday ?? null;
  const [selected, setSelected] = useState<number | null>(null);
  const day = selected ?? today ?? 1;
  const [target, setTarget] = useState<BlockDialogTarget | null>(null);
  const laneOf = (id: string) => state.lanes.find((l) => l.id === id);

  if (state.lanes.length === 0) {
    return (
      <div className="grid gap-2">
        <h1 className="text-3xl">Semana</h1>
        <p className="text-sm text-muted-foreground">Primero crea tus carriles en Carriles; después asígnales bloques aquí.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-3xl">Semana</h1>
          <p className="text-sm text-muted-foreground">Cada bloque es foco total en un frente. Cuando llega, su primera tarea sube sola.</p>
        </div>
        <Button variant="outline" className="hidden md:inline-flex" onClick={() => setTarget({ mode: "new", day })}>
          <PlusIcon />
          Nuevo bloque
        </Button>
      </header>

      {/* Celular: un día a la vez. */}
      <div className="grid gap-4 md:hidden">
        <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Días">
          {WEEK_ORDER.map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={d === day}
              onClick={() => setSelected(d)}
              className={cn(
                "grid justify-items-center gap-0.5 rounded-lg py-1.5 text-[0.7rem] transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                d === day ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {DAY_SHORT[d]}
              <span className={cn("size-1 rounded-full", d === today ? "bg-maya" : "bg-transparent")} aria-hidden="true" />
            </button>
          ))}
        </div>
        <DayList
          blocks={state.blocks}
          day={day}
          nowMinute={day === today ? (local?.minute ?? null) : null}
          laneOf={laneOf}
          onEdit={(block) => setTarget({ mode: "edit", block })}
        />
        <Button variant="outline" className="h-11 border-dashed text-muted-foreground" onClick={() => setTarget({ mode: "new", day })}>
          <PlusIcon />
          Añadir bloque al {DAY_NAMES[day].toLowerCase()}
        </Button>
      </div>

      {/* Escritorio: la semana completa. */}
      <div className="hidden gap-8 md:grid md:grid-cols-[minmax(0,1fr)_14rem]">
        <WeekGrid
          blocks={state.blocks}
          today={today}
          nowMinute={local?.minute ?? null}
          laneOf={laneOf}
          onEdit={(block) => setTarget({ mode: "edit", block })}
          onCreate={(d, start) => setTarget({ mode: "new", day: d, startMinute: start, endMinute: Math.min(start + 120, 1440) })}
        />
        <Balance blocks={state.blocks} lanes={state.lanes} />
      </div>
      <div className="md:hidden">
        <Balance blocks={state.blocks} lanes={state.lanes} />
      </div>

      <BlockDialog target={target} onOpenChange={(o) => !o && setTarget(null)} lanes={state.lanes} blocks={state.blocks} />
    </div>
  );
}

type LaneLookup = (id: string) => { name: string; color: string } | undefined;

function DayList({
  blocks,
  day,
  nowMinute,
  laneOf,
  onEdit,
}: {
  blocks: WeekBlock[];
  day: number;
  nowMinute: number | null;
  laneOf: LaneLookup;
  onEdit: (b: WeekBlock) => void;
}) {
  const items = dayTimeline(blocks, day);
  if (!items.length) {
    return <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">Sin bloques: todo el {DAY_NAMES[day].toLowerCase()} es bloque abierto.</p>;
  }
  return (
    <ol className="grid gap-1.5">
      {items.map((item) => {
        const start = item.kind === "block" ? item.block.startMinute : item.startMinute;
        const end = item.kind === "block" ? item.block.endMinute : item.endMinute;
        const live = nowMinute !== null && start <= nowMinute && nowMinute < end;
        return (
          <li key={item.kind === "block" ? item.block.id : `open-${start}`} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3">
            <span className="pt-2.5 text-right font-mono text-xs text-muted-foreground tabular-nums">{formatMinute(start)}</span>
            {item.kind === "block" ? (
              <button
                type="button"
                onClick={() => onEdit(item.block)}
                className={cn(
                  "grid gap-0.5 rounded-lg border border-l-4 px-3 py-2 text-left transition-colors duration-150 hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  live && "border-portal-edge bg-portal",
                )}
                style={{ borderLeftColor: laneVar(laneOf(item.block.laneId)?.color ?? "maya") }}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {laneOf(item.block.laneId)?.name}
                  {live ? <span className="ml-auto text-xs font-semibold text-maya-ink">Ahora</span> : null}
                </span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatMinute(start)} – {formatMinute(end)} · {formatDuration(end - start)}
                </span>
              </button>
            ) : (
              <span className={cn("rounded-lg border border-dashed px-3 py-1.5 text-xs text-muted-foreground", live && "border-maya text-maya-ink")}>
                Bloque abierto · {formatDuration(end - start)}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function WeekGrid({
  blocks,
  today,
  nowMinute,
  laneOf,
  onEdit,
  onCreate,
}: {
  blocks: WeekBlock[];
  today: number | null;
  nowMinute: number | null;
  laneOf: LaneLookup;
  onEdit: (b: WeekBlock) => void;
  onCreate: (day: number, start: number) => void;
}) {
  // De 6:00 a 22:00, ampliado si hay bloques por fuera.
  const startHour = Math.min(6, ...blocks.map((b) => Math.floor(b.startMinute / 60)));
  const endHour = Math.max(22, ...blocks.map((b) => Math.ceil(b.endMinute / 60)));
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const y = (minute: number) => ((minute - startHour * 60) / 60) * HOUR_PX;
  const height = (endHour - startHour) * HOUR_PX;

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[40rem] grid-cols-[2.5rem_repeat(7,minmax(0,1fr))]">
        <div />
        {WEEK_ORDER.map((d) => (
          <div key={d} className={cn("border-b pb-2 text-center text-xs text-muted-foreground", d === today && "font-semibold text-maya-ink")}>
            {DAY_SHORT[d]}
          </div>
        ))}
        <div className="relative" style={{ height }}>
          {hours.map((h, i) =>
            i % 2 === 0 ? (
              <span key={h} className="absolute right-1.5 -translate-y-1/2 font-mono text-[0.65rem] text-muted-foreground tabular-nums" style={{ top: y(h * 60) }}>
                {h}:00
              </span>
            ) : null,
          )}
        </div>
        {WEEK_ORDER.map((d) => (
          <div
            key={d}
            className="relative cursor-copy border-l"
            style={{ height }}
            onClick={(e) => {
              if (e.target !== e.currentTarget) return;
              const offset = e.clientY - e.currentTarget.getBoundingClientRect().top;
              const hour = startHour + Math.floor(offset / HOUR_PX);
              onCreate(d, Math.max(0, Math.min(hour * 60, 1380)));
            }}
            title={`Clic para crear un bloque el ${DAY_NAMES[d].toLowerCase()}`}
          >
            {hours.map((h) => (
              <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/70" style={{ top: y(h * 60) }} />
            ))}
            {blocks
              .filter((b) => b.dayOfWeek === d)
              .map((b) => {
                const lane = laneOf(b.laneId);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onEdit(b)}
                    className="absolute inset-x-1 overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-left text-xs font-semibold transition-[filter] duration-150 hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    style={{
                      top: y(b.startMinute) + 1,
                      height: y(b.endMinute) - y(b.startMinute) - 2,
                      borderLeftColor: laneVar(lane?.color ?? "maya"),
                      background: `color-mix(in oklch, ${laneVar(lane?.color ?? "maya")} 12%, var(--background))`,
                    }}
                  >
                    <span className="block truncate">{lane?.name}</span>
                    <span className="block truncate font-mono text-[0.65rem] font-normal text-muted-foreground">
                      {formatMinute(b.startMinute)}–{formatMinute(b.endMinute)}
                    </span>
                  </button>
                );
              })}
            {d === today && nowMinute !== null && nowMinute >= startHour * 60 && nowMinute <= endHour * 60 ? (
              <div className="pointer-events-none absolute inset-x-0 border-t-2 border-maya" style={{ top: y(nowMinute) }} aria-hidden="true">
                <span className="absolute -top-[5px] -left-1 size-2 rounded-full bg-maya" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function Balance({ blocks, lanes }: { blocks: WeekBlock[]; lanes: { id: string; name: string; color: string }[] }) {
  const hours = hoursByLane(blocks);
  const max = Math.max(1, ...hours.values());
  const total = [...hours.values()].reduce((a, b) => a + b, 0);
  return (
    <section className="grid content-start gap-3" aria-label="Horas por carril">
      <span className="eyebrow">Horas por carril</span>
      <ul className="grid gap-2">
        {lanes.map((lane) => {
          const h = hours.get(lane.id) ?? 0;
          return (
            <li key={lane.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)_3rem] items-center gap-2 text-sm">
              <span className="truncate">{lane.name}</span>
              <span className="h-2 rounded-full bg-muted">
                <span className="block h-2 rounded-full" style={{ width: `${(h / max) * 100}%`, background: laneVar(lane.color) }} />
              </span>
              <span className={cn("text-right font-mono text-xs tabular-nums", h === 0 ? "text-aging" : "text-muted-foreground")}>
                {h ? `${+h.toFixed(2)} h` : "0 h"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">{total ? `${+total.toFixed(2)} h de foco a la semana` : "Todavía no hay bloques: todo el tiempo es bloque abierto."}</p>
    </section>
  );
}
