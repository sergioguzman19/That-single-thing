/** Resultado de una acción del servidor: ok, o un mensaje para mostrar a la persona. */
export type ActionResult = { ok: true } | { ok: false; error: string };

export const ok = (): ActionResult => ({ ok: true });
export const fail = (error: string): ActionResult => ({ ok: false, error });

export const GENERIC_ERROR = "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.";
