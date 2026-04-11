# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the DD Manager frontend (auth, dashboard, character sheet) with a Dark Fantasy design system — dark backgrounds, gold/purple/blood accents, icon sidebar, panel-grid character sheet — without touching the Nuxt 3 backend.

**Architecture:** Nuxt 3 layouts (`layouts/default.vue` = authenticated shell with sidebar; `layouts/auth.vue` = split-screen for login/register) wrap focused single-responsibility components. Pages are thin orchestrators that fetch data and pass props. Tailwind is extended with `dd-` prefixed color tokens. CSS custom properties handle rgba values.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, Nuxt UI v2, Tailwind CSS, Vitest + @nuxt/test-utils.

---

## File Map

**Create:**
- `vitest.config.ts`
- `types/frontend.ts`
- `layouts/default.vue`
- `layouts/auth.vue`
- `components/layout/AppSidebar.vue`
- `components/layout/AppMobileTabBar.vue`
- `components/ui/StatCard.vue`
- `components/ui/ProficiencyDot.vue`
- `components/ui/GoldBadge.vue`
- `components/dashboard/DashboardStats.vue`
- `components/dashboard/CharacterCard.vue`
- `components/character/CharacterHeader.vue`
- `components/character/AbilityScores.vue`
- `components/character/CombatStats.vue`
- `components/character/SkillsList.vue`
- `components/character/SavingThrows.vue`
- `components/character/AttacksList.vue`
- `components/character/SpellsPanel.vue`
- `components/character/InventoryPanel.vue`
- `components/character/CharacterNotes.vue`
- `tests/components/ui/ProficiencyDot.test.ts`
- `tests/components/dashboard/CharacterCard.test.ts`

**Modify:**
- `tailwind.config.js` — add `dd-` color tokens
- `assets/css/main.css` — CSS custom properties + utility classes
- `.gitignore` — add `.superpowers/`
- `package.json` — add `test` script
- `app.vue` — delegate layout to Nuxt layouts system
- `pages/auth/login.vue` — full rewrite
- `pages/auth/register.vue` — full rewrite
- `pages/auth/forgot-password.vue` — full rewrite
- `pages/dashboard/index.vue` — full rewrite
- `pages/characters/[id].vue` — full rewrite

---

## Task 1: Design tokens + Vitest setup

**Files:**
- Modify: `tailwind.config.js`
- Modify: `assets/css/main.css`
- Modify: `.gitignore`
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Extend tailwind.config.js with Dark Fantasy tokens**

Replace contents of `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        'dd-base':      '#0a0a0f',
        'dd-raised':    '#0f0f18',
        'dd-overlay':   '#1a1a28',
        'dd-gold':      '#c9a84c',
        'dd-purple':    '#8b2fc9',
        'dd-blood':     '#c0392b',
        'dd-text':      '#f9fafb',
        'dd-secondary': '#9ca3af',
        'dd-muted':     '#6b7280',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Add CSS custom properties and utility classes**

Replace contents of `assets/css/main.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --dd-border-subtle: rgba(255, 255, 255, 0.07);
  --dd-border-gold:   rgba(180, 140, 60, 0.25);
  --dd-glow-gold:     rgba(180, 140, 60, 0.15);
  --dd-glow-purple:   rgba(139, 47, 201, 0.15);
  --dd-glow-blood:    rgba(192, 57, 43, 0.10);
  --dd-glow-red:      rgba(239, 68, 68, 0.10);
}

@layer base {
  html { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; }
  body { background-color: #0a0a0f; color: #f9fafb; }
}

@layer components {
  .dd-card {
    background: #0f0f18;
    border: 1px solid var(--dd-border-subtle);
    border-radius: 10px;
  }
  .dd-card-gold {
    background: rgba(180, 140, 60, 0.05);
    border: 1px solid var(--dd-border-gold);
    border-radius: 10px;
  }
  .dd-input {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--dd-border-subtle);
    border-radius: 7px;
    color: #f9fafb;
    transition: border-color 0.15s, background 0.15s;
  }
  .dd-input::placeholder { color: #6b7280; }
  .dd-input:focus {
    outline: none;
    border-color: var(--dd-border-gold);
    background: rgba(180, 140, 60, 0.04);
  }
  .dd-btn-primary {
    background: linear-gradient(135deg, #8b2fc9, #c0392b);
    box-shadow: 0 4px 20px rgba(139, 47, 201, 0.3);
    border: none;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s, box-shadow 0.15s;
  }
  .dd-btn-primary:hover:not(:disabled) {
    opacity: 0.9;
    box-shadow: 0 6px 24px rgba(139, 47, 201, 0.4);
  }
  .dd-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .dd-section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6b7280;
    margin-bottom: 10px;
  }
  .dd-card-purple {
    background: rgba(139, 47, 201, 0.05);
    border: 1px solid rgba(139, 47, 201, 0.25);
    border-radius: 10px;
  }
  .dd-card-red {
    background: rgba(192, 57, 43, 0.05);
    border: 1px solid rgba(192, 57, 43, 0.25);
    border-radius: 10px;
  }
}
```

- [ ] **Step 3: Add .superpowers/ to .gitignore**

Append to `.gitignore`:

```
# Superpowers brainstorm artifacts
.superpowers/
```

- [ ] **Step 4: Install Vitest and @nuxt/test-utils**

```bash
npm install --save-dev vitest @nuxt/test-utils happy-dom @vue/test-utils
```

Expected: installs cleanly, no peer dependency errors.

- [ ] **Step 5: Create vitest.config.ts**

```ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
  },
})
```

- [ ] **Step 6: Add test scripts to package.json**

In `package.json`, add to the `"scripts"` block:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Verify Tailwind builds**

```bash
npm run dev
```

Expected: server starts, no build errors, body background is `#0a0a0f`.

- [ ] **Step 8: Commit**

```bash
git add tailwind.config.js assets/css/main.css .gitignore vitest.config.ts package.json package-lock.json
git commit -m "feat: add Dark Fantasy design tokens and Vitest setup"
```

---

## Task 2: Frontend types + primitive UI components

**Files:**
- Create: `types/frontend.ts`
- Create: `components/ui/ProficiencyDot.vue`
- Create: `components/ui/StatCard.vue`
- Create: `components/ui/GoldBadge.vue`
- Create: `tests/components/ui/ProficiencyDot.test.ts`

- [ ] **Step 1: Write the failing ProficiencyDot test**

Create `tests/components/ui/ProficiencyDot.test.ts`:

```ts
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'
import ProficiencyDot from '~/components/ui/ProficiencyDot.vue'

describe('ProficiencyDot', () => {
  it('renders filled gold dot for proficient', async () => {
    const wrapper = await mountSuspended(ProficiencyDot, { props: { variant: 'proficient' } })
    const dot = wrapper.find('[data-testid="dot"]')
    expect(dot.classes()).toContain('bg-dd-gold')
    expect(dot.classes()).not.toContain('ring-2')
  })

  it('renders double-ring gold dot for expertise', async () => {
    const wrapper = await mountSuspended(ProficiencyDot, { props: { variant: 'expertise' } })
    const dot = wrapper.find('[data-testid="dot"]')
    expect(dot.classes()).toContain('bg-dd-gold')
    expect(dot.classes()).toContain('ring-2')
  })

  it('renders empty bordered dot for none', async () => {
    const wrapper = await mountSuspended(ProficiencyDot, { props: { variant: 'none' } })
    const dot = wrapper.find('[data-testid="dot"]')
    expect(dot.classes()).not.toContain('bg-dd-gold')
    expect(dot.classes()).toContain('border')
  })
})
```

- [ ] **Step 2: Run test — confirm FAIL**

```bash
npx vitest run tests/components/ui/ProficiencyDot.test.ts
```

Expected: FAIL — "Cannot find module '~/components/ui/ProficiencyDot.vue'"

- [ ] **Step 3: Create types/frontend.ts**

