# That Single Thing · Plan de implementación

Plan auditado el 2026-10-07. Es la fuente de verdad para el ciclo de desarrollo por fases.
Si una decisión cambia, se actualiza aquí y en `CLAUDE.md`.

## Principios del producto

1. **Una sola cosa visible.** Todo lo demás existe, pero no compite por la atención.
2. **Una línea de producción, no un calendario.** La fábrica es la atención; los carriles son los insumos. La línea recibe y saca. Programar fechas de entrega es otro proceso: **la app nunca tiene fechas límite**.
3. **La cola manda.** La prioridad es solo el orden manual de cada carril. Sin campos de prioridad ni urgencia.
4. **Decidir una vez, ejecutar siempre.** Los bloques deciden qué carril despacha; tú solo decides cuando el bloque está abierto o cuando te sales del plan.
5. **Respetar los bloques.** Un bloque es foco total en un frente, como hacen los directivos que llevan varias empresas. Cambiar de carril durante un bloque es cambiar el bloque completo, y se confirma.
6. **Flexible sin culpa.** Salirse del plan, dejar algo sin terminar o mandarlo al final es legítimo.

## Reglas del motor de despacho

El motor es una **función pura** (`src/lib/dispatch.ts`, fase 3): recibe hora actual, zona horaria del perfil, carriles, colas, bloques y foco; devuelve la tarea visible y el estado. Corre en el cliente. Cada regla tiene prueba.

| Situación | Qué carril despacha | Qué se ve |
|---|---|---|
| **Bloque programado** (viernes PM → Clientes) | El del bloque | La primera de su cola |
| **Bloque abierto** (sábado 3 pm, nada programado) | El que tú escojas | Antes de escoger: "Bloque abierto: ¿qué carril despacha?" |
| **Bloque cambiado** (en un bloque programado tocas otro carril y **confirmas** cambiar el bloque completo) | El nuevo | La primera de su cola, con opción "volver al plan" |
| **Carril del bloque vacío** | Ninguno hasta que decidas | Ofrece escoger otro carril o capturar |

- **Duración del foco** (fuera del plan o escogido en bloque abierto): hasta que empiece el siguiente bloque programado o termine el día, lo que llegue primero. Se guarda en `profiles.focus_lane_id` y `focus_until`, y cada foco se registra en `focus_events`.
- **Siempre la cabeza de la cola.** Ninguna regla sube una tarea que no sea la primera de su carril.
- **Tarea sin terminar al acabar el bloque:** antes de mostrar la tarea del siguiente bloque se pregunta "¿Terminaste X?". Si no, sigue de primera en su carril y vuelve a ser *that single thing* cuando le toque a ese carril, por programación o por decisión. En el MVP la pregunta sale al abrir la app; con notificaciones (fase 5), al terminar el bloque.
- **"En curso"** = la tarea ya se empezó (`started_at`). **Solo puede haber una en curso** (índice único en la base de datos): empezar otra pausa la anterior, que sigue de primera en su carril.
- **Rezagada:** tarea con N días o más en cola (N = `profiles.aging_days`, 7 por defecto, ajustable). Es informativa, no cambia el orden. El carril muestra cuántas rezagadas tiene.
- **Hora:** los bloques se guardan en minutos de la hora local del perfil (`profiles.timezone`). Nunca se calcula "ahora" en el servidor.

## Límites del modelo

- Máximo **6 carriles** activos (lo hace cumplir la base de datos). 7 colores disponibles.
- Bloques: en la base de datos, rangos libres en minutos. En la interfaz, franjas predefinidas (mañana, tarde, noche) que se pueden ajustar.
- Orden de la cola: `position` fraccionaria. Al final = máximo + 1; saltar la fila = mínimo − 1; mover entre dos = punto medio. Desempate por `created_at`.

## Fases

Cada fase se cierra con su **definición de terminado** (ver abajo) y tu aprobación desde el celular.

### Fase 0.5 · Base del ciclo ✅ (rama `fase-0.5`)
Plan auditado, reglas corregidas en `CLAUDE.md`, "pudriéndose" → "rezagada", migración de ajustes (`aging_days`, colores válidos, máximo 6 carriles, `focus_events`), Vitest, CI en GitHub Actions, Node 24 fijado.

### Fase 1 · Acceso (rama `fase-1`)
- **Solo con invitación.** No hay registro público (apagado en Supabase, `config.toml`). Los usuarios se crean desde el panel de Supabase (*Authentication → Users → Add user*). Un correo sin registrar ve "Este correo no está registrado" y no recibe nada (`shouldCreateUser: false`).
- Login con **código de 6 dígitos por correo** (OTP, vence en 10 minutos, reenvío cada 60 s). Motivo: en iPhone, la app instalada no comparte sesión con Safari.
- **Correo propio (SMTP):** el plan gratis de Supabase no deja cambiar la plantilla con su correo por defecto, y la plantilla por defecto no trae el código. Se configura un SMTP (Resend) y luego la plantilla `supabase/templates/codigo.html`. También sube el límite de envíos.
- Configuración de auth versionada en `supabase/config.toml` y aplicada con `supabase config push`: Site URL de producción, Redirect URLs, registro apagado, OTP de 6 dígitos.
- Rutas protegidas (proxy + `requireUser()` cerca de los datos), cerrar sesión, portada = pantalla de entrada.
- Esqueleto de la app: Ahora · Carriles · Semana (barra inferior en el celular, pestañas en escritorio), menú de cuenta y botón de captura.
- Los carriles de un usuario nuevo **no** se crean solos: los de Sergio se cargan al registrarlo; un usuario nuevo los crea en la fase 2.
- **Aceptación:** entras con el código desde el iPhone (app instalada) y desde el computador; sin sesión no ves nada; un correo no registrado no entra.

