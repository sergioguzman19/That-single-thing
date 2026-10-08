import { LaneList } from "@/components/lanes/lane-list";
import { toSummaries } from "@/components/lanes/summaries";
import { getBoard, MAX_LANES } from "@/lib/data/lanes";

/** En escritorio: carriles a la izquierda, contenido a la derecha. En el celular: una pantalla a la vez. */
export default async function CarrilesLayout({ children }: LayoutProps<"/carriles">) {
  const board = await getBoard();
  return (
    <div className="md:grid md:grid-cols-[17rem_minmax(0,1fr)] md:gap-8">
      <aside className="hidden md:block">
        <p className="eyebrow mb-3">
          {board.lanes.length} de {MAX_LANES} carriles
        </p>
        <LaneList lanes={toSummaries(board)} max={MAX_LANES} compact />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
