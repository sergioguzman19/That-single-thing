"use client";

import { Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { ResponsiveDialog } from "@/components/app/responsive-dialog";
import { LanePicker } from "@/components/lanes/lane-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { deleteBlock, saveBlock } from "@/lib/actions/blocks";
import { DAY_LETTER, DAY_NAMES, findOverlap, formatMinute, PRESETS, TIME_OPTIONS, validateDraft, WEEK_ORDER, type WeekBlock } from "@/lib/week";

type LaneOption = { id: string; name: string; color: string };

export type BlockDialogTarget =
  | { mode: "new"; day: number; startMinute?: number; endMinute?: number }
  | { mode: "edit"; block: WeekBlock };

export function BlockDialog({
  target,
  onOpenChange,
  lanes,
  blocks,
}: {
  target: BlockDialogTarget | null;
  onOpenChange: (open: boolean) => void;
  lanes: LaneOption[];
  blocks: WeekBlock[];
}) {
  const title = target?.mode === "edit" ? "Editar bloque" : "Nuevo bloque";
  return (
    <ResponsiveDialog open={Boolean(target)} onOpenChange={onOpenChange} title={title}>
      {target ? (
        <BlockForm
          key={target.mode === "edit" ? target.block.id : `new-${target.day}-${target.startMinute ?? ""}`}
          target={target}
          lanes={lanes}
          blocks={blocks}
          onDone={() => onOpenChange(false)}
        />
      ) : null}
    </ResponsiveDialog>
  );
}

function BlockForm({ target, lanes, blocks, onDone }: { target: BlockDialogTarget; lanes: LaneOption[]; blocks: WeekBlock[]; onDone: () => void }) {
  const editing = target.mode === "edit" ? target.block : null;
  const [laneId, setLaneId] = useState(editing?.laneId ?? lanes[0]?.id ?? "");
  const [start, setStart] = useState(editing?.startMinute ?? (target.mode === "new" ? target.startMinute : undefined) ?? PRESETS[0].start);
  const [end, setEnd] = useState(editing?.endMinute ?? (target.mode === "new" ? target.endMinute : undefined) ?? PRESETS[0].end);
  const [days, setDays] = useState<number[]>(editing ? [editing.dayOfWeek] : [target.mode === "new" ? target.day : 1]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const draft = { laneId, startMinute: start, endMinute: end, days };
  const invalid = validateDraft(draft);
  const clash = invalid ? null : findOverlap(blocks, draft, editing?.id);
  const clashLane = clash ? lanes.find((l) => l.id === clash.laneId)?.name : null;
  const problem =
    invalid ??
    (clash
      ? `Choca con ${clashLane} el ${DAY_NAMES[clash.dayOfWeek].toLowerCase()} de ${formatMinute(clash.startMinute)} a ${formatMinute(clash.endMinute)}.`
      : null);

  const toggleDay = (day: number) => setDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day]));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (problem) return;
    startTransition(async () => {
      const result = await saveBlock({ ...draft, id: editing?.id });
      if (!result.ok) return setError(result.error);
      toast(editing ? "Bloque guardado" : days.length === 1 ? "Bloque creado" : `Bloque creado en ${days.length} días`);
      onDone();
    });
  };

  const remove = () =>
    startTransition(async () => {
      const result = await deleteBlock(editing!.id);
      if (!result.ok) return setError(result.error);
      toast("Bloque eliminado");
      onDone();
    });

  return (
    <form onSubmit={submit} className="grid gap-4 pt-2">
      <div className="grid gap-2">
        <Label>Carril</Label>
        <LanePicker lanes={lanes} value={laneId} onChange={setLaneId} name="block-lane" />
      </div>

      <div className="grid gap-2">
        <Label>Horario</Label>
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Franjas rápidas">
          {PRESETS.map((p) => {
            const on = p.start === start && p.end === end;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setStart(p.start);
                  setEnd(p.end);
                }}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-center text-sm transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  on ? "border-foreground bg-muted font-semibold" : "hover:bg-muted/60",
                )}
              >
                {p.name}
                <span className="block font-mono text-[0.65rem] text-muted-foreground">
                  {formatMinute(p.start)}–{formatMinute(p.end)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TimeSelect label="Empieza" value={start} onChange={setStart} max={1425} />
          <span className="text-sm text-muted-foreground">a</span>
          <TimeSelect label="Termina" value={end} onChange={setEnd} min={15} />
        </div>
      </div>

      {editing ? (
        <p className="text-sm text-muted-foreground">
          Día: <span className="font-medium text-foreground">{DAY_NAMES[editing.dayOfWeek]}</span>
        </p>
      ) : (
        <div className="grid gap-2">
          <Label>Se repite</Label>
          <div className="grid grid-cols-7 gap-1" role="group" aria-label="Días">
            {WEEK_ORDER.map((day) => {
              const on = days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={on}
                  aria-label={DAY_NAMES[day]}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "rounded-full border py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    on ? "border-foreground bg-foreground text-background" : "hover:bg-muted/60",
                  )}
                >
                  {DAY_LETTER[day]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {problem || error ? (
        <p role="alert" className="text-sm text-destructive">
          {problem ?? error}
        </p>
      ) : null}

      <div className={cn("grid gap-2", editing && "grid-cols-2")}>
        {editing ? (
          confirmDelete ? (
            <Button type="button" variant="destructive" disabled={pending} onClick={remove}>
              Confirmar: eliminar
            </Button>
          ) : (
            <Button type="button" variant="outline" className="text-destructive" disabled={pending} onClick={() => setConfirmDelete(true)}>
              <Trash2Icon />
              Eliminar
            </Button>
          )
        ) : null}
        <Button type="submit" size="lg" className="h-10" disabled={pending || Boolean(problem)}>
          {pending ? "Guardando…" : editing ? "Guardar" : days.length > 1 ? `Guardar en ${days.length} días` : "Guardar bloque"}
        </Button>
      </div>
    </form>
  );
}

function TimeSelect({ label, value, onChange, min = 0, max = 1440 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-10 w-full rounded-md border border-input bg-background px-2 text-center font-mono text-base tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {TIME_OPTIONS.filter((m) => m >= min && m <= max).map((m) => (
        <option key={m} value={m}>
          {m === 1440 ? "24:00" : formatMinute(m)}
        </option>
      ))}
    </select>
  );
}
