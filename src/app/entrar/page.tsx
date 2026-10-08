import type { Metadata } from "next";
import { UmbralMark } from "@/components/brand/umbral-mark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · That Single Thing" };

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { enlace } = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-10 px-4 py-12">
      <header className="grid justify-items-center gap-5 text-center">
        <UmbralMark className="size-14" />
        <span className="eyebrow">That Single Thing</span>
        <h1 className="text-4xl leading-tight">Una sola cosa a la vez.</h1>
        <p className="text-muted-foreground">Entra con tu correo. Te enviamos un código.</p>
      </header>
      {enlace === "invalido" ? (
        <p role="alert" className="-mb-4 text-center text-sm text-destructive">
          El enlace ya no sirve o se abrió en otro navegador. Pide un código nuevo.
        </p>
      ) : null}
      <LoginForm />
      <p className="text-center text-xs text-muted-foreground">Acceso solo por invitación.</p>
    </main>
  );
}
