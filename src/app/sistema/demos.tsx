"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Button variant="outline" size="sm" onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark ? <SunIcon /> : <MoonIcon />}
      {dark ? "Ver en claro" : "Ver en oscuro"}
    </Button>
  );
}

export function ToastDemo() {
  return (
    <Button variant="outline" onClick={() => toast("Hecho. Sube la siguiente de Concejo.")}>
      Mostrar aviso
    </Button>
  );
}
