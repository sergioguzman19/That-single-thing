"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { useNow } from "@/hooks/use-now";
import { toast } from "sonner";
import { cn } from "cn";
import { CaptureDialog } from "@/components/app/capture-button";
import { MergeLines } from "@/components/brand/merge-lines";
import { PortalCard } from "@/components/brand/portal-card";
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
import { backToPlan, chooseLane, completeTask, markSeen, resolveCheck, setStarted, undoComplete } from "@/lib/actions/now";
import { moveTaskToEdge } from "@/lib/actions/tasks";
import type { NowState } from "@/lib/data/now";
import { dispatch } from "@/lib/dispatch";
import { laneVar } from "@/lib/lanes";
import { instantAt, localTime } from "@/lib/time";
import { nextBlockToday } from "@/lib/week";
import { MOTION, prefersReducedMotion } from "@/lib/motion";

/** Lo lee la captura (capture-button.tsx) para preseleccionar el carril que despacha. */
const DISPATCH_LANE_KEY = "tst.dispatchLane";
type Phase = "idle" | "dispatching" | "arriving";
/** Tiempo para deshacer un "Hecho" (y leer avisos importantes). */
const UNDO_MS = 10_000;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** La pantalla Ahora: el Merge, el arco y la tarea única. */
export function NowView({ state }: { state: NowState }) {
  const now = useNow();
  const router = useRouter();

  // Al volver a la app, trae los datos frescos (otro dispositivo pudo cambiar algo).
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  if (!now) return <NowSkeleton />;
  return <NowScreen state={state} now={now} />;
}

function NowSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md" aria-busy="true">
      <div className="h-4" />
      <div className="mt-3 h-8" />
      <div className="h-24" />
      <div className="arch h-80 bg-portal ring-1 ring-portal-edge ring-inset" />
    </div>
  );
}