```ts
export type ProficiencyVariant = 'none' | 'proficient' | 'expertise'
export type UserRole = 'PLAYER' | 'DM' | 'ADMIN'

export interface UserData {
  id: string
  username: string
  firstName: string | null
  lastName: string | null
  email: string
  role: UserRole
  avatar: string | null
}

export interface CharacterSkill {
  id: string
  name: string
  ability: string   // 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'
  proficient: boolean
  expertise: boolean
}

export interface CharacterSavingThrow {
  id: string
  ability: string
  proficient: boolean
}

export interface CharacterAttack {
  id: string
  name: string
  attackBonus: number | null
  damageType: string | null
  damageDice: string | null
  damageBonus: number | null
  range: string | null
  description: string | null
}

export interface CharacterSpell {
  id: string
  spellId: string
  prepared: boolean
  known: boolean
  spell: {
    id: string
    name: string
    level: number
    school: string | null
    castingTime: string | null
    range: string | null
    components: string | null
    duration: string | null
    description: string | null
  }
}

export interface SpellSlot {
  id: string
  level: number
  total: number
  used: number
}

export interface InventoryItem {
  id: string
  name: string
  description: string | null
  quantity: number
  weight: number | null
  value: number | null
  equipped: boolean
}

export interface CharacterData {
  id: string
  name: string
  playerName: string | null
  race: string | null
  class: string | null
  subrace: string | null
  level: number
  background: string | null
  alignment: string | null
  age: number | null
  height: string | null
  weight: string | null
  eyes: string | null
  hair: string | null
  skin: string | null
  avatar: string | null
  hitPoints: number
  maxHitPoints: number
  tempHitPoints: number
  armorClass: number
  initiative: number
  speed: number
  proficiencyBonus: number
  passivePerception: number
  experiencePoints: number
  inspiration: boolean
  deathSaveSuccesses: number
  deathSaveFailures: number
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  personality: string | null
  ideals: string | null
  bonds: string | null
  flaws: string | null
  backstory: string | null
  notes: string | null
  userId: string | null
  ownerId: string | null
  skills: CharacterSkill[]
  savingThrows: CharacterSavingThrow[]
  attacks: CharacterAttack[]
  spells: CharacterSpell[]
  spellSlots: SpellSlot[]
  inventory: InventoryItem[]
}
```

- [ ] **Step 4: Create components/ui/ProficiencyDot.vue**

```vue
<template>
  <div
    data-testid="dot"
    class="w-2 h-2 rounded-full flex-shrink-0"
    :class="dotClass"
  />
</template>

<script setup lang="ts">
import type { ProficiencyVariant } from '~/types/frontend'

const props = defineProps<{ variant: ProficiencyVariant }>()

const dotClass = computed(() => {
  if (props.variant === 'expertise') return 'bg-dd-gold ring-2 ring-dd-gold ring-offset-1 ring-offset-dd-base'
  if (props.variant === 'proficient') return 'bg-dd-gold'
  return 'border border-zinc-600 bg-transparent'
})
</script>
```

- [ ] **Step 5: Run test — confirm PASS**

```bash
npx vitest run tests/components/ui/ProficiencyDot.test.ts
```

Expected: PASS — 3 tests passing.

- [ ] **Step 6: Create components/ui/StatCard.vue**

```vue
<template>
  <div class="rounded-xl p-4" :class="cardClass">
    <p class="text-xs font-semibold uppercase tracking-wider mb-1.5" :class="labelClass">{{ label }}</p>
    <p class="text-2xl font-extrabold" :class="valueClass">{{ value }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  value: string | number
  variant?: 'default' | 'gold' | 'purple' | 'red'
}>()

const v = computed(() => props.variant ?? 'default')

const cardClass = computed(() => ({
  default: 'dd-card',
  gold:    'dd-card-gold',
  purple:  'dd-card-purple',
  red:     'dd-card-red',
}[v.value]))

const labelClass = computed(() => ({
  default: 'text-dd-muted',
  gold:    'text-dd-gold',
  purple:  'text-purple-400',
  red:     'text-red-400',
}[v.value]))

const valueClass = computed(() => ({
  default: 'text-dd-text',
  gold:    'text-dd-gold',
  purple:  'text-purple-400',
  red:     'text-red-400',
}[v.value]))
```

- [ ] **Step 7: Create components/ui/GoldBadge.vue**

```vue
<template>
  <span class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium" :class="badgeClass">
    <slot />
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  variant?: 'gold' | 'red' | 'yellow' | 'purple' | 'default'
}>()

const badgeClass = computed(() => ({
  gold:    'bg-dd-gold/10 text-dd-gold border border-dd-gold/30',
  red:     'bg-red-500/10 text-red-400 border border-red-500/30',
  yellow:  'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  purple:  'bg-dd-purple/10 text-purple-400 border border-dd-purple/30',
  default: 'bg-white/5 text-dd-secondary border border-white/10',
}[props.variant ?? 'default']))
</script>
```

- [ ] **Step 8: Commit**

```bash
git add types/frontend.ts components/ui/ tests/components/ui/ assets/css/main.css
git commit -m "feat: add frontend types and primitive UI components (StatCard, ProficiencyDot, GoldBadge)"
```

---

## Task 3: Layout system

**Files:**
- Create: `layouts/default.vue`
- Create: `layouts/auth.vue`
- Create: `components/layout/AppSidebar.vue`
- Create: `components/layout/AppMobileTabBar.vue`
- Modify: `app.vue`

- [ ] **Step 1: Create components/layout/AppSidebar.vue**

```vue
<template>
  <aside
    class="hidden md:flex flex-col items-center w-14 min-h-screen bg-dd-raised flex-shrink-0"
    style="border-right: 1px solid var(--dd-border-gold);"
  >
    <!-- Logo -->
    <NuxtLink
      to="/dashboard"
      class="mt-3 mb-4 w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
      style="background: linear-gradient(135deg, #8b2fc9, #c0392b);"
    >
      ⚔
    </NuxtLink>

    <!-- Nav -->
    <nav class="flex flex-col gap-1.5 w-full px-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :title="item.label"
        class="flex items-center justify-center w-9 h-9 mx-auto rounded-lg text-lg transition-all"
        :class="isActive(item.to) ? 'text-dd-gold' : 'opacity-35 hover:opacity-70'"
        :style="isActive(item.to) ? 'background: var(--dd-glow-gold); border: 1px solid var(--dd-border-gold);' : ''"
      >
        {{ item.icon }}
      </NuxtLink>
    </nav>

    <!-- Avatar -->
    <div class="mt-auto mb-3">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer select-none"
        style="background: linear-gradient(135deg, #8b2fc9, #6d28d9);"
        :title="user?.username ?? 'Perfil'"
      >
        {{ userInitial }}
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { UserData } from '~/types/frontend'

const route = useRoute()
const user = useState<UserData | null>('user')

const navItems = [
  { to: '/dashboard',   icon: '🏠', label: 'Dashboard'  },
  { to: '/characters',  icon: '🛡',  label: 'Personajes' },
  { to: '/dice',        icon: '🎲', label: 'Dados'      },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

const userInitial = computed(() => {
  if (!user.value) return '?'
  return (user.value.firstName?.[0] ?? user.value.username[0]).toUpperCase()
})
</script>
```

- [ ] **Step 2: Create components/layout/AppMobileTabBar.vue**

```vue
<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-dd-raised"
    style="border-top: 1px solid var(--dd-border-subtle);"
  >
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
      :class="isActive(item.to) ? 'text-dd-gold' : 'text-dd-muted'"
    >
      <span class="text-xl leading-none">{{ item.icon }}</span>
      <span class="text-[10px] font-medium">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()

const navItems = [
  { to: '/dashboard',  icon: '🏠', label: 'Inicio'     },
  { to: '/characters', icon: '🛡',  label: 'Personajes' },
  { to: '/dice',       icon: '🎲', label: 'Dados'      },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
```

- [ ] **Step 3: Create layouts/default.vue**

```vue
<template>
  <div class="flex min-h-screen bg-dd-base text-dd-text">
    <AppSidebar />
    <main class="flex-1 min-w-0 pb-16 md:pb-0 overflow-x-hidden">
      <slot />
    </main>
    <AppMobileTabBar />
    <SocialSidebar v-if="user" />
    <UNotifications />
  </div>
</template>

<script setup lang="ts">
import SocialSidebar from '~/components/social/SocialSidebar.vue'
const user = useState('user')
</script>
```