### Fase 2 · Carriles y captura
- Carriles: crear, renombrar, cambiar color, reordenar, archivar (máximo 6).
- Captura rápida con **+**: título, descripción opcional, carril, "saltar la fila".
- Cola: arrastrar para ordenar (y flechas como alternativa accesible), **editar tarea**, **mover a otro carril**, eliminar.
- Rezagadas: indicador en la tarea y conteo por carril.
- **Aceptación:** vacías todos tus pendientes reales en la app desde el celular en pocos minutos.

### Fase 3 · Ahora
- Motor de despacho (función pura con pruebas de cada regla de la tabla).
- Pantalla Ahora: Merge + Portal + movimiento del sistema de diseño.
- Hecho (con **deshacer**), Empezar, Mandar al final, tocar otro carril (fuera del plan), escoger carril en bloque abierto, "volver al plan".
- Pregunta "¿Terminaste X?" al cambiar de bloque. Contador de hechas hoy.
- **Aceptación:** la usas un día completo solo con esta pantalla.

### Fase 4 · Semana (rama `fase-4`)
- Editor de bloques: carril, franjas rápidas (**mañana 8–12, tarde 13–17, noche 18–21**), ajuste en pasos de 15 min y **días en que se repite** (cada día queda como bloque independiente).
- Cruces: la app dice con qué bloque choca antes de guardar; la base de datos lo garantiza igual.
- Celular: pestañas por día con la línea de tiempo del día (bloques y huecos abiertos). Escritorio: semana completa con la línea de ahora; clic en un hueco o "Nuevo bloque".
- Balance de horas por carril. En Ahora: "Sigue: X a las HH:MM".
- Archivar un carril quita sus bloques.
- **Aceptación:** configuras tu semana real y el siguiente bloque programado despacha solo.

### Fase 5 · Avisos (rama `fase-5`)
Solo los avisos de mayor retorno (decidido con Sergio; cada aviso de más gasta atención):
1. **Terminó un bloque y su tarea sigue abierta** → "¿Terminaste X?" con botones Sí/No (Android; en iOS se abre la app).
2. **Empieza un bloque abierto entre dos bloques** → escoger qué carril despacha. Bloques pegados o después del último bloque del día: no se avisa.
3. **Una tarea se volvió rezagada** → una vez por tarea, agrupadas, solo de 8:00 a 21:00 locales.

Cómo funciona: `pg_cron` corre cada **2 minutos** dentro de la base de datos y **solo llama a la app (pg_net) cuando hay algo que avisar** (≈5–10 llamadas al día). La URL y el secreto viven en Supabase Vault. El endpoint `/api/notifications/tick` (protegido con `CRON_SECRET`) arma los avisos con `planNotifications` (función pura con pruebas), los deduplica en `notification_log` y los envía por Web Push a todos los dispositivos activados. Se activan desde el menú de cuenta.

Pendiente para después: funcionamiento sin conexión.

### Fase 6 · Producto
- Ajustes: días para rezagada, zona horaria. Historial de hechas. Exportar mis datos.
- Antes de abrir a más gente: SMTP propio (p. ej. Resend), repo privado y licencia, plan de Vercel (Hobby no permite uso comercial) y de Supabase (el gratis se pausa tras 7 días sin uso y no tiene backups).

## Ciclo por fase

1. Plan corto de la fase: alcance, criterios de aceptación, casos borde.
2. Rama `fase-N` desde `main`.
3. Construir. Las migraciones van en `supabase/migrations` y luego se regeneran los tipos (`npm run db:types`).
4. Verificar: `npm run check` (typecheck, lint, pruebas, build) + revisión visual en celular y escritorio, claro y oscuro.
5. Pull request → CI en verde → URL de prueba de Vercel → la pruebas en el celular.
6. Con tu aprobación: unir a `main` → producción.
7. Actualizar este documento, `CLAUDE.md` y `/sistema` si algo cambió.

**Ojo:** hay un solo proyecto de Supabase. Una migración aplicada desde una rama afecta producción, así que las migraciones deben ser compatibles con el código que está en `main`.

## Métricas de éxito (MVP)

- Uso 5 de 7 días durante 2 semanas (`tasks.completed_at`).
- Te sales del plan menos del 20 % de los bloques (`focus_events` de tipo `override`).
- Ningún carril pasa más de 7 días sin despachar una tarea.

## Fuera del MVP (decidido)

- **Fechas límite:** nunca (principio 2).
- **Tareas recurrentes:** después de usar la app.
- **Captura desde fuera** (correo, WhatsApp): el usuario tiene otro plan con un agente; después del MVP. La arquitectura (Server Actions sobre Supabase con RLS) lo permite.
- **Login con Google o Apple:** opcional en la fase 6.

## Riesgos abiertos

- Vulnerabilidades en herramientas de desarrollo (CLI de shadcn y lint de Next, vía `braces`). Producción: 0. Revisar cuando haya actualizaciones.
- El repo es público con licencia MIT: decidir antes de la fase 6.
