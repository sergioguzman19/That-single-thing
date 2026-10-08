"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** Botón de captura. Siempre a mano: abajo a la derecha en el celular, también en escritorio. */
export function CaptureButton() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon-lg"
          aria-label="Capturar tarea"
          className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 size-14 rounded-full shadow-lg md:right-8 md:bottom-8"
        >
          <PlusIcon className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-xl rounded-t-xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl font-normal">Capturar tarea</SheetTitle>
          <SheetDescription>
            Aquí vas a escribir una tarea y escoger su carril en tres segundos. Llega con la próxima actualización.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
