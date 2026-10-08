"use client";

import { PlusIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/app/responsive-dialog";
import { LanePicker } from "@/components/lanes/lane-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createTask } from "@/lib/actions/tasks";

type LaneOption = { id: string; name: string; color: string };
const LAST_LANE = "tst.lastLane";

function readLastLane() {
  try {
    return localStorage.getItem(LAST_LANE);
  } catch {
    return null;
  }
}

/**
 * Carril que viene marcado al capturar: el de la pantalla (dentro de un carril),
 * si no, el último en el que se capturó, si no, el primero.
 * (Desde la fase 3: en Ahora, el que esté despachando.)
 */
function defaultLane(lanes: LaneOption[], path: string) {
  const fromPath = path.match(/^\/carriles\/([^/]+)/)?.[1];
  const ids = new Set(lanes.map((l) => l.id));
  if (fromPath && ids.has(fromPath)) return fromPath;
  const last = readLastLane();
  if (last && ids.has(last)) return last;
  return lanes[0]?.id ?? "";
}

/** Capturar una tarea en tres segundos, desde cualquier pantalla. Atajo: N en escritorio. */
export function CaptureButton({ lanes }: { lanes: LaneOption[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (event.key.toLowerCase() === "n" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button
        size="icon-lg"
        aria-label="Capturar tarea"
        aria-keyshortcuts="N"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 size-14 rounded-full shadow-lg md:right-8 md:bottom-8"
      >
        <PlusIcon className="size-6" />
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Capturar">
        {open ? (
          lanes.length ? (
            <CaptureForm lanes={lanes} initialLane={defaultLane(lanes, path)} onDone={() => setOpen(false)} />
          ) : (
            <p className="pb-2 text-sm text-muted-foreground">Primero crea un carril en Carriles.</p>
          )
        ) : null}
      </ResponsiveDialog>
    </>
  );
}

function CaptureForm({ lanes, initialLane, onDone }: { lanes: LaneOption[]; initialLane: string; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [laneId, setLaneId] = useState(initialLane);
  const [first, setFirst] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const laneName = lanes.find((l) => l.id === laneId)?.name ?? "";

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    startTransition(async () => {
      const result = await createTask({ laneId, title, notes, first });
      if (!result.ok) return setError(result.error);
      try {
        localStorage.setItem(LAST_LANE, laneId);
      } catch {}
      toast(first ? `De primera en ${laneName}` : `Añadida a ${laneName}`);
      onDone();
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4 pt-2">
      <Textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          // Enter guarda; Shift+Enter hace salto de línea.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="¿Qué hay que hacer?"
        aria-label="Tarea"
        maxLength={500}
        rows={2}
        autoFocus
        enterKeyHint="done"
        className="min-h-14 resize-none text-base"
      />
      {showNotes ? (
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Descripción" aria-label="Descripción" rows={3} className="text-base" />
      ) : (
        <button type="button" onClick={() => setShowNotes(true)} className="-mt-2 justify-self-start text-sm text-maya-ink hover:underline">
          + Agregar descripción
        </button>
      )}
      <div className="grid gap-2">
        <Label>Carril</Label>
        <LanePicker lanes={lanes} value={laneId} onChange={setLaneId} name="capture-lane" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="capture-first" className="grid gap-0.5 font-normal">
          <span className="font-medium">Saltar la fila</span>
          <span className="text-xs text-muted-foreground">Queda de primera en {laneName}</span>
        </Label>
        <Switch id="capture-first" checked={first} onCheckedChange={setFirst} />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending ? "Añadiendo…" : "Añadir a la cola"}
      </Button>
    </form>
  );
}
