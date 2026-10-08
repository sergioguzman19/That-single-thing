import type { Metadata } from "next";
import { LaneList } from "@/components/lanes/lane-list";
import { LaneView } from "@/components/lanes/lane-view";
import { toSummaries } from "@/components/lanes/summaries";
import { getBoard, MAX_LANES } from "@/lib/data/lanes";

export const metadata: Metadata = { title: "Carriles · That Single Thing" };

export default async function CarrilesPage() {
  const board = await getBoard();
  const first = board.lanes[0];
  return (
    <>
      {/* Celular: la lista completa. */}
      <div className="grid gap-4 md:hidden">
        <header className="grid gap-1">
          <h1 className="text-3xl">Carriles</h1>
          <p className="text-sm text-muted-foreground">
            {board.lanes.length} de {MAX_LANES} · el orden de cada cola es su prioridad
          </p>
        </header>
        <LaneList lanes={toSummaries(board)} max={MAX_LANES} />
      </div>
      {/* Escritorio: la lista vive a la izquierda; aquí se abre el primer carril. */}
      <div className="hidden md:block">
        {first ? (
          <LaneView lane={first} board={board} back={false} />
        ) : (
          <p className="text-muted-foreground">Crea tu primer carril a la izquierda.</p>
        )}
      </div>
    </>
  );
}
