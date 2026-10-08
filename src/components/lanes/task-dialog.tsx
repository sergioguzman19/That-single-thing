"use client";

import { ArrowDownToLineIcon, ArrowUpToLineIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/app/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteTask, moveTaskToEdge, updateTask } from "@/lib/actions/tasks";
import { LanePicker } from "./lane-picker";

type TaskLike = { id: string; title: string; notes: string; laneId: string };
type LaneOption = { id: string; name: string; color: string };

export function TaskDialog({
  task,
  lanes,
  onOpenChange,
}: {
  task: TaskLike | null;
  lanes: LaneOption[];
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ResponsiveDialog open={Boolean(task)} onOpenChange={onOpenChange} title="Editar tarea">
      {task ? <TaskForm key={task.id} task={task} lanes={lanes} onDone={() => onOpenChange(false)} /> : null}
    </ResponsiveDialog>
  );
}

function TaskForm({ task, lanes, onDone }: { task: TaskLike; lanes: LaneOption[]; onDone: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [laneId, setLaneId] = useState(task.laneId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const act = (action: () => Promise<{ ok: boolean; error?: string }>, message: string) =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error ?? null);
      toast(message);
      onDone();
    });

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const moved = laneId !== task.laneId;
    const target = lanes.find((l) => l.id === laneId)?.name;
    act(() => updateTask(task.id, { title, notes, laneId }), moved ? `Movida al final de ${target}` : "Tarea guardada");
  };

  return (
    <form onSubmit={save} className="grid gap-4 pt-2">
      <div className="grid gap-2">
        <Label htmlFor="task-title">Tarea</Label>
        <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={500} className="h-10 text-base" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="task-notes">Descripción</Label>
        <Textarea id="task-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" rows={3} className="text-base" />
      </div>
      <div className="grid gap-2">
        <Label>Carril</Label>
        <LanePicker lanes={lanes} value={laneId} onChange={setLaneId} name="task-lane" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => act(() => moveTaskToEdge(task.id, "start"), "Subió a la primera")}>
          <ArrowUpToLineIcon />
          Subir a primera
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => act(() => moveTaskToEdge(task.id, "end"), "Mandada al final")}>
          <ArrowDownToLineIcon />
          Mandar al final
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        {confirmDelete ? (
          <Button type="button" variant="destructive" disabled={pending} onClick={() => act(() => deleteTask(task.id), "Tarea eliminada")}>
            Confirmar: eliminar
          </Button>
        ) : (
          <Button type="button" variant="outline" className="text-destructive" disabled={pending} onClick={() => setConfirmDelete(true)}>
            <Trash2Icon />
            Eliminar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
