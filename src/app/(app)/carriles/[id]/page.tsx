import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LaneView } from "@/components/lanes/lane-view";
import { getBoard } from "@/lib/data/lanes";

export async function generateMetadata({ params }: PageProps<"/carriles/[id]">): Promise<Metadata> {
  const { id } = await params;
  const lane = (await getBoard()).lanes.find((l) => l.id === id);
  return { title: `${lane?.name ?? "Carril"} · That Single Thing` };
}

export default async function CarrilPage({ params }: PageProps<"/carriles/[id]">) {
  const { id } = await params;
  const board = await getBoard();
  const lane = board.lanes.find((l) => l.id === id);
  if (!lane) notFound();
  return <LaneView lane={lane} board={board} />;
}
