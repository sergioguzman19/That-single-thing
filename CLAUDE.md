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
Next.js (App Router) + TypeScript + Tailwind v4. Base de datos y auth: Supabase (pendiente). Idioma de la UI: español.
