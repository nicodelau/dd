# Memoria de Desarrollo - D&D Tools & VTT

## Test
- `npm test` (Vitest para backend, servicios de dominio y utilidades)
- `cd discord-bot && npm test` (Vitest para el bot de Discord)

## 1. Propósito y Alcance
- Asistente VTT web para D&D 5e: salas de dados en tiempo real, combate, reproductor de audio y hojas de personaje.

## 2. Arquitectura y Tecnologías
- **Core Stack:** Nuxt 3 (Vue 3), Tailwind CSS, Nuxt UI, Prisma ORM, PostgreSQL, Socket.IO.
- **Patrones:** Clean Architecture (Domain, Application, Infrastructure), Repository Pattern, Event-driven Socket.IO.
- **Diseño UI/UX:** Impeccable (Minimalist VTT / High-Density - modo Operate, tipografía suiza/mono tabular, cero AI-slop).

## 3. Decisiones Arquitectónicas Clave
- **2026-08-26 - Discord Bot Audio/Image**: Bot de Discord en TypeScript con arquitectura hexagonal en `discord-bot/`.
- **2026-08-28 - Groq STT Rate Limit Resilience**: Resiliencia con backoff en transcripción de voz.
- **2026-11-15 - Impeccable Adoption**: Adopción del sistema `impeccable.style` (`PRODUCT.md` + `DESIGN.md`) con estética "Minimalist VTT / High-Density" sin gradientes neón ni tarjetas anidadas.
- **2026-11-15 - Data-Loss Prevention & Transactional Updates**: `PrismaCharacterRepository.update` encapsulado en `prisma.$transaction`. Actualización de colecciones condicionada a arrays explícitos con rollback automático.
- **2026-11-15 - Real Character Stats in Store**: `diceRoomStore` consulta estadísticas reales del personaje en DB (`loadPlayerStatsFromDb`) en vez de sobreescribir con valores default.
- **2026-11-15 - Purga de Código Muerto**: Eliminación de ~14.000 líneas de backups obsoletos (`TopoMap.vue`, `dice.vue.backup`, `clean_sidebar_section.vue`, etc.).
- **2026-11-15 - Socket.IO Unification**: Eliminación total del legacy de SSE (`useConnectionManager.ts`), consolidando comunicación bidireccional en Socket.IO.
- **2026-11-15 - Modularización de Monolitos**:
  - `pages/dice/index.vue`: Reducido de 7.178 líneas a 490 líneas usando subcomponentes en `components/dice/`.
  - `pages/characters/[id].vue`: Reducido de 2.786 líneas a 593 líneas delegando en `components/character/` y `utils/characterConstants.ts`.

- **2026-11-15 - DM Combat & Tools Unblocking**: Eliminación de restricciones de sala `'default'`, habilitación de tracker de combate DM en tiempo real, daño/cura a participantes, navegación de turnos (`nextTurn`/`previousTurn`), y persistencia de `skills` en creación de personaje vía transacción de Prisma.

## 4. Estado Actual y Foco
- **Foco Actual:** Revamp, debloating y estabilización completados al 100%. 0 anti-patrones en `npx impeccable detect`, 15 unit tests en verde.
- **Bloqueantes:** Ninguno.

## 5. Próximos Pasos (Roadmap Inmediato)
- [x] Adoptar Impeccable (`PRODUCT.md` y `DESIGN.md`)
- [x] Purgar código muerto y backups
- [x] Blindar `PrismaCharacterRepository` con `$transaction` y tests en Vitest
- [x] Prevenir sobreescritura de stats en `diceRoomStore`
- [x] Eliminar legacy de SSE (`useConnectionManager.ts`) y unificar comunicación en Socket.IO
- [x] Deconstruir el monolito `pages/dice/index.vue` usando componentes modulares en `components/dice/`
- [x] Eliminar los 5 anti-patrones de diseño restantes (auth, dashboard, modals)
- [x] Modularizar la hoja de personaje `pages/characters/[id].vue` en `components/character/`
- [x] Pulir herramientas de DM (combate, turnos, audio, requests) y modal de creación de personaje
- [x] Validar end-to-end con Vitest y `impeccable detect`
