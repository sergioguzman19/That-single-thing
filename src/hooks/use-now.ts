"use client";

import { useSyncExternalStore } from "react";

/**
 * Reloj compartido: la misma fecha para todos los componentes, actualizada cada 30 s
 * y al volver a la app. En el servidor y al hidratar es null: "ahora" solo existe en el cliente.
 */
let current: Date | null = null;
const listeners = new Set<() => void>();
let timer: number | undefined;

function tick() {
  current = new Date();
  listeners.forEach((listener) => listener());
}

function onVisible() {
  if (document.visibilityState === "visible") tick();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    timer = window.setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

const getSnapshot = () => (current ??= new Date());
const getServerSnapshot = () => null;

export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
