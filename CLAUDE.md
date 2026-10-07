@AGENTS.md

# That Single Thing

Web app responsiva: varios carriles (frentes de vida) con colas de tareas que convergen en **una sola tarea a la vez**.

## Principios (no negociables)
- **Una sola cosa visible.**
- **Línea de producción, no calendario:** la fábrica es la atención, los carriles son los insumos. **Nunca fechas límite**, ni prioridad/urgencia como campos.
- **La cola manda:** la prioridad es solo el orden manual; siempre sube la primera de la cola.

## Modelo
- **Carril**: frente de vida creado por el usuario (máximo 6). Nombre, color (uno de 7) y una cola ordenada.
- **Rezagada**: tarea con `profiles.aging_days` (7) o más días en cola. Informativa, no cambia el orden. (Antes se llamaba "pudriéndose".)
- **Bloque**: rango de minutos en un día de la semana (hora local del perfil) asignado a un carril. En la UI, franjas ajustables.
- **Single thing**, reglas completas en `docs/ROADMAP.md`:
  - Bloque programado → despacha su carril.
  - Bloque abierto (sin programación) → el usuario escoge qué carril despacha.
  - Fuera del plan → tocar otro carril durante un bloque programado.
  - El foco dura hasta el siguiente bloque programado o el fin del día. Se registra en `focus_events`.
  - Tarea sin terminar al acabar el bloque → se pregunta; si no se terminó, sigue de primera en su carril.
  - El motor de despacho es una función pura con hora + zona horaria; nunca calcular "ahora" en el servidor.

## Acceso
- Solo con invitación: registro público apagado; usuarios creados desde el panel de Supabase. Login por código OTP de 6 dígitos (`src/app/entrar`).
- Sesión: `src/proxy.ts` redirige de forma optimista; la verificación real es `requireUser()` / `getUser()` en `src/lib/auth.ts`, llamada cerca de los datos (`src/lib/data`).
- Configuración de auth en `supabase/config.toml` → `npx supabase config diff` y `config push`.

## Plan y ciclo
- Plan auditado, fases y definición de terminado: `docs/ROADMAP.md`.
- Una rama por fase (`fase-N`), PR con CI en verde, aprobación del usuario y luego merge a `main` (producción).
- `npm run check` = typecheck + lint + pruebas (Vitest) + build.
- Un solo proyecto de Supabase: toda migración debe ser compatible con el código de `main`. Después de migrar, `npm run db:types`.

## Referencias
- Prototipo conceptual (HTML único, reglas viejas): `docs/prototype/index.html`

## Stack
Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (radix-nova). Supabase (Postgres + auth, migraciones en `supabase/migrations`). Deploy: Vercel. Idioma de la UI: español.

## Diseño: "Portal sobre blanco"
- Sistema base shadcn/ui. **No editar `src/components/ui`**: la identidad entra por los tokens de `src/app/globals.css` y los componentes firma de `src/components/brand` (MergeLines, PortalCard).
- Fondo blanco puro, nunca crema ni blanco cálido. Un solo acento: azul maya (`maya`, y `maya-ink` para texto). Tinta "sombra verde". Ocre Izamal (`aging`) solo para tareas rezagadas.
- Tipografía: Marcellus (`font-heading`, títulos y la tarea), Hanken Grotesk (`font-sans`), Geist Mono (cifras). Utilidades `arch` y `eyebrow`.
- Colores de carril: `src/lib/lanes.ts` (`lane-*` tokens). Usarlos en líneas, puntos y bordes, no en fondos grandes.
- Referencia viva: ruta `/sistema`. Moodboard: `docs/identity/directions.html`.
