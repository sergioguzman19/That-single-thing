import { cn } from "cn";

type Props = {
  eyebrow: string;
  title: string;
  notes?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  /** Identidad de la tarea: al cambiar, el contenido se remonta y "llega". */
  taskKey?: string;
  /**
   * idle: en reposo. dispatching: la tarea se eleva y se disuelve.
   * arriving: la siguiente ya llegó y el arco termina de respirar luz.
   */
  state?: "idle" | "dispatching" | "arriving";
  className?: string;
};

/**
 * Firma: la tarea única vive dentro de un arco. Luz tenue de patio adentro,
 * fondo blanco afuera. Solo debe existir una por pantalla.
 *
 * Movimiento: el contenido llega al montarse (sube desde el umbral). Al despachar,
 * se eleva y se disuelve mientras el arco respira luz. El arco no se remonta:
 * solo cambia su contenido (taskKey). Coreografía completa en /sistema.
 */
export function PortalCard({ eyebrow, title, notes, meta, actions, taskKey, state = "idle", className }: Props) {
  const dispatching = state === "dispatching";
  const glowing = state !== "idle";
  return (
    <article
      className={cn(
        "arch bg-portal px-6 pt-16 pb-6 text-center ring-1 ring-portal-edge ring-inset",
        glowing && "animate-portal-glow",
        className,
      )}
    >
      <div
        key={taskKey}
        className={cn(
          "flex flex-col items-center",
          dispatching ? "animate-portal-dispatch pointer-events-none" : "animate-portal-arrive",
        )}
      >
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mt-3 text-[1.75rem] leading-[1.12] text-foreground sm:text-4xl">{title}</h2>
        {notes ? <p className="mt-3 max-w-prose text-sm text-muted-foreground">{notes}</p> : null}
        {meta ? <div className="mt-3 text-xs text-muted-foreground">{meta}</div> : null}
        {actions ? <div className="mt-8 flex w-full gap-2 [&>*]:flex-1">{actions}</div> : null}
      </div>
    </article>
  );
}
