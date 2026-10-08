import { cn } from "cn";

/** El ícono Umbral como marca: arco en tinta y un punto azul maya. */
export function UmbralMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={cn("size-6", className)}>
      <path
        d="M27 90 V33 A23 23 0 0 1 73 33 V90 Z"
        className="fill-portal stroke-foreground"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <circle cx="50" cy="67" r="7.5" className="fill-maya" />
    </svg>
  );
}
