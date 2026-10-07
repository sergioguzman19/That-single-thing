"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setTheme, useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const theme = useTheme();
  const dark = theme === "dark";
  return (
    <Button variant="outline" size="sm" disabled={!theme} onClick={() => setTheme(dark ? "light" : "dark")}>
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
