"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsDesktop } from "@/hooks/use-media-query";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
};

/** Panel inferior en el celular, diálogo centrado en escritorio. Mismo contenido. */
export function ResponsiveDialog({ open, onOpenChange, title, description, children }: Props) {
  const desktop = useIsDesktop();
  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-normal">{title}</DialogTitle>
            <DialogDescription className={description ? undefined : "sr-only"}>{description ?? title}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] gap-0 overflow-y-auto rounded-t-2xl pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl font-normal">{title}</SheetTitle>
          <SheetDescription className={description ? undefined : "sr-only"}>{description ?? title}</SheetDescription>
        </SheetHeader>
        <div className="px-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
