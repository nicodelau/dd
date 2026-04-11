# Frontend Redesign — Design Spec
**Date:** 2026-04-11  
**Scope:** Auth, Dashboard, Character Sheet (Dice Room excluded — separate spec later)

---

## Overview

Full frontend redesign of the DD Manager app (Nuxt 3). The backend (server routes, Prisma, Socket.io) stays untouched. Only the UI layer changes: pages, components, layout, and design system.

**Goal:** Replace the current inconsistent, monolithic UI with a cohesive Dark Fantasy design system and well-structured component architecture.

---

## Tech Stack

- **Framework:** Nuxt 3 (unchanged — no migration to Next.js)
- **UI library:** Nuxt UI v2 (keep existing, but override styles with new design system)
- **Styling:** Tailwind CSS with custom Dark Fantasy theme tokens
- **Icons:** Heroicons (already available via Nuxt UI)
- **Responsive:** Full — desktop panel grid collapses to mobile tabs

---

## Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `surface-base` | `#0a0a0f` | Page background |
| `surface-raised` | `#0f0f18` | Sidebar, cards |
| `surface-overlay` | `#1a1a28` | Modals, dropdowns |
| `border-subtle` | `rgba(255,255,255,0.07)` | Default borders |
| `border-gold` | `rgba(180,140,60,0.25)` | Accent borders |
| `gold` | `#c9a84c` | Primary accent, labels, active states |
| `purple` | `#8b2fc9` | Secondary accent, gradients |
| `blood` | `#c0392b` | Danger, gradients, HP warnings |
| `text-primary` | `#f9fafb` | Headings, values |
| `text-secondary` | `#9ca3af` | Body text, labels |
| `text-muted` | `#6b7280` | Placeholders, inactive items |

### Typography

- **Font:** System font stack (`-apple-system, BlinkMacSystemFont, 'Inter', sans-serif`)
- **Section labels:** 9–11px, `letter-spacing: 1–2px`, `text-transform: uppercase`, `color: gold`
- **Values/numbers:** Bold (`font-weight: 700–800`), `color: text-primary`
- **No serif** — the fantasy feel comes from color and borders, not typeface

### Decorative Elements

- Thin gold borders (`1px solid rgba(180,140,60,0.25)`) on active/accent cards
- Subtle radial gradients (purple + blood) as background atmosphere
- Rune characters (`᛭`, `✦`) as absolute-positioned decorative elements on hero sections
- No shadows on text — only on interactive buttons (`box-shadow: 0 4px 20px rgba(139,47,201,0.3)`)

---

## App Shell

### Layout

```
┌──────────────────────────────────────────────────┐
│ [56px sidebar] │        Page content              │
│                │                                  │
│  ⚔ logo        │  <page-specific layout>          │
│  🏠 dashboard  │                                  │
│  🛡 chars      │                                  │
│  🎲 dice       │                                  │
│                │                                  │
│  👤 avatar     │                                  │
└──────────────────────────────────────────────────┘
```

- **Sidebar:** 56px wide, fixed, `background: #0a0a12`, gold accent border on right
- **Active nav item:** Gold background chip (`rgba(180,140,60,0.15)`) with gold border
- **Inactive items:** 35% opacity
- **Bottom:** User avatar circle (initials) linking to profile/logout
- **Mobile:** Sidebar becomes a bottom tab bar (4 icons max)

### Auth pages

Auth pages (`/auth/login`, `/auth/register`, `/auth/forgot-password`) use a different layout — no sidebar. Split screen: hero left (45%) + form right (55%). On mobile: stacked, hero collapses to small logo + title.

---

## Pages

### 1. Login (`/auth/login`)

**Layout:** Split screen

**Left — Hero:**
- Background: `#080810` with purple/blood radial gradients
- Decorative gold border inset (12px from edges)
- App logo (gradient icon ⚔), title "Bienvenido al Reino", short description
- Feature list with gold/grey dots
- Rune decorations (absolute positioned, low opacity)

**Right — Form:**
- Background: `#0d0d14`
- Title + "¿No tenés cuenta? Registrate aquí" link (gold)
- Email input (focused state: gold border + subtle gold background tint)
- Password input
- Primary CTA button: `background: linear-gradient(135deg, #8b2fc9, #c0392b)` with purple glow shadow
- Error state: red alert below form (uses existing `UAlert`)

**Register (`/auth/register`):** Same layout, adds username + firstName + lastName fields. Same hero.

**Forgot password:** Same layout, just email field + send button.

---

### 2. Dashboard (`/dashboard`)

**Access:** All roles. DM/ADMIN see extra action buttons on character cards. Players see the same page but cards for their character only, no management actions.

**Structure:**
```
Page header (title + subtitle + tabs)
├── Stats row (4 cards): Total personajes / Asignados / Sin asignar / En batalla
└── Tab: Personajes
    └── Character card grid (3 cols desktop, 2 tablet, 1 mobile)
```

