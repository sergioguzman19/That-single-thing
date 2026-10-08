import type { Metadata } from "next";
import { NowView } from "@/components/now/now-view";
import { getNowState } from "@/lib/data/now";

export const metadata: Metadata = { title: "Ahora · That Single Thing" };

export default async function AhoraPage() {
  const state = await getNowState();
  return <NowView state={state} />;
}