- [ ] **Step 4: Create layouts/auth.vue**

```vue
<template>
  <div class="min-h-screen bg-dd-base text-dd-text">
    <slot />
    <UNotifications />
  </div>
</template>
```

- [ ] **Step 5: Simplify app.vue**

Replace the entire file:

```vue
<template>
  <div>
    <AuthLoading v-if="authLoading" :message="authLoadingMessage" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const authLoading = useState('authLoading', () => false)
const authLoadingMessage = useState('authLoadingMessage', () => 'Verificando autenticación...')

useHead({
  titleTemplate: (title) => title ? `${title} — DD Manager` : 'DD Manager',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png' }],
})

const colorMode = useColorMode()
colorMode.preference = 'dark'
</script>
```

- [ ] **Step 6: Verify layout renders**

```bash
npm run dev
```

Navigate to `/dashboard`. Confirm: sidebar visible on desktop, bottom nav on mobile, background is `#0a0a0f`.

- [ ] **Step 7: Commit**

```bash
git add layouts/ components/layout/ app.vue
git commit -m "feat: add Nuxt layout system with dark sidebar and mobile tab bar"
```

---

## Task 4: Auth pages

**Files:**
- Modify: `pages/auth/login.vue` (full rewrite)
- Modify: `pages/auth/register.vue` (full rewrite)
- Modify: `pages/auth/forgot-password.vue` (full rewrite)

All three use `definePageMeta({ layout: 'auth' })`.

- [ ] **Step 1: Rewrite pages/auth/login.vue**

```vue
<template>
  <div class="flex min-h-screen">
    <!-- Hero side -->
    <div
      class="hidden lg:flex lg:w-[45%] flex-col justify-center px-12 py-12 relative overflow-hidden"
      style="background: #080810;"
    >
      <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse at 30% 60%, rgba(139,47,201,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(192,57,43,0.08) 0%, transparent 50%);"></div>
      <div class="absolute inset-3 rounded pointer-events-none" style="border: 1px solid rgba(180,140,60,0.12);"></div>
      <span class="absolute bottom-8 right-8 text-5xl opacity-[0.06] text-dd-gold select-none">᛭</span>
      <span class="absolute top-10 left-10 text-3xl opacity-[0.07] text-dd-gold select-none">✦</span>

      <div class="relative z-10">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-6" style="background: linear-gradient(135deg, #8b2fc9, #c0392b);">⚔</div>
        <h1 class="text-3xl font-extrabold text-dd-text leading-tight mb-3">
          Bienvenido al<br /><span class="text-dd-gold">Reino</span>
        </h1>
        <p class="text-sm text-dd-muted leading-relaxed mb-8">
          Gestión de personajes, batallas y sesiones para tu campaña de D&D.
        </p>
        <ul class="space-y-3">
          <li class="flex items-center gap-2.5 text-sm text-dd-secondary">
            <span class="w-1.5 h-1.5 rounded-full bg-dd-gold flex-shrink-0"></span>
            Ficha completa de personaje
          </li>
          <li class="flex items-center gap-2.5 text-sm text-dd-muted">
            <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background: rgba(255,255,255,0.15);"></span>
            Sala de dados en tiempo real
          </li>
          <li class="flex items-center gap-2.5 text-sm text-dd-muted">
            <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background: rgba(255,255,255,0.15);"></span>
            Música ambiental para sesiones
          </li>
        </ul>
      </div>
    </div>

    <!-- Form side -->
    <div class="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 bg-dd-base">
      <!-- Mobile logo -->
      <div class="lg:hidden flex items-center gap-3 mb-8">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style="background: linear-gradient(135deg, #8b2fc9, #c0392b);">⚔</div>
        <span class="text-dd-gold text-sm font-semibold tracking-widest uppercase">DD Manager</span>
      </div>

      <div class="w-full max-w-sm">
        <h2 class="text-2xl font-bold text-dd-text mb-1">Iniciar sesión</h2>
        <p class="text-sm text-dd-muted mb-7">
          ¿No tenés cuenta?
          <NuxtLink to="/auth/register" class="text-dd-gold hover:opacity-80 transition-opacity font-medium">Registrate aquí</NuxtLink>
        </p>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <div>
            <label class="block text-xs font-medium text-dd-secondary mb-1.5">Correo electrónico</label>
            <input v-model="form.email" type="email" placeholder="tu@email.com" class="dd-input w-full px-3 py-2.5 text-sm" required />
            <p v-if="errors.email" class="mt-1 text-xs text-red-400">{{ errors.email }}</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-dd-secondary mb-1.5">Contraseña</label>
            <input v-model="form.password" type="password" placeholder="••••••••" class="dd-input w-full px-3 py-2.5 text-sm" required />
            <p v-if="errors.password" class="mt-1 text-xs text-red-400">{{ errors.password }}</p>
          </div>

          <button type="submit" :disabled="loading" class="dd-btn-primary w-full py-2.5 text-sm rounded-lg mt-1">
            {{ loading ? 'Ingresando...' : 'Entrar al reino' }}
          </button>

          <div v-if="errors.general" class="rounded-lg px-4 py-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30">
            {{ errors.general }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Iniciar sesión — DD Manager' })

const router = useRouter()
const toast = useToast()

const form = reactive({ email: '', password: '' })
const errors = reactive<Record<string, string>>({})
const loading = ref(false)

function validate() {
  Object.keys(errors).forEach(k => delete (errors as any)[k])
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email inválido'
  if (!form.password || form.password.length < 6) errors.password = 'Mínimo 6 caracteres'
  return Object.keys(errors).length === 0
}

async function handleLogin() {
  if (!validate()) return
  loading.value = true
  try {
    const res = await $fetch('/api/auth/login', { method: 'POST', body: { email: form.email, password: form.password } }) as any
    const userData = res.data?.user ?? res.user ?? res
    useState('user').value = userData
    toast.add({ title: 'Bienvenido de vuelta', color: 'green' })
    const redirectPath = useState<string | null>('redirectPath')
    const target = redirectPath.value ?? '/dashboard'
    redirectPath.value = null
    await router.push(target)
  } catch (err: any) {
    errors.general = err.statusCode === 401 ? 'Email o contraseña incorrectos' : 'Error al iniciar sesión. Intentá de nuevo.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await $fetch('/api/auth/me') as any
    const userData = res.data?.user ?? res.user ?? res
    if (userData?.id) {
      useState('user').value = userData
      await router.push('/dashboard')
    }
  } catch { /* not authenticated */ }
})
</script>
```

- [ ] **Step 2: Rewrite pages/auth/register.vue**