**Stats cards:** `background: rgba(color, 0.05)` with matching colored border and value. Gold for total, purple for assigned, default for unassigned, blood/red for in-battle.

**Character cards:**
- Avatar (emoji or uploaded image in rounded square with thematic gradient background)
- Name + class + level
- HP badge (red if below 50%, yellow if below 75%), AC badge, assigned player badge
- **DM-only action row:** Edit / Reassign / Combat — small ghost buttons, "Edit" in purple
- **Player view:** No action row, card is read-only link to character sheet

**DM extras:**
- "Crear personaje" button in page header (top right)
- Dashboard has a single tab ("Personajes") in this phase. "Jugadores" and "Sesión" tabs are out of scope — they can be added in a future iteration once the base redesign is complete.

---

### 3. Character Sheet (`/characters/[id]`)

**Layout:** Panel grid on desktop, tabs on mobile.

#### Header (always visible)
- Avatar (48px rounded square, thematic gradient, border gold)
- Name (bold, large), race · class · level · alignment (muted)
- XP counter + progress bar (gold gradient)
- DM-only: Edit button (top right)

#### Desktop Panel Grid (3 columns)

**Column 1 — Ability Scores (100px)**
Six ability boxes stacked vertically in fixed order: Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma. All boxes have the same default style (`surface-raised` background, `border-subtle`). Each box shows: ability name (uppercase tiny), score (large bold), modifier (pill badge).

**Column 2 — Combat + Skills**
- Combat row (4 boxes): HP (red accent) / AC (gold accent) / Initiative (purple accent) / Speed (default)
- HP box: shows current/max, red border, clickable to edit if DM or owner
- Skills panel: two-column grid list. Each row: proficiency dot (filled gold = proficient, double ring = expertise, empty = none) + skill name + bonus value

**Column 3 — Saving Throws + Attacks**
- Saving throws panel: same dot system as skills
- Attacks panel: list of attacks with name / attack bonus (gold) / damage (red)

#### Mobile Tabs
Swipeable tabs replacing the grid:
1. **Stats** — ability scores + saving throws
2. **Combate** — HP/AC/Initiative + attacks + death saves
3. **Hechizos** — spell slots + spells list (grouped by level)
4. **Inventario** — item list with equipped toggle
5. **Notas** — personality, ideals, bonds, flaws, backstory (text areas)

---

## Component Architecture

The current monolithic files get split into focused components:

```
components/
├── layout/
│   ├── AppSidebar.vue         # Icon sidebar with nav + avatar
│   └── AppMobileTabBar.vue    # Mobile bottom nav
├── auth/
│   ├── AuthHero.vue           # Left panel for auth pages
│   └── AuthForm.vue           # Form wrapper
├── dashboard/
│   ├── DashboardStats.vue     # 4-card stats row
│   └── CharacterCard.vue      # Card with optional DM actions
├── character/
│   ├── CharacterHeader.vue    # Name/avatar/XP header
│   ├── AbilityScores.vue      # 6 ability boxes column
│   ├── CombatStats.vue        # HP/AC/Init/Speed row
│   ├── SkillsList.vue         # Proficiency dot + skill rows
│   ├── SavingThrows.vue       # Same dot pattern for saves
│   ├── AttacksList.vue        # Attack rows
│   ├── SpellsPanel.vue        # Spell slots + spells
│   ├── InventoryPanel.vue     # Item list
│   └── CharacterNotes.vue     # Text fields for personality/backstory
└── ui/
    ├── StatCard.vue           # Reusable colored stat card
    ├── ProficiencyDot.vue     # Dot indicator (none/proficient/expertise)
    └── GoldBadge.vue          # Small gold-bordered badge
```

Pages become thin orchestrators — they fetch data and pass it to components.

---

## Responsive Behavior

| Breakpoint | Sidebar | Character Sheet | Dashboard Grid |
|---|---|---|---|
| Mobile (`< 768px`) | Bottom tab bar | Swipeable tabs | 1 column |
| Tablet (`768–1024px`) | Sidebar (icons) | Tabs (smaller grid) | 2 columns |
| Desktop (`> 1024px`) | Sidebar (icons) | Full panel grid | 3 columns |

---

## What's NOT in scope

- Dice Room redesign (separate spec)
- Backend changes (server routes, Prisma, auth logic)
- New features or data model changes
- Admin panel (beyond DM actions already described)
- Social features (friendships, direct messages) — existing implementation stays

---

## Success Criteria

1. Login, register, and forgot-password pages match the Dark Fantasy design
2. Dashboard shows character cards with DM actions visible only to DM/ADMIN roles
3. Character sheet panel grid renders correctly on desktop; tabs render on mobile
4. No single page/component file exceeds ~300 lines
5. Existing API calls (`$fetch('/api/...')`) and auth flow work without changes
6. `.gitignore` includes `.superpowers/`
