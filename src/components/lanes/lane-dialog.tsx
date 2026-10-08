"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/app/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLane, updateLane } from "@/lib/actions/lanes";
import { LANE_COLORS } from "@/lib/lanes";
import { ColorPicker } from "./color-picker";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sin carril: crear. Con carril: editar nombre y color. */
  lane?: { id: string; name: string; color: string };
  usedColors: string[];
};

export function LaneDialog({ open, onOpenChange, lane, usedColors }: Props) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={lane ? "Editar carril" : "Nuevo carril"}>
      {/* key: el formulario arranca limpio cada vez que se abre */}
      {open ? <LaneForm key={lane?.id ?? "new"} lane={lane} usedColors={usedColors} onDone={() => onOpenChange(false)} /> : null}
    </ResponsiveDialog>
  );
}

function LaneForm({ lane, usedColors, onDone }: { lane?: Props["lane"]; usedColors: string[]; onDone: () => void }) {
  const firstFree = LANE_COLORS.find((c) => !usedColors.includes(c.id))?.id ?? LANE_COLORS[0].id;
  const [name, setName] = useState(lane?.name ?? "");
  const [color, setColor] = useState(lane?.color ?? firstFree);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = lane ? await updateLane(lane.id, { name, color }) : await createLane({ name, color });
      if (!result.ok) return setError(result.error);
      toast(lane ? "Carril actualizado" : `Carril ${name.trim()} creado`);
      onDone();
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4 pt-2">
      <div className="grid gap-2">
        <Label htmlFor="lane-name">Nombre</Label>
        <Input
          id="lane-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Por ejemplo: Familia"
          maxLength={60}
          autoFocus
          className="h-10 text-base"
        />
      </div>
      <div className="grid gap-2">
        <Label>Color</Label>
        <ColorPicker value={color} onChange={setColor} used={usedColors.filter((c) => c !== lane?.color)} />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="h-10" disabled={pending}>
        {pending ? "Guardando…" : lane ? "Guardar" : "Crear carril"}
      </Button>
    </form>
  );
}