function NowScreen({ state, now }: { state: NowState; now: Date }) {
  const { lanes, timeZone } = state;
  const [focus, setOptimisticFocus] = useOptimistic(state.focus);
  const [, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("idle");
  const [frozen, setFrozen] = useState<{ id: string; laneId: string } | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [checkDismissed, setCheckDismissed] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);

  const allTasks = useMemo(() => lanes.flatMap((l) => l.tasks), [lanes]);
  const d = dispatch({
    now,
    timeZone,
    lanes,
    tasks: allTasks,
    blocks: state.blocks,
    focus: focus ? { laneId: focus.laneId, until: new Date(focus.until) } : null,
  });

  // Mientras una tarea se despacha, se sigue mostrando ella (aunque ya llegaron datos nuevos).
  const shownId = phase === "dispatching" && frozen ? frozen.id : d.taskId;
  const task = allTasks.find((t) => t.id === shownId) ?? null;
  const lane = lanes.find((l) => l.id === (task?.laneId ?? d.laneId)) ?? null;
  const blockLane = d.block ? lanes.find((l) => l.id === d.block!.laneId) : null;

  // "¿Terminaste X?": el período de la última tarea única ya pasó y quedó empezada.
  const pendingCheck =
    !checkDismissed && state.last && new Date(state.last.periodEnd) <= now
      ? (allTasks.find((t) => t.id === state.last!.taskId && t.startedAt) ?? null)
      : null;

  // Recordar la tarea única de este período, y el carril que despacha (para la captura).
  const seenKey = d.taskId ? `${d.taskId}|${d.periodEnd.toISOString()}` : null;
  const lastSeenKey = state.last ? `${state.last.taskId}|${new Date(state.last.periodEnd).toISOString()}` : null;
  const marked = useRef<string | null>(null);
  useEffect(() => {
    try {
      if (d.laneId) localStorage.setItem(DISPATCH_LANE_KEY, d.laneId);
      else localStorage.removeItem(DISPATCH_LANE_KEY);
    } catch {}
  }, [d.laneId]);
  useEffect(() => {
    if (!seenKey || pendingCheck || seenKey === lastSeenKey || marked.current === seenKey) return;
    marked.current = seenKey;
    const [taskId, periodEnd] = seenKey.split("|");
    void markSeen(taskId, periodEnd);
  }, [seenKey, lastSeenKey, pendingCheck]);

  const fmtTime = (date: Date) => new Intl.DateTimeFormat("es-CO", { timeZone, hour: "numeric", minute: "2-digit" }).format(date);
  const weekday = new Intl.DateTimeFormat("es-CO", { timeZone, weekday: "long" }).format(now);
  // El período termina a medianoche cuando no quedan bloques hoy: se dice "el fin del día".
  const endLocal = localTime(d.periodEnd, timeZone);
  const endsAtMidnight = endLocal.minute === 0 && endLocal.day !== d.local.day;
  const endLabel = endsAtMidnight ? "el fin del día" : fmtTime(d.periodEnd);
  const untilLabel = endsAtMidnight ? "hasta el fin del día" : `hasta las ${endLabel}`;

  /**
   * Tocar un carril. Escoger en un bloque abierto sin carril, o volver al plan, es directo.
   * Cambiar de carril cuando ya hay uno despachando es cambiar el bloque completo: se confirma.
   */
  const pick = (laneId: string) => {
    if (phase !== "idle" || laneId === d.laneId) return;
    if (d.mode === "override" && laneId === d.block?.laneId) {
      startTransition(async () => {
        setOptimisticFocus(null);
        const r = await backToPlan();
        if (!r.ok) toast.error(r.error);
      });
      return;
    }
    if (d.mode === "choose") return switchTo(laneId);
    setPendingSwitch(laneId);
  };

  const switchTo = (laneId: string) => {
    const kind = d.block ? "override" : "open";
    startTransition(async () => {
      setOptimisticFocus({ laneId, until: d.periodEnd.toISOString() });
      const r = await chooseLane(laneId, kind);
      if (!r.ok) toast.error(r.error);
      else if (r.paused) toast(`Pausamos «${r.paused.title}». Sigue de primera en ${r.paused.laneName}.`, { duration: UNDO_MS });
    });
  };

  /** Despachar: la tarea se eleva, llega la siguiente de la cola y el arco respira. */
  const send = (action: () => Promise<{ ok: boolean; error?: string }>, message: string, undo?: () => Promise<unknown>) => {
    if (!task || phase !== "idle") return;
    const reduced = prefersReducedMotion();
    setFrozen({ id: task.id, laneId: task.laneId });
    setPhase("dispatching");
    startTransition(async () => {
      const [result] = await Promise.all([action(), wait(reduced ? MOTION.quick : MOTION.dispatch)]);
      setPhase("arriving");
      setFrozen(null);
      if (!result.ok) toast.error(result.error);
      else toast(message, undo ? { duration: UNDO_MS, action: { label: "Deshacer", onClick: () => void undo() } } : undefined);
      await wait(reduced ? 0 : MOTION.glow - MOTION.dispatch);
      setPhase("idle");
    });
  };

  const done = () => {
    if (!task) return;
    const id = task.id;
    send(() => completeTask(id), "Hecho", () => undoComplete(id));
  };
  const toBack = () => task && send(() => moveTaskToEdge(task.id, "end"), `Al final de ${lane?.name ?? "la cola"}`);
  const toggleStart = () => {
    if (!task) return;
    const id = task.id;
    const start = !task.startedAt;
    startTransition(async () => {
      const r = await setStarted(id, start);
      if (!r.ok) toast.error(r.error);
      else if (r.paused) toast(`Pausamos «${r.paused.title}». Sigue de primera en ${r.paused.laneName}.`, { duration: UNDO_MS });
      else toast(start ? "En curso. Si se acaba el bloque, sigue de primera." : "Pausada. Sigue de primera en su carril.");
    });
  };

  const next = nextBlockToday(state.blocks, d.local.weekday, d.local.minute);
  const queue = lane?.tasks ?? [];
  const inProgressHere = queue.find((t) => t.startedAt) ?? null;
  const position = task ? queue.findIndex((t) => t.id === task.id) + 1 : 0;
  // La que sube cuando esta se despache (solo si hay una tarea única ahora).
  const nextTask = task && phase === "idle" ? (queue[position] ?? null) : null;

  return (
    <div className="mx-auto w-full max-w-md md:max-w-lg">
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow">
          {weekday} · {fmtTime(now)}
        </span>
        {state.doneToday > 0 ? (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {state.doneToday} {state.doneToday === 1 ? "hecha" : "hechas"} hoy
          </span>
        ) : null}
      </div>

      {lanes.length === 0 ? (
        <div className="mt-8">
          <PortalCard eyebrow="Bienvenido" title="Todavía no tienes carriles." notes="Los carriles son los frentes de tu vida. Créalos en la sección Carriles." />
        </div>
      ) : (
        <>
          <div
            className="mt-3 grid gap-1 text-center text-[0.72rem]"
            style={{ gridTemplateColumns: `repeat(${lanes.length}, minmax(0, 1fr))` }}
            role="group"
            aria-label="Carriles"
          >
            {lanes.map((l) => {
              const active = l.id === d.laneId;
              const isBlock = l.id === d.block?.laneId;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => pick(l.id)}
                  aria-pressed={active}
                  aria-label={`${l.name}, ${l.tasks.length} en cola${isBlock ? ", carril del bloque" : ""}`}
                  className={cn(
                    "truncate border-b-2 py-2 text-muted-foreground transition-[color,opacity] duration-150 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-pressed:font-semibold aria-pressed:text-foreground",
                    // Con un carril despachando, los demás quedan en segundo plano: cambiar es cambiar el bloque.
                    d.laneId && !active && !isBlock && "opacity-50",
                  )}
                  style={{ borderBottomColor: active ? laneVar(l.color) : `color-mix(in oklch, ${laneVar(l.color)} 45%, transparent)` }}
                >
                  {l.name}
                </button>
              );
            })}
          </div>
          <MergeLines lanes={lanes} activeId={d.laneId} />

          {d.mode === "choose" ? (
            <PortalCard
              eyebrow={`Bloque abierto · ${untilLabel}`}
              title="¿Qué carril despacha?"
              notes="Escoge un carril. Su primera tarea sube a este arco."
              actions={
                <div className="grid w-full grid-cols-2 gap-2">
                  {lanes.map((l) => (
                    <Button key={l.id} variant="outline" className="justify-start" disabled={l.tasks.length === 0} onClick={() => pick(l.id)}>
                      <span className="size-2 rounded-full" style={{ background: laneVar(l.color) }} aria-hidden="true" />
                      <span className="truncate">{l.name}</span>
                      <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">{l.tasks.length}</span>
                    </Button>
                  ))}
                </div>
              }
            />
          ) : task ? (
            <PortalCard
              taskKey={task.id}
              state={phase}
              eyebrow={`${lane?.name ?? ""} · ${position} de ${queue.length}`}
              title={task.title}
              notes={task.notes || undefined}
              meta={
                <span className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                  <span className={task.aging ? "text-aging" : undefined}>
                    {task.aging ? "● Rezagada: " : "En cola "}
                    {task.ageDays === 0 ? "desde hoy" : `hace ${task.ageDays} ${task.ageDays === 1 ? "día" : "días"}`}
                  </span>
                  {task.startedAt ? <span className="font-medium text-maya-ink">En curso desde {fmtTime(new Date(task.startedAt))}</span> : null}
                </span>
              }
              actions={
                <div className="grid w-full gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="lg" className="h-11" onClick={done} disabled={phase !== "idle"}>
                      Hecho
                    </Button>
                    <Button size="lg" variant="outline" className="h-11" onClick={toggleStart} disabled={phase !== "idle"}>
                      {task.startedAt ? "Pausar" : "Empezar"}
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={toBack} disabled={phase !== "idle" || queue.length < 2}>
                    Mandar al final de la cola
                  </Button>
                </div>
              }
            />
          ) : (
            <PortalCard
              eyebrow={lane?.name ?? ""}
              title={`${lane?.name ?? "Este carril"} no tiene tareas.`}
              notes="Toca otro carril arriba o captura una tarea para este."
              actions={
                <Button size="lg" className="h-11" onClick={() => setCapturing(true)}>
                  Capturar para {lane?.name}
                </Button>
              }
            />
          )}

          <Hint mode={d.mode} laneName={lane?.name} blockLaneName={blockLane?.name} untilLabel={untilLabel} onBack={() => d.block && pick(d.block.laneId)} />
          {nextTask || next ? (
            <dl className="mx-auto mt-3 grid max-w-sm gap-1 text-center text-xs text-muted-foreground">
              {nextTask ? (
                <div>
                  <dt className="inline">Siguiente en {lane?.name}: </dt>
                  <dd className="inline font-medium text-foreground">{nextTask.title}</dd>
                </div>
              ) : null}
              {next ? (
                <div>
                  <dt className="inline">Siguiente bloque: </dt>
                  <dd className="inline">
                    <span className="font-medium text-foreground">{lanes.find((l) => l.id === next.laneId)?.name}</span> a las{" "}
                    {fmtTime(instantAt(d.local, next.startMinute, timeZone))}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </>
      )}

      <CaptureDialog
        open={capturing}
        onOpenChange={setCapturing}
        lanes={lanes.map(({ id, name, color }) => ({ id, name, color }))}
        initialLane={lane?.id ?? ""}
      />


      <AlertDialog open={Boolean(pendingSwitch)} onOpenChange={(open) => !open && setPendingSwitch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar el bloque completo a {lanes.find((l) => l.id === pendingSwitch)?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {d.mode === "open" ? "Estás en un bloque abierto con " : "Estás en el bloque de "}
              {lane?.name} {untilLabel}. Respetar el bloque es lo que protege tu concentración.
              {inProgressHere ? ` «${inProgressHere.title}» está en curso: quedaría pausada y de primera en ${lane?.name}.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setPendingSwitch(null)}>Seguir en {lane?.name}</AlertDialogAction>
            <AlertDialogCancel
              onClick={() => {
                const target = pendingSwitch!;
                setPendingSwitch(null);
                switchTo(target);
              }}
            >
              Cambiar el bloque
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(pendingCheck)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Terminaste «{pendingCheck?.title}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Era tu tarea única y la dejaste en curso. Si no la terminaste, sigue de primera en su carril y vuelve cuando le toque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                const id = pendingCheck!.id;
                setCheckDismissed(true);
                void resolveCheck(id, false);
              }}
            >
              No, sigue pendiente
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const id = pendingCheck!.id;
                setCheckDismissed(true);
                startTransition(async () => {
                  const r = await resolveCheck(id, true);
                  if (!r.ok) toast.error(r.error);
                  else toast("Hecho", { duration: UNDO_MS, action: { label: "Deshacer", onClick: () => void undoComplete(id) } });
                });
              }}
            >
              Sí, la terminé
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Hint({
  mode,
  laneName,
  blockLaneName,
  untilLabel,
  onBack,
}: {
  mode: ReturnType<typeof dispatch>["mode"];
  laneName?: string;
  blockLaneName?: string;
  untilLabel: string;
  onBack: () => void;
}) {
  const text = {
    scheduled: `Bloque de ${laneName} ${untilLabel} · Foco total en este frente`,
    override: `Cambiaste el bloque ${untilLabel} · Según el plan era de ${blockLaneName}`,
    open: `Bloque abierto: despacha ${laneName} ${untilLabel}`,
    choose: "",
  }[mode];
  if (!text) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-muted-foreground">
      <p>{text}</p>
      {mode === "override" ? (
        <Button variant="link" size="sm" className="h-auto px-0 text-xs" onClick={onBack}>
          Volver al plan
        </Button>
      ) : null}
    </div>
  );
}
