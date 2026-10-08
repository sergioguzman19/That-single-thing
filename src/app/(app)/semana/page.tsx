import type { Metadata } from "next";
import { WeekView } from "@/components/week/week-view";
import { getWeek } from "@/lib/data/week";

export const metadata: Metadata = { title: "Semana · That Single Thing" };

export default async function SemanaPage() {
  const state = await getWeek();
  return <WeekView state={state} />;
}
