"use client";

import { RotateCcwIcon } from "lucide-react";
import { useRef, useState } from "react";
import { MergeLines } from "@/components/brand/merge-lines";
import { PortalCard } from "@/components/brand/portal-card";
import { Button } from "@/components/ui/button";
import { laneVar } from "@/lib/lanes";
import { MOTION, prefersReducedMotion } from "@/lib/motion";

const LANES = [
  { id: "concejo", name: "Concejo", color: "maya" },
  { id: "clientes", name: "Clientes", color: "flamboyan" },
  { id: "empresa", name: "Empresa", color: "anil" },
  { id: "personal", name: "Personal", color: "patio" },
  { id: "hyrox", name: "Hyrox", color: "izamal" },
];

const QUEUES: Record<string, { title: string; notes: string; days: number }[]> = {
  concejo: [
    { title: "Revisar el proyecto de acuerdo de presupuesto 2027", notes: "Marcar artículos con riesgo jurídico y preparar observaciones para la comisión.", days: 10 },
    { title: "Concepto jurídico sobre la ponencia de movilidad", notes: "Validar la competencia del Concejo y los antecedentes normativos.", days: 4 },
    { title: "Preparar la intervención para la plenaria", notes: "Guion de cinco minutos con tres argumentos y cifras de soporte.", days: 2 },
  ],
  clientes: [
    { title: "Propuesta comercial para el cliente nuevo", notes: "Alcance, cronograma y precio. Enviar antes del viernes.", days: 8 },
    { title: "Informe mensual de resultados", notes: "Consolidar métricas de septiembre y recomendaciones.", days: 3 },
  ],
  empresa: [
    { title: "Conciliación contable de septiembre", notes: "Cruzar extractos bancarios con facturación y gastos.", days: 9 },
    { title: "Renovar el contrato de arriendo", notes: "Comparar condiciones y negociar el incremento.", days: 5 },
  ],
  personal: [{ title: "Agendar el chequeo médico anual", notes: "", days: 12 }],
  hyrox: [
    { title: "Intervalos: 8 × 1 km con wall balls", notes: "Ritmo objetivo de carrera y 20 wall balls entre series.", days: 1 },
    { title: "Inscripción a la próxima competencia", notes: "Revisar categoría y fecha límite.", days: 3 },
  ],
};

type Phase = "idle" | "dispatching" | "arriving";

export function MotionDemo() {
  const [laneId, setLaneId] = useState("concejo");
  const [index, setIndex] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [nonce, setNonce] = useState(0);
  const timers = useRef<number[]>([]);

  const queue = QUEUES[laneId];
  const i = (index[laneId] ?? 0) % queue.length;
  const task = queue[i];
  const lane = LANES.find((l) => l.id === laneId)!;
  const aging = task.days >= 7;

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const done = () => {
    if (phase === "dispatching") return;
    clearTimers();
    const reduced = prefersReducedMotion();
    const out = reduced ? MOTION.quick : MOTION.dispatch;
    setPhase("dispatching");
    timers.current.push(
      window.setTimeout(() => {
        setIndex((prev) => ({ ...prev, [laneId]: (prev[laneId] ?? 0) + 1 }));
        setPhase("arriving");
      }, out),
      window.setTimeout(() => setPhase("idle"), reduced ? out : MOTION.glow),
    );
  };

  const switchLane = (id: string) => {
    if (id === laneId) return;
    clearTimers();
    setPhase("idle");
    setLaneId(id);
  };

  const replay = () => {
    clearTimers();
    setPhase("idle");
    setNonce((n) => n + 1);
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">Martes · Mañana · {lane.name}</span>
        <Button variant="ghost" size="icon-sm" onClick={replay} aria-label="Repetir la llegada">
          <RotateCcwIcon />
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[0.7rem]">
        {LANES.map((l) => {
          const on = l.id === laneId;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => switchLane(l.id)}
              aria-pressed={on}
              className="truncate border-b py-1.5 text-muted-foreground transition-colors duration-150 hover:text-foreground aria-pressed:border-b-2 aria-pressed:font-semibold aria-pressed:text-foreground"
              style={on ? { borderBottomColor: laneVar(l.color) } : undefined}
            >
              {l.name}
            </button>
          );
        })}
      </div>
      <MergeLines key={`${laneId}-${nonce}`} lanes={LANES} activeId={laneId} />
      <PortalCard
        taskKey={`${laneId}-${i}-${nonce}`}
        state={phase}
        eyebrow={`${lane.name} · ${i + 1} de ${queue.length}`}
        title={task.title}
        notes={task.notes || undefined}
        meta={
          <span className={aging ? "text-aging" : undefined}>
            {aging ? "● Rezagada: " : "En cola hace "}
            {task.days} {task.days === 1 ? "día" : "días"}
          </span>
        }
        actions={
          <>
            <Button size="lg" onClick={done} disabled={phase === "dispatching"}>
              Hecho
            </Button>
            <Button size="lg" variant="outline" onClick={replay}>
              Empezar
            </Button>
          </>
        }
      />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Prueba: toca <b className="font-semibold text-foreground">Hecho</b> o cambia de carril arriba.
      </p>
    </div>
  );
}
