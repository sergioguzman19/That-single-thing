import type { Metadata } from "next";
import { getLanes } from "@/lib/data/lanes";
import { laneVar } from "@/lib/lanes";

export const metadata: Metadata = { title: "Carriles · That Single Thing" };

export default async function CarrilesPage() {
  const lanes = await getLanes();
  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="text-3xl">Carriles</h1>
        <p className="text-sm text-muted-foreground">Los frentes de tu vida. El orden de cada cola es su prioridad.</p>
      </header>
      {lanes.length === 0 ? (
        <p className="text-muted-foreground">Todavía no tienes carriles.</p>
      ) : (
        <ul className="grid gap-2">
          {lanes.map((lane) => (
            <li key={lane.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: laneVar(lane.color) }} aria-hidden="true" />
              <span className="font-medium">{lane.name}</span>
              <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
                {lane.queued} en cola
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted-foreground">Crear, editar y ordenar carriles y tareas llega con la próxima actualización.</p>
    </div>
  );
}
