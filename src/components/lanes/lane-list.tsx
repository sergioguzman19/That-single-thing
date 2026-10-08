"use client";

import { ArrowDownIcon, ArrowUpIcon, ArchiveIcon, MoreHorizontalIcon, PencilIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { archiveLane, moveLane } from "@/lib/actions/lanes";
import { laneVar } from "@/lib/lanes";
import { LaneDialog } from "./lane-dialog";

export type LaneSummary = {
  id: string;
  name: string;
  color: string;
  count: number;
  agingCount: number;
  firstTitle: string | null;
};

type Props = { lanes: LaneSummary[]; max: number; compact?: boolean };

/**
 * Lista de carriles. Completa en el celular (con la primera tarea de cada cola);
 * compacta en la columna lateral del escritorio.
 */
export function LaneList({ lanes, max, compact = false }: Props) {
  const path = usePathname();
  const [editing, setEditing] = useState<LaneSummary | null>(null);
  const [creating, setCreating] = useState(false);
  const [archiving, setArchiving] = useState<LaneSummary | null>(null);
  const [pending, startTransition] = useTransition();
  const usedColors = lanes.map((l) => l.color);
  const full = lanes.length >= max;

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, success?: string) =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) toast.error(result.error);
      else if (success) toast(success);
    });

  return (
    <div className="grid gap-2">
      {lanes.map((lane, i) => {
        const selected = path === `/carriles/${lane.id}`;
        return (
          <div
            key={lane.id}
            className={cn(
              "group relative grid gap-1 rounded-lg border px-3 py-2.5 transition-colors duration-150 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50",
              selected ? "border-[var(--lane)] bg-portal" : "hover:bg-muted/60",
            )}
            style={{ "--lane": laneVar(lane.color) } as React.CSSProperties}
          >
            <div className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full bg-[var(--lane)]" aria-hidden="true" />
              <Link href={`/carriles/${lane.id}`} className="min-w-0 truncate font-semibold outline-none after:absolute after:inset-0">
                {lane.name}
              </Link>
              {lane.agingCount > 0 ? (
                <span className="shrink-0 rounded-full border border-aging px-1.5 text-[0.65rem] leading-4 text-aging">
                  {compact ? lane.agingCount : `${lane.agingCount} ${lane.agingCount === 1 ? "rezagada" : "rezagadas"}`}
                </span>
              ) : null}
              <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{lane.count}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="relative z-10 -mr-1.5" aria-label={`Opciones de ${lane.name}`}>
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditing(lane)}>
                    <PencilIcon />
                    Nombre y color
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={i === 0 || pending} onSelect={() => run(() => moveLane(lane.id, -1))}>
                    <ArrowUpIcon />
                    Subir
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={i === lanes.length - 1 || pending} onSelect={() => run(() => moveLane(lane.id, 1))}>
                    <ArrowDownIcon />
                    Bajar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setArchiving(lane)}>
                    <ArchiveIcon />
                    Archivar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {!compact ? (
              <p className="truncate pl-[1.125rem] text-sm text-muted-foreground">
                {lane.firstTitle ? (
                  <>
                    <span className="mr-1.5 font-mono text-xs">1</span>
                    <span className="text-foreground">{lane.firstTitle}</span>
                  </>
                ) : (
                  "Sin tareas"
                )}
              </p>
            ) : null}
          </div>
        );
      })}

      <Button
        variant="outline"
        className="h-10 border-dashed text-muted-foreground"
        disabled={full}
        onClick={() => setCreating(true)}
      >
        <PlusIcon />
        {full ? `Máximo ${max} carriles` : "Nuevo carril"}
      </Button>

      <LaneDialog open={creating} onOpenChange={setCreating} usedColors={usedColors} />
      <LaneDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} lane={editing ?? undefined} usedColors={usedColors} />

      <AlertDialog open={Boolean(archiving)} onOpenChange={(o) => !o && setArchiving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar {archiving?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Desaparece de tus carriles y de la semana. Sus {archiving?.count ?? 0} tareas se guardan y no se pierden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => archiving && run(() => archiveLane(archiving.id), `${archiving.name} archivado`)}
            >
              Archivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