```vue
<template>
  <div class="flex min-h-screen">
    <div class="hidden lg:flex lg:w-[45%] flex-col justify-center px-12 py-12 relative overflow-hidden" style="background: #080810;">
      <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse at 30% 60%, rgba(139,47,201,0.12) 0%, transparent 60%);"></div>
      <div class="absolute inset-3 rounded pointer-events-none" style="border: 1px solid rgba(180,140,60,0.12);"></div>
      <span class="absolute bottom-8 right-8 text-5xl opacity-[0.06] text-dd-gold select-none">᛭</span>
      <div class="relative z-10">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-6" style="background: linear-gradient(135deg, #8b2fc9, #c0392b);">⚔</div>
        <h1 class="text-3xl font-extrabold text-dd-text leading-tight mb-3">Unite a la<br /><span class="text-dd-gold">Aventura</span></h1>
        <p class="text-sm text-dd-muted leading-relaxed">Creá tu cuenta y empezá a gestionar tu campaña de D&D.</p>
      </div>
    </div>

    <div class="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 bg-dd-base">
      <div class="lg:hidden flex items-center gap-3 mb-8">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style="background: linear-gradient(135deg, #8b2fc9, #c0392b);">⚔</div>
        <span class="text-dd-gold text-sm font-semibold tracking-widest uppercase">DD Manager</span>
      </div>

      <div class="w-full max-w-sm">
        <h2 class="text-2xl font-bold text-dd-text mb-1">Crear cuenta</h2>
        <p class="text-sm text-dd-muted mb-7">
          ¿Ya tenés cuenta?
          <NuxtLink to="/auth/login" class="text-dd-gold hover:opacity-80 transition-opacity font-medium">Iniciá sesión</NuxtLink>
        </p>

        <form class="space-y-4" @submit.prevent="handleRegister">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-dd-secondary mb-1.5">Nombre</label>
              <input v-model="form.firstName" type="text" placeholder="Juan" class="dd-input w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-dd-secondary mb-1.5">Apellido</label>
              <input v-model="form.lastName" type="text" placeholder="García" class="dd-input w-full px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-dd-secondary mb-1.5">Usuario</label>
            <input v-model="form.username" type="text" placeholder="aventurero42" class="dd-input w-full px-3 py-2.5 text-sm" required />
            <p v-if="errors.username" class="mt-1 text-xs text-red-400">{{ errors.username }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-dd-secondary mb-1.5">Email</label>
            <input v-model="form.email" type="email" placeholder="tu@email.com" class="dd-input w-full px-3 py-2.5 text-sm" required />
            <p v-if="errors.email" class="mt-1 text-xs text-red-400">{{ errors.email }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-dd-secondary mb-1.5">Contraseña</label>
            <input v-model="form.password" type="password" placeholder="••••••••" class="dd-input w-full px-3 py-2.5 text-sm" required />
            <p v-if="errors.password" class="mt-1 text-xs text-red-400">{{ errors.password }}</p>
          </div>
          <button type="submit" :disabled="loading" class="dd-btn-primary w-full py-2.5 text-sm rounded-lg">
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
          <div v-if="errors.general" class="rounded-lg px-4 py-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30">{{ errors.general }}</div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Crear cuenta — DD Manager' })

const router = useRouter()
const toast = useToast()

const form = reactive({ firstName: '', lastName: '', username: '', email: '', password: '' })
const errors = reactive<Record<string, string>>({})
const loading = ref(false)

function validate() {
  Object.keys(errors).forEach(k => delete (errors as any)[k])
  if (!form.username || form.username.length < 3) errors.username = 'Mínimo 3 caracteres'
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email inválido'
  if (!form.password || form.password.length < 6) errors.password = 'Mínimo 6 caracteres'
  return Object.keys(errors).length === 0
}

async function handleRegister() {
  if (!validate()) return
  loading.value = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: { ...form } })
    toast.add({ title: '¡Cuenta creada! Iniciá sesión.', color: 'green' })
    await router.push('/auth/login')
  } catch (err: any) {
    errors.general = err.data?.message ?? 'Error al crear la cuenta. Intentá de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 3: Rewrite pages/auth/forgot-password.vue**

```vue
<template>
  <div class="flex min-h-screen">
    <div class="hidden lg:flex lg:w-[45%] flex-col justify-center px-12 py-12 relative overflow-hidden" style="background: #080810;">
      <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse at 30% 60%, rgba(139,47,201,0.12) 0%, transparent 60%);"></div>
      <div class="absolute inset-3 rounded pointer-events-none" style="border: 1px solid rgba(180,140,60,0.12);"></div>
      <span class="absolute bottom-8 right-8 text-5xl opacity-[0.06] text-dd-gold select-none">᛭</span>
      <div class="relative z-10">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-6" style="background: linear-gradient(135deg, #8b2fc9, #c0392b);">⚔</div>
        <h1 class="text-3xl font-extrabold text-dd-text leading-tight mb-3">Recuperá tu<br /><span class="text-dd-gold">acceso</span></h1>
        <p class="text-sm text-dd-muted">Te enviaremos un enlace para restablecer tu contraseña.</p>
      </div>
    </div>

    <div class="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 bg-dd-base">
      <div class="w-full max-w-sm">
        <h2 class="text-2xl font-bold text-dd-text mb-1">Olvidé mi contraseña</h2>
        <p class="text-sm text-dd-muted mb-7">
          <NuxtLink to="/auth/login" class="text-dd-gold hover:opacity-80 font-medium">← Volver al inicio de sesión</NuxtLink>
        </p>

        <div v-if="sent" class="rounded-lg px-4 py-4 text-sm text-green-400 border border-green-500/30 bg-green-500/10">
          Enviamos un enlace a <strong>{{ form.email }}</strong>. Revisá tu correo.
        </div>

        <form v-else class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-xs font-medium text-dd-secondary mb-1.5">Email</label>
            <input v-model="form.email" type="email" placeholder="tu@email.com" class="dd-input w-full px-3 py-2.5 text-sm" required />
          </div>
          <button type="submit" :disabled="loading" class="dd-btn-primary w-full py-2.5 text-sm rounded-lg">
            {{ loading ? 'Enviando...' : 'Enviar enlace' }}
          </button>
          <div v-if="error" class="rounded-lg px-4 py-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30">{{ error }}</div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Recuperar contraseña — DD Manager' })

const form = reactive({ email: '' })
const loading = ref(false)
const sent = ref(false)
const error = ref('')

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/forgot-password', { method: 'POST', body: { email: form.email } })
    sent.value = true
  } catch (err: any) {
    error.value = err.data?.message ?? 'Error al enviar el enlace.'
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 4: Test auth pages visually**

```bash
npm run dev
```

- Go to `/auth/login`: hero left + form right, no sidebar, gold CTA button
- Go to `/auth/register`: same hero, extra fields
- Go to `/auth/forgot-password`: same hero

- [ ] **Step 5: Commit**

```bash
git add pages/auth/
git commit -m "feat: rewrite auth pages with Dark Fantasy split-screen design"
```

---

## Task 5: Dashboard components + page

**Files:**
- Create: `components/dashboard/DashboardStats.vue`
- Create: `components/dashboard/CharacterCard.vue`
- Create: `tests/components/dashboard/CharacterCard.test.ts`
- Modify: `pages/dashboard/index.vue` (full rewrite)

- [ ] **Step 1: Write the failing CharacterCard test**

Create `tests/components/dashboard/CharacterCard.test.ts`:

```ts
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'
import CharacterCard from '~/components/dashboard/CharacterCard.vue'

const base = { id: '1', name: 'Thorin', class: 'Guerrero', level: 8, hitPoints: 84, maxHitPoints: 84, armorClass: 18, avatar: null, userId: null, ownerId: null }

describe('CharacterCard', () => {
  it('hides DM actions when isDM is false', async () => {
    const w = await mountSuspended(CharacterCard, { props: { character: base, isDM: false } })
    expect(w.find('[data-testid="dm-actions"]').exists()).toBe(false)
  })

  it('shows DM actions when isDM is true', async () => {
    const w = await mountSuspended(CharacterCard, { props: { character: base, isDM: true } })
    expect(w.find('[data-testid="dm-actions"]').exists()).toBe(true)
  })

  it('shows red HP badge when HP is below 50%', async () => {
    const w = await mountSuspended(CharacterCard, { props: { character: { ...base, hitPoints: 30, maxHitPoints: 84 }, isDM: false } })
    // GoldBadge renders with red variant — check for red text class
    expect(w.find('[data-testid="hp-badge"]').classes()).toContain('text-red-400')
  })

  it('shows yellow HP badge when HP is between 50% and 75%', async () => {
    const w = await mountSuspended(CharacterCard, { props: { character: { ...base, hitPoints: 55, maxHitPoints: 84 }, isDM: false } })
    expect(w.find('[data-testid="hp-badge"]').classes()).toContain('text-yellow-400')
  })
})
```

- [ ] **Step 2: Run test — confirm FAIL**

```bash
npx vitest run tests/components/dashboard/CharacterCard.test.ts
```

Expected: FAIL — "Cannot find module '~/components/dashboard/CharacterCard.vue'"

- [ ] **Step 3: Create components/dashboard/DashboardStats.vue**

```vue
<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
    <StatCard label="Personajes" :value="stats.total"      variant="gold"    />
    <StatCard label="Asignados"  :value="stats.assigned"   variant="purple"  />
    <StatCard label="Sin asignar" :value="stats.unassigned"                  />
    <StatCard label="En batalla" :value="stats.inBattle"   variant="red"     />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: { total: number; assigned: number; unassigned: number; inBattle: number }
}>()
</script>
```

- [ ] **Step 4: Create components/dashboard/CharacterCard.vue**

```vue
<template>
  <div
    class="dd-card p-4 flex flex-col gap-3 transition-colors cursor-pointer hover:border-dd-gold/30"
    @click="navigateTo(`/characters/${character.id}`)"
  >
    <!-- Top -->
    <div class="flex items-center gap-3">
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 overflow-hidden"
        style="background: linear-gradient(135deg, #1e3a5f, #2d1b69); border: 1px solid var(--dd-border-subtle);"
      >
        <img v-if="character.avatar" :src="character.avatar" :alt="character.name" class="w-full h-full object-cover" />
        <span v-else>🧙</span>
      </div>
      <div class="min-w-0">
        <p class="text-sm font-semibold text-dd-text truncate">{{ character.name }}</p>
        <p class="text-xs text-dd-muted">
          {{ [character.class, character.level ? `Nv ${character.level}` : null].filter(Boolean).join(' · ') }}
        </p>
      </div>
    </div>

    <!-- Badges -->
    <div class="flex flex-wrap gap-1.5">
      <GoldBadge data-testid="hp-badge" :variant="hpVariant">
        HP {{ character.hitPoints }}/{{ character.maxHitPoints }}
        <span v-if="hpVariant === 'red'">⚠</span>
      </GoldBadge>
      <GoldBadge>CA {{ character.armorClass }}</GoldBadge>
      <GoldBadge v-if="assignedPlayer" variant="purple">{{ assignedPlayer }}</GoldBadge>
      <span v-else class="text-[10px] text-dd-muted/60">Sin asignar</span>
    </div>

    <!-- DM actions -->
    <div
      v-if="isDM"
      data-testid="dm-actions"
      class="flex gap-1.5 pt-2 border-t"
      style="border-color: var(--dd-border-subtle);"
      @click.stop
    >
      <button
        class="flex-1 text-xs py-1.5 rounded font-medium"
        style="background: var(--dd-glow-purple); border: 1px solid rgba(139,47,201,0.3); color: #a78bfa;"
        @click="$emit('edit', character)"
      >✏ Editar</button>
      <button
        class="flex-1 text-xs py-1.5 rounded text-dd-muted hover:text-dd-secondary"
        style="background: rgba(255,255,255,0.04); border: 1px solid var(--dd-border-subtle);"
        @click="$emit('reassign', character)"
      >👤 Asignar</button>
      <button
        class="flex-1 text-xs py-1.5 rounded text-dd-muted hover:text-dd-secondary"
        style="background: rgba(255,255,255,0.04); border: 1px solid var(--dd-border-subtle);"
        @click="$emit('combat', character)"
      >⚔ Combate</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CharacterData } from '~/types/frontend'

type CardChar = Pick<CharacterData, 'id' | 'name' | 'class' | 'level' | 'hitPoints' | 'maxHitPoints' | 'armorClass' | 'avatar' | 'userId' | 'ownerId'>

const props = defineProps<{ character: CardChar; isDM: boolean; assignedPlayer?: string }>()
defineEmits<{ edit: [c: CardChar]; reassign: [c: CardChar]; combat: [c: CardChar] }>()

const hpPercent = computed(() => (props.character.hitPoints / props.character.maxHitPoints) * 100)
const hpVariant = computed(() => {
  if (hpPercent.value < 50) return 'red'
  if (hpPercent.value < 75) return 'yellow'
  return 'default'
})
</script>
```

- [ ] **Step 5: Run test — confirm PASS**

```bash
npx vitest run tests/components/dashboard/CharacterCard.test.ts
```

Expected: PASS — 4 tests passing.

- [ ] **Step 6: Rewrite pages/dashboard/index.vue**

```vue
<template>
  <div class="p-5 lg:p-7">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-dd-text">Dashboard</h1>
        <p class="text-xs text-dd-muted mt-0.5">{{ characters.length }} personaje{{ characters.length !== 1 ? 's' : '' }} en campaña</p>
      </div>
      <button v-if="isDM" class="dd-btn-primary px-4 py-2 text-sm rounded-lg" @click="showCreate = true">
        + Crear personaje
      </button>
    </div>

    <DashboardStats :stats="stats" />

    <p class="dd-section-label">Personajes</p>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="dd-card h-32 animate-pulse" />
    </div>

    <!-- Empty -->
    <div v-else-if="visibleCharacters.length === 0" class="dd-card p-10 text-center">
      <p class="text-4xl mb-3">⚔</p>
      <p class="text-sm text-dd-secondary mb-4">No hay personajes aún.</p>
      <button v-if="isDM" class="dd-btn-primary px-5 py-2 text-sm rounded-lg" @click="showCreate = true">Crear el primero</button>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CharacterCard
        v-for="char in visibleCharacters"
        :key="char.id"
        :character="char"
        :is-d-m="isDM"
        @edit="(c) => navigateTo(`/characters/${c.id}`)"
        @reassign="() => {}"
        @combat="() => {}"
      />
    </div>

    <CreateCharacterModal
      v-if="showCreate && isDM"
      @close="showCreate = false"
      @created="onCreated"
    />
  </div>
</template>

<script setup lang="ts">
import type { CharacterData, UserData } from '~/types/frontend'

definePageMeta({ middleware: ['auth'] })
useSeoMeta({ title: 'Dashboard — DD Manager' })

const user = useState<UserData | null>('user')
const isDM = computed(() => user.value?.role === 'DM' || user.value?.role === 'ADMIN')

const characters = ref<CharacterData[]>([])
const loading = ref(true)
const showCreate = ref(false)

const visibleCharacters = computed(() =>
  isDM.value ? characters.value : characters.value.filter(c => c.userId === user.value?.id || c.ownerId === user.value?.id)
)

const stats = computed(() => ({
  total:     characters.value.length,
  assigned:  characters.value.filter(c => c.userId).length,
  unassigned: characters.value.filter(c => !c.userId).length,
  inBattle:  0,
}))

async function fetchCharacters() {
  loading.value = true
  try {
    const res = await $fetch('/api/characters') as any
    characters.value = res.data ?? res
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function onCreated() {
  showCreate.value = false
  fetchCharacters()
}

onMounted(fetchCharacters)
</script>
```

- [ ] **Step 7: Verify dashboard**

```bash
npm run dev
```

Log in as DM → `/dashboard`. Confirm: stat cards render, character grid shows, "Crear personaje" button visible. Log in as Player → only their character shows, no action buttons.

- [ ] **Step 8: Commit**

```bash
git add components/dashboard/ pages/dashboard/index.vue tests/components/dashboard/
git commit -m "feat: add dashboard with stats grid and role-aware character cards"
```

---

## Task 6: Character sheet — header + ability scores

**Files:**
- Create: `components/character/CharacterHeader.vue`
- Create: `components/character/AbilityScores.vue`

- [ ] **Step 1: Create components/character/CharacterHeader.vue**

```vue
<template>
  <div class="flex items-center gap-4 pb-4" style="border-bottom: 1px solid var(--dd-border-gold);">
    <!-- Avatar -->
    <div
      class="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden"
      style="background: linear-gradient(135deg, #1e3a5f, #2d1b69); border: 2px solid var(--dd-border-gold);"
    >
      <img v-if="character.avatar" :src="character.avatar" :alt="character.name" class="w-full h-full object-cover" />
      <span v-else>🧙</span>
    </div>

    <!-- Identity -->
    <div class="flex-1 min-w-0">
      <h1 class="text-lg font-extrabold text-dd-text leading-tight">{{ character.name }}</h1>
      <p class="text-xs text-dd-muted mt-0.5">
        {{ [character.race, character.class, character.level ? `Nivel ${character.level}` : null, character.alignment].filter(Boolean).join(' · ') }}
      </p>
    </div>

    <!-- XP -->
    <div class="text-right flex-shrink-0">
      <p class="text-[10px] text-dd-muted mb-0.5">Experiencia</p>
      <p class="text-sm font-bold text-dd-gold">{{ character.experiencePoints.toLocaleString('es') }}</p>
      <div class="w-20 h-1 rounded-full mt-1.5" style="background: rgba(255,255,255,0.08);">
        <div class="h-full rounded-full" style="background: linear-gradient(90deg, #8b2fc9, #c9a84c);" :style="{ width: xpProgress + '%' }" />
      </div>
    </div>

    <!-- DM edit button -->
    <button
      v-if="canEdit"
      class="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-dd-muted hover:text-dd-secondary transition-colors"
      style="background: rgba(255,255,255,0.04); border: 1px solid var(--dd-border-subtle);"
      @click="$emit('edit')"
    >
      ✏ Editar
    </button>
  </div>
</template>

<script setup lang="ts">
import type { CharacterData } from '~/types/frontend'

const props = defineProps<{ character: CharacterData; canEdit: boolean }>()
defineEmits<{ edit: [] }>()

// XP thresholds by level (simplified — shows % to next level)
const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000]

const xpProgress = computed(() => {
  const lvl = Math.min(props.character.level, 19)
  const current = props.character.experiencePoints
  const start = XP_THRESHOLDS[lvl - 1] ?? 0
  const end = XP_THRESHOLDS[lvl] ?? XP_THRESHOLDS[19]
  if (end <= start) return 100
  return Math.min(100, Math.round(((current - start) / (end - start)) * 100))
})
</script>
```

- [ ] **Step 2: Create components/character/AbilityScores.vue**

```vue
<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="ability in abilities"
      :key="ability.key"
      class="rounded-lg p-2.5 text-center"
      style="background: rgba(255,255,255,0.03); border: 1px solid var(--dd-border-subtle);"
    >
      <p class="text-[9px] font-semibold uppercase tracking-widest text-dd-muted mb-1">{{ ability.label }}</p>
      <p class="text-2xl font-extrabold text-dd-text leading-none">{{ ability.score }}</p>
      <span
        class="inline-block mt-1 text-[10px] font-bold rounded px-1.5 py-0.5"
        style="background: rgba(255,255,255,0.08); color: #9ca3af;"
      >{{ formatMod(ability.score) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CharacterData } from '~/types/frontend'

const props = defineProps<{
  character: Pick<CharacterData, 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'>
}>()

const abilities = computed(() => [
  { key: 'strength',     label: 'Fuerza',        score: props.character.strength     },
  { key: 'dexterity',    label: 'Destreza',       score: props.character.dexterity    },
  { key: 'constitution', label: 'Constitución',   score: props.character.constitution },
  { key: 'intelligence', label: 'Inteligencia',   score: props.character.intelligence },
  { key: 'wisdom',       label: 'Sabiduría',      score: props.character.wisdom       },
  { key: 'charisma',     label: 'Carisma',        score: props.character.charisma     },
])

function mod(score: number) { return Math.floor((score - 10) / 2) }
function formatMod(score: number) { const m = mod(score); return m >= 0 ? `+${m}` : `${m}` }
</script>
```

- [ ] **Step 3: Verify components render in isolation**

```bash
npm run dev
```

No page uses these yet — no errors expected on existing pages.

- [ ] **Step 4: Commit**

```bash
git add components/character/CharacterHeader.vue components/character/AbilityScores.vue
git commit -m "feat: add CharacterHeader and AbilityScores components"
```

---

## Task 7: Character sheet — combat stats + skills + saving throws

**Files:**
- Create: `components/character/CombatStats.vue`
- Create: `components/character/SkillsList.vue`
- Create: `components/character/SavingThrows.vue`

- [ ] **Step 1: Create components/character/CombatStats.vue**

```vue
<template>
  <div class="grid grid-cols-4 gap-2">
    <!-- HP -->
    <div class="rounded-lg p-2.5 text-center" style="background: var(--dd-glow-red); border: 1px solid rgba(239,68,68,0.25);">
      <p class="text-[9px] font-semibold uppercase tracking-widest text-red-400 mb-1">HP</p>
      <p class="text-2xl font-extrabold text-dd-text leading-none">{{ character.hitPoints }}</p>
      <p class="text-[10px] text-dd-muted mt-0.5">/{{ character.maxHitPoints }}</p>
      <p v-if="character.tempHitPoints > 0" class="text-[9px] text-blue-400 mt-0.5">+{{ character.tempHitPoints }} temp</p>
    </div>

    <!-- AC -->
    <div class="rounded-lg p-2.5 text-center" style="background: var(--dd-glow-gold); border: 1px solid var(--dd-border-gold);">
      <p class="text-[9px] font-semibold uppercase tracking-widest text-dd-gold mb-1">CA</p>
      <p class="text-2xl font-extrabold text-dd-text leading-none">{{ character.armorClass }}</p>
    </div>

    <!-- Initiative -->
    <div class="rounded-lg p-2.5 text-center" style="background: var(--dd-glow-purple); border: 1px solid rgba(139,47,201,0.25);">
      <p class="text-[9px] font-semibold uppercase tracking-widest text-purple-400 mb-1">Inic.</p>
      <p class="text-2xl font-extrabold text-dd-text leading-none">{{ formatMod(character.initiative) }}</p>
    </div>

    <!-- Speed -->
    <div class="rounded-lg p-2.5 text-center" style="background: rgba(255,255,255,0.03); border: 1px solid var(--dd-border-subtle);">
      <p class="text-[9px] font-semibold uppercase tracking-widest text-dd-muted mb-1">Vel.</p>
      <p class="text-2xl font-extrabold text-dd-text leading-none">{{ character.speed }}</p>
      <p class="text-[9px] text-dd-muted">pies</p>
    </div>

    <!-- Death saves — shown only when HP = 0 -->
    <div v-if="character.hitPoints === 0" class="col-span-4 rounded-lg p-3" style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);">
      <p class="text-[10px] text-red-400 font-semibold uppercase tracking-wider mb-2">Tiradas de Muerte</p>
      <div class="flex gap-4">
        <div>
          <p class="text-[9px] text-green-400 mb-1">Éxitos</p>
          <div class="flex gap-1">
            <div v-for="i in 3" :key="i" class="w-4 h-4 rounded-full border" :class="i <= character.deathSaveSuccesses ? 'bg-green-500 border-green-500' : 'border-zinc-600'" />
          </div>
        </div>
        <div>
          <p class="text-[9px] text-red-400 mb-1">Fallos</p>
          <div class="flex gap-1">
            <div v-for="i in 3" :key="i" class="w-4 h-4 rounded-full border" :class="i <= character.deathSaveFailures ? 'bg-red-500 border-red-500' : 'border-zinc-600'" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CharacterData } from '~/types/frontend'

defineProps<{
  character: Pick<CharacterData, 'hitPoints' | 'maxHitPoints' | 'tempHitPoints' | 'armorClass' | 'initiative' | 'speed' | 'deathSaveSuccesses' | 'deathSaveFailures'>
}>()

function formatMod(n: number) { return n >= 0 ? `+${n}` : `${n}` }
</script>
```

- [ ] **Step 2: Create components/character/SkillsList.vue**

```vue
<template>
  <div class="rounded-lg p-3 flex-1" style="background: rgba(255,255,255,0.02); border: 1px solid var(--dd-border-subtle);">
    <p class="dd-section-label">Habilidades</p>
    <div class="grid grid-cols-2 gap-x-3 gap-y-1">
      <div v-for="skill in sortedSkills" :key="skill.id" class="flex items-center gap-1.5">
        <ProficiencyDot :variant="dotVariant(skill)" />
        <span class="text-[10px] text-dd-secondary flex-1 truncate">{{ skill.name }}</span>
        <span class="text-[10px] font-bold text-dd-gold">{{ formatBonus(skill) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CharacterData, CharacterSkill, ProficiencyVariant } from '~/types/frontend'

const props = defineProps<{
  skills: CharacterSkill[]
  abilityScores: Pick<CharacterData, 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'>
  proficiencyBonus: number
}>()

const sortedSkills = computed(() => [...props.skills].sort((a, b) => a.name.localeCompare(b.name)))

function abilityMod(ability: string): number {
  const score = props.abilityScores[ability.toLowerCase() as keyof typeof props.abilityScores] ?? 10
  return Math.floor((score - 10) / 2)
}

function formatBonus(skill: CharacterSkill): string {
  const base = abilityMod(skill.ability)
  const prof = skill.expertise ? props.proficiencyBonus * 2 : skill.proficient ? props.proficiencyBonus : 0
  const total = base + prof
  return total >= 0 ? `+${total}` : `${total}`
}

function dotVariant(skill: CharacterSkill): ProficiencyVariant {
  if (skill.expertise) return 'expertise'
  if (skill.proficient) return 'proficient'
  return 'none'
}
</script>
```

- [ ] **Step 3: Create components/character/SavingThrows.vue**

```vue
<template>
  <div class="rounded-lg p-3" style="background: rgba(255,255,255,0.02); border: 1px solid var(--dd-border-subtle);">
    <p class="dd-section-label">Tiradas de Salvación</p>
    <div class="flex flex-col gap-1">
      <div v-for="save in saves" :key="save.ability" class="flex items-center gap-1.5">
        <ProficiencyDot :variant="save.proficient ? 'proficient' : 'none'" />
        <span class="text-[10px] text-dd-secondary flex-1">{{ LABELS[save.ability] ?? save.ability }}</span>
        <span class="text-[10px] font-bold text-dd-gold">{{ formatBonus(save) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CharacterData, CharacterSavingThrow } from '~/types/frontend'

const LABELS: Record<string, string> = {
  strength: 'Fuerza', dexterity: 'Destreza', constitution: 'Constitución',
  intelligence: 'Inteligencia', wisdom: 'Sabiduría', charisma: 'Carisma',
}

const props = defineProps<{
  savingThrows: CharacterSavingThrow[]
  abilityScores: Pick<CharacterData, 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'>
  proficiencyBonus: number
}>()

const ORDER = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
const saves = computed(() => ORDER.map(ability => props.savingThrows.find(s => s.ability === ability) ?? { id: ability, ability, proficient: false }))

function formatBonus(save: CharacterSavingThrow): string {
  const score = props.abilityScores[save.ability as keyof typeof props.abilityScores] ?? 10
  const base = Math.floor((score - 10) / 2)
  const prof = save.proficient ? props.proficiencyBonus : 0
  const total = base + prof
  return total >= 0 ? `+${total}` : `${total}`
}
</script>
```

- [ ] **Step 4: Commit**

```bash
git add components/character/CombatStats.vue components/character/SkillsList.vue components/character/SavingThrows.vue
git commit -m "feat: add CombatStats, SkillsList, and SavingThrows components"
```

---

## Task 8: Character sheet — attacks + spells + inventory + notes

**Files:**
- Create: `components/character/AttacksList.vue`
- Create: `components/character/SpellsPanel.vue`
- Create: `components/character/InventoryPanel.vue`
- Create: `components/character/CharacterNotes.vue`

- [ ] **Step 1: Create components/character/AttacksList.vue**

```vue
<template>
  <div class="rounded-lg p-3 flex-1" style="background: rgba(255,255,255,0.02); border: 1px solid var(--dd-border-subtle);">
    <p class="dd-section-label">Ataques</p>
    <div v-if="attacks.length === 0" class="text-center py-4 text-xs text-dd-muted">Sin ataques registrados</div>
    <div v-else class="flex flex-col divide-y" style="--tw-divide-opacity: 1; border-color: var(--dd-border-subtle);">
      <div v-for="attack in attacks" :key="attack.id" class="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
        <span class="flex-1 text-xs font-semibold text-dd-text truncate">{{ attack.name }}</span>
        <span class="text-xs font-bold text-dd-gold w-8 text-right">{{ formatBonus(attack.attackBonus) }}</span>
        <span class="text-xs text-red-400 w-16 text-right">
          {{ [attack.damageDice, attack.damageBonus ? formatBonus(attack.damageBonus) : null].filter(Boolean).join(' ') }}
          <span v-if="attack.damageType" class="text-dd-muted">{{ attack.damageType }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CharacterAttack } from '~/types/frontend'

defineProps<{ attacks: CharacterAttack[] }>()

function formatBonus(n: number | null): string {
  if (n === null) return '—'
  return n >= 0 ? `+${n}` : `${n}`
}
</script>
```

- [ ] **Step 2: Create components/character/SpellsPanel.vue**

```vue
<template>
  <div class="space-y-4">
    <!-- Spell slots -->
    <div v-if="usedSlots.length > 0" class="rounded-lg p-3" style="background: rgba(255,255,255,0.02); border: 1px solid var(--dd-border-subtle);">
      <p class="dd-section-label">Espacios de hechizo</p>
      <div class="flex flex-wrap gap-2">
        <div v-for="slot in usedSlots" :key="slot.level" class="text-center">
          <p class="text-[9px] text-dd-muted mb-1">Nv {{ slot.level }}</p>
          <div class="flex gap-1">
            <div
              v-for="i in slot.total"
              :key="i"
              class="w-3.5 h-3.5 rounded-full border"
              :class="i <= (slot.total - slot.used) ? 'bg-dd-purple border-dd-purple' : 'border-zinc-600'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Spells by level -->
    <div v-for="(group, level) in spellsByLevel" :key="level">
      <p class="dd-section-label">{{ level === '0' ? 'Trucos' : `Nivel ${level}` }}</p>
      <div class="rounded-lg overflow-hidden" style="border: 1px solid var(--dd-border-subtle);">
        <div
          v-for="(cs, i) in group"
          :key="cs.id"
          class="flex items-center gap-3 px-3 py-2"
          :class="i < group.length - 1 ? 'border-b' : ''"
          style="border-color: var(--dd-border-subtle);"
        >
          <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="cs.prepared ? 'bg-dd-gold' : 'bg-transparent border border-zinc-600'" />
          <span class="flex-1 text-xs text-dd-text">{{ cs.spell.name }}</span>
          <span class="text-[9px] text-dd-muted">{{ cs.spell.school }}</span>
        </div>
      </div>
    </div>

    <div v-if="spells.length === 0" class="text-center py-8 text-xs text-dd-muted">Sin hechizos registrados</div>
  </div>
</template>

<script setup lang="ts">
import type { CharacterSpell, SpellSlot } from '~/types/frontend'

const props = defineProps<{ spells: CharacterSpell[]; spellSlots: SpellSlot[] }>()

const usedSlots = computed(() => props.spellSlots.filter(s => s.total > 0).sort((a, b) => a.level - b.level))

const spellsByLevel = computed(() => {
  const groups: Record<string, CharacterSpell[]> = {}
  for (const cs of props.spells) {
    const lvl = String(cs.spell.level)
    if (!groups[lvl]) groups[lvl] = []
    groups[lvl].push(cs)
  }
  return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b)))
})
</script>
```

- [ ] **Step 3: Create components/character/InventoryPanel.vue**

```vue
<template>
  <div>
    <p class="dd-section-label">Inventario</p>
    <div v-if="inventory.length === 0" class="text-center py-8 text-xs text-dd-muted">Sin objetos</div>
    <div v-else class="rounded-lg overflow-hidden" style="border: 1px solid var(--dd-border-subtle);">
      <div
        v-for="(item, i) in inventory"
        :key="item.id"
        class="flex items-center gap-3 px-3 py-2.5"
        :class="i < inventory.length - 1 ? 'border-b' : ''"
        style="border-color: var(--dd-border-subtle);"
      >
        <span class="text-sm">{{ item.equipped ? '🛡' : '🎒' }}</span>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-dd-text truncate">{{ item.name }}</p>
          <p v-if="item.description" class="text-[10px] text-dd-muted truncate">{{ item.description }}</p>
        </div>
        <div class="text-right flex-shrink-0">
          <p class="text-xs text-dd-secondary">x{{ item.quantity }}</p>
          <p v-if="item.weight" class="text-[9px] text-dd-muted">{{ item.weight }} lb</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InventoryItem } from '~/types/frontend'

defineProps<{ inventory: InventoryItem[] }>()
</script>
```

- [ ] **Step 4: Create components/character/CharacterNotes.vue**

```vue
<template>
  <div class="space-y-4">
    <div v-for="field in fields" :key="field.key">
      <p class="dd-section-label">{{ field.label }}</p>
      <div
        class="rounded-lg px-3 py-2.5 text-xs text-dd-secondary leading-relaxed min-h-[56px] whitespace-pre-wrap"
        style="background: rgba(255,255,255,0.02); border: 1px solid var(--dd-border-subtle);"
      >
        {{ character[field.key] ?? '' }}
        <span v-if="!character[field.key]" class="text-dd-muted/40 italic">Sin completar</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CharacterData } from '~/types/frontend'

defineProps<{
  character: Pick<CharacterData, 'personality' | 'ideals' | 'bonds' | 'flaws' | 'backstory' | 'notes'>
}>()

const fields = [
  { key: 'personality' as const, label: 'Personalidad'   },
  { key: 'ideals'      as const, label: 'Ideales'        },
  { key: 'bonds'       as const, label: 'Vínculos'       },
  { key: 'flaws'       as const, label: 'Defectos'       },
  { key: 'backstory'   as const, label: 'Trasfondo'      },
  { key: 'notes'       as const, label: 'Notas'          },
]
</script>
```

- [ ] **Step 5: Commit**

```bash
git add components/character/AttacksList.vue components/character/SpellsPanel.vue components/character/InventoryPanel.vue components/character/CharacterNotes.vue
git commit -m "feat: add AttacksList, SpellsPanel, InventoryPanel, CharacterNotes components"
```

---

## Task 9: Character sheet page assembly

**Files:**
- Modify: `pages/characters/[id].vue` (full rewrite)

- [ ] **Step 1: Rewrite pages/characters/[id].vue**

```vue
<template>
  <div class="p-4 lg:p-6 max-w-6xl mx-auto">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-64">
      <p class="text-dd-muted text-sm animate-pulse">Cargando personaje...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="dd-card p-8 text-center">
      <p class="text-2xl mb-2">⚠</p>
      <p class="text-sm text-red-400">{{ error }}</p>
      <NuxtLink to="/dashboard" class="text-xs text-dd-gold mt-3 inline-block hover:opacity-80">← Volver al dashboard</NuxtLink>
    </div>

    <!-- Character sheet -->
    <template v-else-if="character">
      <CharacterHeader :character="character" :can-edit="canEdit" class="mb-5" @edit="toast.add({ title: 'Edición en desarrollo', color: 'yellow' })" />

      <!-- DESKTOP: 3-column panel grid -->
      <div class="hidden md:grid gap-4" style="grid-template-columns: 108px 1fr 160px;">
        <!-- Column 1: Ability scores -->
        <AbilityScores :character="character" />

        <!-- Column 2: Combat stats + Skills -->
        <div class="flex flex-col gap-3">
          <CombatStats :character="character" />
          <SkillsList :skills="character.skills" :ability-scores="character" :proficiency-bonus="character.proficiencyBonus" />
        </div>

        <!-- Column 3: Saving throws + Attacks -->
        <div class="flex flex-col gap-3">
          <SavingThrows :saving-throws="character.savingThrows" :ability-scores="character" :proficiency-bonus="character.proficiencyBonus" />
          <AttacksList :attacks="character.attacks" />
        </div>
      </div>

      <!-- MOBILE: tabs -->
      <div class="md:hidden">
        <!-- Tab bar -->
        <div class="flex overflow-x-auto gap-1 mb-4 pb-1" style="border-bottom: 1px solid var(--dd-border-subtle);">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors"
            :class="activeTab === tab.key
              ? 'text-dd-gold'
              : 'text-dd-muted hover:text-dd-secondary'"
            :style="activeTab === tab.key ? 'background: var(--dd-glow-gold); border: 1px solid var(--dd-border-gold);' : 'border: 1px solid transparent;'"
            @click="activeTab = tab.key"
          >
            {{ tab.icon }} {{ tab.label }}
          </button>
        </div>

        <!-- Tab panels -->
        <div v-show="activeTab === 'stats'" class="flex flex-col gap-3">
          <AbilityScores :character="character" />
          <SavingThrows :saving-throws="character.savingThrows" :ability-scores="character" :proficiency-bonus="character.proficiencyBonus" />
        </div>

        <div v-show="activeTab === 'combat'" class="flex flex-col gap-3">
          <CombatStats :character="character" />
          <AttacksList :attacks="character.attacks" />
        </div>

        <div v-show="activeTab === 'skills'">
          <SkillsList :skills="character.skills" :ability-scores="character" :proficiency-bonus="character.proficiencyBonus" />
        </div>

        <div v-show="activeTab === 'spells'">
          <SpellsPanel :spells="character.spells" :spell-slots="character.spellSlots" />
        </div>

        <div v-show="activeTab === 'inventory'">
          <InventoryPanel :inventory="character.inventory" />
        </div>

        <div v-show="activeTab === 'notes'">
          <CharacterNotes :character="character" />
        </div>
      </div>

      <!-- Desktop extra sections below grid -->
      <div class="hidden md:grid grid-cols-2 gap-4 mt-4">
        <SpellsPanel :spells="character.spells" :spell-slots="character.spellSlots" />
        <div class="flex flex-col gap-4">
          <InventoryPanel :inventory="character.inventory" />
          <CharacterNotes :character="character" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CharacterData, UserData } from '~/types/frontend'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const user = useState<UserData | null>('user')

const character = ref<CharacterData | null>(null)
const loading = ref(true)
const error = ref('')
const toast = useToast()

const canEdit = computed(() => {
  if (!user.value || !character.value) return false
  return user.value.role === 'DM' || user.value.role === 'ADMIN' || character.value.userId === user.value.id
})

type TabKey = 'stats' | 'combat' | 'skills' | 'spells' | 'inventory' | 'notes'
const activeTab = ref<TabKey>('stats')

const tabs: { key: TabKey; icon: string; label: string }[] = [
  { key: 'stats',     icon: '⚔',  label: 'Stats'      },
  { key: 'combat',    icon: '🗡',  label: 'Combate'    },
  { key: 'skills',    icon: '🎯',  label: 'Habilidades'},
  { key: 'spells',    icon: '✨',  label: 'Hechizos'   },
  { key: 'inventory', icon: '🎒',  label: 'Inventario' },
  { key: 'notes',     icon: '📜',  label: 'Notas'      },
]

async function fetchCharacter() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch(`/api/characters/${route.params.id}`) as any
    character.value = res.data ?? res
    if (character.value) {
      useSeoMeta({ title: `${character.value.name} — DD Manager` })
    }
  } catch (err: any) {
    error.value = err.statusCode === 404 ? 'Personaje no encontrado.' : 'Error al cargar el personaje.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchCharacter)
</script>
```

- [ ] **Step 2: Verify character sheet desktop layout**

```bash
npm run dev
```

Log in → dashboard → click a character. On desktop (≥768px) confirm:
- 3-column panel grid: ability scores left, combat+skills center, saves+attacks right
- CharacterHeader with avatar, name, XP bar
- Spells + inventory + notes below the grid

- [ ] **Step 3: Verify character sheet mobile layout**

Resize browser to mobile width (<768px) or use DevTools device emulation. Confirm:
- Tab bar appears (Stats / Combate / Habilidades / Hechizos / Inventario / Notas)
- Tapping each tab shows the correct panel
- Bottom nav still visible

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected output:
```
 PASS  tests/components/ui/ProficiencyDot.test.ts (3 tests)
 PASS  tests/components/dashboard/CharacterCard.test.ts (4 tests)

Test Files  2 passed (2)
Tests       7 passed (7)
```

- [ ] **Step 5: Final commit**

```bash
git add pages/characters/\[id\].vue
git commit -m "feat: assemble character sheet page with panel grid and mobile tabs"
```

---

## Done

All 5 success criteria from the spec are now met:

1. ✅ Auth pages match the Dark Fantasy design (split screen, gold CTA)
2. ✅ Dashboard shows character cards with DM actions gated by role
3. ✅ Character sheet panel grid on desktop, tabs on mobile
4. ✅ No file exceeds ~300 lines — all pages delegate to focused components
5. ✅ Existing API calls and auth middleware untouched
6. ✅ `.superpowers/` added to `.gitignore`
