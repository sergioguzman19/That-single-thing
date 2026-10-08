import type { Metadata } from "next";
import { MergeLines } from "@/components/brand/merge-lines";
import { PortalCard } from "@/components/brand/portal-card";
import { getLanes } from "@/lib/data/lanes";
import { laneVar } from "@/lib/lanes";

export const metadata: Metadata = { title: "Ahora · That Single Thing" };

export default async function AhoraPage() {
  const lanes = await getLanes();

  if (lanes.length === 0) {
    return (
      <div className="mx-auto w-full max-w-md pt-6">
        <PortalCard
          eyebrow="Bienvenido"
          title="Todavía no tienes carriles."
          notes="Los carriles son los frentes de tu vida. Crearlos llega con la próxima actualización."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <span className="eyebrow">Ahora</span>
      <div className="mt-3 grid gap-1 text-center text-[0.7rem]" style={{ gridTemplateColumns: `repeat(${lanes.length}, minmax(0, 1fr))` }}>
        {lanes.map((lane) => (
          <span key={lane.id} className="truncate border-b py-1.5 text-muted-foreground" style={{ borderBottomColor: laneVar(lane.color) }}>
            {lane.name}
          </span>
        ))}
      </div>
      <MergeLines lanes={lanes} />
      <PortalCard
        eyebrow="Muy pronto"
        title="Aquí vivirá tu única tarea."
        notes="Tus carriles ya están listos. Cuando captures tareas, la primera del carril que toque va a subir a este arco."
      />
    </div>
  );
}
