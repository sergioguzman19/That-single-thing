@AGENTS.md

# That Single Thing

Web app responsiva: varios carriles (frentes de vida) con colas de tareas que convergen en **una sola tarea a la vez**.

## Modelo
- **Carril**: frente de vida creado por el usuario (Concejo, Clientes, Empresa, Personal, Hyrox…). Tiene nombre, color y una cola ordenada.
- **Cola**: la prioridad es solo el orden manual. Sin campos de prioridad/urgencia. Una tarea con 7+ días en cola está "pudriéndose".
- **Bloque**: franja de la semana (día × mañana/tarde/noche) asignada a un carril. Durante el bloque, sube la primera tarea de ese carril.
- **Single thing**: la única tarea visible. Reglas:
  - Override manual: el usuario toca otro carril → "fuera del plan" hasta volver o cambiar de bloque.
  - Sin bloque → modo libre: sube la tarea más vieja de todos los carriles.
  - Bloque con carril vacío → ofrecer traer la más vieja de otro carril.
  - Tarea no terminada al acabar el bloque → sigue de primera en su carril ("en curso").
  - Al capturar se puede saltar la fila (poner de primera).

## Referencias
- Prototipo conceptual (HTML único): `docs/prototype/index.html`

## Stack
Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (radix-nova). Supabase (Postgres + auth, migraciones en `supabase/migrations`). Deploy: Vercel. Idioma de la UI: español.

## Diseño: "Portal sobre blanco"
- Sistema base shadcn/ui. **No editar `src/components/ui`**: la identidad entra por los tokens de `src/app/globals.css` y los componentes firma de `src/components/brand` (MergeLines, PortalCard).
- Fondo blanco puro, nunca crema ni blanco cálido. Un solo acento: azul maya (`maya`, y `maya-ink` para texto). Tinta "sombra verde". Ocre Izamal (`rot`) solo para tareas pudriéndose.
- Tipografía: Marcellus (`font-heading`, títulos y la tarea), Hanken Grotesk (`font-sans`), Geist Mono (cifras). Utilidades `arch` y `eyebrow`.
- Colores de carril: `src/lib/lanes.ts` (`lane-*` tokens). Usarlos en líneas, puntos y bordes, no en fondos grandes.
- Referencia viva: ruta `/sistema`. Moodboard: `docs/identity/directions.html`.
