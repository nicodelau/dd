# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dungeon Masters (DMs) and Players playing D&D 5e tabletop roleplaying sessions (specifically in the custom campaign setting of *Pilotes* and standard 5e campaigns), collaborating in real-time while communicating over Discord voice chat.

## Product Purpose

A streamlined, high-performance web companion and VTT for tabletop gaming that manages live dice rooms, real-time multiplayer roll feeds, combat and initiative tracking, character sheets, and ambient session music with zero clutter and instant synchronization.

## Positioning

High-density, distraction-free tabletop instrument built for speed during live combat. Unlike monolithic, slow VTTs (Roll20, Foundry) or generic AI-slop tools, this app prioritizes immediate legibility, high data density, and bulletproof real-time state sync.

## Operating Context

- Used in live, fast-paced gaming sessions, often on second monitors, laptops, or tablets in low-ambient lighting.
- High cognitive load during combat: users need to see turn order, hit points, stamina, and actions instantly without digging through nested modals or bloated cards.
- Integrated audio and Discord bot presence for background atmosphere and transcription.

## Capabilities and Constraints

- **Real-Time Multiplayer:** Instant room-based synchronization over Socket.IO (dice rolls, initiative orders, HP/stamina adjustments, audio triggers).
- **Character Management:** D&D 5e character sheets, stamina/magic reserves, equipment tiers (gris, verde, azul, morado, etc.), attack actions, and spells.
- **DM Screen & Combat Tracker:** Initiative rolls, enemy/player roster, HP modifiers, status effects, and turn rotation.
- **Audio & Ambiance:** Synchronized session music and sound effects triggered by DM actions or combat phase changes.
- **Technical Stack:** Nuxt 3 (Vue 3), Tailwind CSS, Nuxt UI, Prisma ORM with PostgreSQL, Socket.IO.

## Brand Commitments

- **Aesthetic Direction:** Minimalist VTT / High-Density (Swiss tactical minimalism).
- **Anti-Pattern Bans:** Zero purple/cyan neon AI gradients, zero thick `border-l-4` side tabs on cards, zero low-contrast text, zero nested card hell.
- **Tone:** Technical, sharp, legible, utilitarian, respectful of tabletop rituals.

## Evidence on Hand

- Existing Prisma database schema with Users, Characters, Attacks, Inventory, CombatActions, and Rooms (`prisma/schema.prisma`).
- Real-time event architecture in `server/plugins/socket.io.ts`.
- World lore for Pilotes and character roster in `MEMORY.md`.

## Product Principles

1. **Data Integrity First:** Never overwrite or wipe character data with defaults. State updates must be transactional and defensive.
2. **Tactical Density:** Maximize screen real-estate for actionable combat data; eliminate decorative filler and nested cards.
3. **Deterministic Sync:** Real-time events must be authoritative, low-latency, and resilient to disconnects/reconnects.
4. **Restraint over Gimmicks:** The UI supports the game; it does not distract from the story.
