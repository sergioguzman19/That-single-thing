import { cn } from "cn";

type Props = {
  eyebrow: string;
  title: string;
  notes?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Firma: la tarea única vive dentro de un arco. Luz tenue de patio adentro,
 * fondo blanco afuera. Solo debe existir una por pantalla.
 */
export function PortalCard({ eyebrow, title, notes, meta, actions, className }: Props) {
  return (
    <article
      className={cn(
        "arch flex flex-col items-center bg-portal px-6 pt-16 pb-6 text-center ring-1 ring-portal-edge ring-inset",
        className,
      )}
    >
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-3 text-[1.75rem] leading-[1.12] text-foreground sm:text-4xl">{title}</h2>
      {notes ? <p className="mt-3 max-w-prose text-sm text-muted-foreground">{notes}</p> : null}
      {meta ? <div className="mt-3 text-xs text-muted-foreground">{meta}</div> : null}
      {actions ? <div className="mt-8 flex w-full gap-2 [&>*]:flex-1">{actions}</div> : null}
    </article>
  );
}
