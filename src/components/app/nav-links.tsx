"use client";

import { CalendarRangeIcon, CircleDotIcon, Rows3Icon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export const SECTIONS = [
  { href: "/", label: "Ahora", icon: CircleDotIcon },
  { href: "/carriles", label: "Carriles", icon: Rows3Icon },
  { href: "/semana", label: "Semana", icon: CalendarRangeIcon },
] as const;

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

/** Pestañas en el encabezado (escritorio). */
export function TopNav() {
  const path = usePathname();
  return (
    <nav aria-label="Secciones" className="hidden items-center gap-1 md:flex">
      {SECTIONS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(path, href) ? "page" : undefined}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Barra inferior (celular), respetando el área segura del iPhone. */
export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {SECTIONS.map(({ href, label, icon: Icon }) => {
        const active = isActive(path, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 pt-2.5 pb-2 text-[0.7rem] transition-colors duration-150",
              active ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className={cn("size-5", active && "text-maya")} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
