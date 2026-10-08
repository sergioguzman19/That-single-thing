import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Semana · That Single Thing" };

export default async function SemanaPage() {
  await requireUser();
  return (
    <div className="grid gap-2">
      <h1 className="text-3xl">Semana</h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        Aquí vas a asignar cada franja de la semana a un carril. Cuando llegue el bloque, su primera tarea sube sola.
      </p>
    </div>
  );
}
