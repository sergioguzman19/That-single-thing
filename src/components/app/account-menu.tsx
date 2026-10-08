"use client";

import { BellIcon, BellOffIcon, LogOutIcon, PaletteIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { signOut } from "@/app/entrar/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePush } from "@/hooks/use-push";

export function AccountMenu({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase() || "·";
  const push = usePush();

  const togglePush = async () => {
    if (push.state === "on") {
      await push.disable();
      toast("Avisos desactivados en este dispositivo");
      return;
    }
    const result = await push.enable();
    if (result.ok) toast("Avisos activados en este dispositivo");
    else toast.error(result.error);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full font-heading" aria-label="Tu cuenta">
          {initial}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {push.state !== "unsupported" ? (
          <DropdownMenuItem disabled={push.state === "loading" || push.state === "denied"} onSelect={() => void togglePush()}>
            {push.state === "on" ? <BellOffIcon /> : <BellIcon />}
            {push.state === "on" ? "Desactivar avisos" : push.state === "denied" ? "Avisos bloqueados en el navegador" : "Activar avisos"}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href="/sistema">
            <PaletteIcon />
            Sistema de diseño
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => signOut()}>
          <LogOutIcon />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
