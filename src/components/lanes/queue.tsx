"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, PlusIcon } from "lucide-react";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { createTask, reorderTask } from "@/lib/actions/tasks";
import { TaskDialog } from "./task-dialog";

export type QueueTask = {
  id: string;
  laneId: string;
  title: string;
  notes: string;
  ageDays: number;
  aging: boolean;
  startedAt: string | null;
};

type LaneOption = { id: string; name: string; color: string };

const ageLabel = (d: number) => (d === 0 ? "hoy" : d === 1 ? "1 día" : `${d} días`);

/** La cola de un carril: ordenar arrastrando (6 puntos), tocar para editar, añadir abajo. */
export function Queue({ lane, tasks, lanes }: { lane: LaneOption; tasks: QueueTask[]; lanes: LaneOption[] }) {
  const [optimistic, setOptimistic] = useOptimistic(tasks);
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<QueueTask | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = optimistic.findIndex((t) => t.id === active.id);
    const to = optimistic.findIndex((t) => t.id === over.id);
    const next = arrayMove(optimistic, from, to);
    const before = next[to - 1]?.id ?? null;
    const after = next[to + 1]?.id ?? null;
    startTransition(async () => {
      setOptimistic(next);
      const result = await reorderTask(String(active.id), before, after);
      if (!result.ok) toast.error(result.error);
    });
  };

  return (
    <div className="grid gap-3">
      {optimistic.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {lane.name} no tiene tareas. Escribe la primera abajo.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={onDragEnd}>
          <SortableContext items={optimistic.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <ol className="grid gap-1.5" aria-label={`Cola de ${lane.name}`}>
              {optimistic.map((task, i) => (
                <SortableRow key={task.id} task={task} index={i} onOpen={() => setEditing(task)} />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <QuickAdd lane={lane} />
      <TaskDialog task={editing} lanes={lanes} onOpenChange={(o) => !o && setEditing(null)} />
    </div>
  );
}

function SortableRow({ task, index, onOpen }: { task: QueueTask; index: number; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const head = index === 0;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "relative flex items-center gap-3 rounded-lg border bg-background py-2.5 pr-1 pl-3",
        head && "border-[var(--lane)] bg-portal",
        isDragging && "z-10 border-maya shadow-lg",
      )}
    >
      <span className="w-4 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{index + 1}</span>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-3 focus-visible:after:ring-ring/50">
        <span className="line-clamp-2 text-sm font-medium [overflow-wrap:anywhere]">{task.title}</span>
        {task.notes ? <span className="block truncate text-xs text-muted-foreground">{task.notes}</span> : null}
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-muted-foreground">
          {task.aging ? (
            <span className="rounded-full border border-aging px-1.5 leading-4 text-aging">Rezagada · {ageLabel(task.ageDays)}</span>
          ) : (
            <span>{task.ageDays === 0 ? "Desde hoy" : `${ageLabel(task.ageDays)} en cola`}</span>
          )}
          {task.startedAt ? <span className="font-medium text-maya-ink">En curso</span> : null}
        </span>
      </button>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Mover "${task.title}"`}
        className="relative z-10 grid h-10 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-5" />
      </button>
    </li>
  );
}

function QuickAdd({ lane }: { lane: LaneOption }) {
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await createTask({ laneId: lane.id, title });
      if (!result.ok) return void toast.error(result.error);
      setTitle("");
      input.current?.focus();
    });
  };

  return (
    <form onSubmit={submit} className="relative">
      <PlusIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        ref={input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={`Añadir a ${lane.name}…`}
        aria-label={`Nueva tarea para ${lane.name}`}
        maxLength={500}
        disabled={pending}
        enterKeyHint="done"
        className="h-11 pl-9 text-base"
      />
    </form>
  );
}
