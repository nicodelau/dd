# Design System

<!-- impeccable:design-schema 1 -->

## Direction

Minimalist VTT / High-Density — Swiss tactical design for real-time tabletop gaming.

## Visual Language

- **Mode:** Operate (fast scanability, data density, high contrast, zero clutter).
- **Aesthetic:** Utilitarian, crisp, dark matte surfaces, hairline borders, tabular alignment.
- **Rule of Restraint:** Eliminate decorative slop (no purple gradients, no neon glow, no nested card wrappers, no thick `border-l-4` card tabs).

## Palette

### Foundations (Dark Canvas)
- **Canvas / Background:** `#09090b` (`bg-zinc-950`) — deep matte neutral black.
- **Surface Level 1 (Panels & Toolbars):** `#121215` (`bg-zinc-900/90`) — hairline separated.
- **Surface Level 2 (Inputs, Active Rows, Items):** `#18181b` (`bg-zinc-900`).
- **Surface Level 3 (Hover & Active States):** `#27272a` (`bg-zinc-800`).
- **Hairline Borders:** `#27272a` (`border-zinc-800`) / active `#3f3f46` (`border-zinc-700`).

### Ink (Typography Contrast)
- **Primary Text:** `#fafafa` (`text-zinc-50`) — maximum clarity for critical numbers and labels.
- **Secondary Text:** `#a1a1aa` (`text-zinc-400`) — descriptors, modifiers, table headers.
- **Muted Text:** `#71717a` (`text-zinc-500`) — timestamps, units, metadata.

### Tactical Accents (Functional Only)
- **Threat / Danger / DM Actions:** `#f43f5e` (`rose-500`) / `#e11d48` (`rose-600`) — used for damage, enemy markers, DM authority.
- **Warning / Stamina / In Progress:** `#f59e0b` (`amber-500`) — used for stamina consumption, pending turns, concentration.
- **Success / Healing / Connected:** `#10b981` (`emerald-500`) — used for HP recovery, online socket indicator, success saves.
- **Focus / Selection:** `#38bdf8` (`sky-500`) / `#2563eb` (`blue-600`) — active turn outline, selected character.

### Equipment & Spell Tiers
- **Gris (Común):** `#71717a` (`zinc-500`)
- **Verde (Poco común):** `#10b981` (`emerald-500`)
- **Azul (Raro):** `#0ea5e9` (`sky-500`)
- **Morado (Épico):** `#8b5cf6` (`violet-500`)
- **Dorado (Legendario):** `#f59e0b` (`amber-500`)

*Rule for tiers:* Render tiers through subtle badges or text labels, never full-card neon glow or gradient backdrops.

## Typography

- **UI Sans:** `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Sharp, compact, standard weights (`font-normal`, `font-medium`, `font-semibold`).
- **Stats & Dice Mono:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
  - **Mandatory for:** HP values, Armor Class, initiative numbers, roll math, modifiers, dice formulas (`1d20 + 5`).
  - Always apply `tabular-nums` for consistent column alignment.

## Layout & Component Rules

1. **Flat Hierarchy (Anti-Card-Hell):**
   - Use subtle 1px dividers (`divide-zinc-800`) and tabular rows instead of nesting cards inside cards.
   - Panels use `rounded-md border border-zinc-800 bg-zinc-950/80`.
2. **Dense Tactical Data:**
   - HP bars: Compact 4px or 6px micro-bars with tabular numbers (`HP 45 / 52`).
   - Action buttons: Clean, compact padding (`px-2.5 py-1 text-xs font-medium`).
3. **Roll Feed:**
   - Chronological, clean linear list with timestamps, player identity badge, dice breakdown (`[18] + 4 = 22`), and clear natural 20 / natural 1 badges.
4. **Form Controls:**
   - Dark inputs with crisp 1px borders, zero floating labels or oversized drop shadows.
