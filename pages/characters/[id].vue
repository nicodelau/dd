<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100">
    <!-- Navigation Bar -->
    <nav class="border-b border-zinc-800 bg-zinc-900/90 backdrop-blur sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-14">
          <div class="flex items-center space-x-3">
            <UButton
              :to="(user?.role === 'DM' || user?.role === 'ADMIN') ? '/dashboard' : '/'"
              color="gray"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              size="xs"
            >
              {{ (user?.role === 'DM' || user?.role === 'ADMIN') ? t('backToDashboard') : t('backToHome') }}
            </UButton>
            
            <div class="h-4 border-l border-zinc-800"></div>
            
            <span class="text-sm font-mono font-bold tracking-tight text-zinc-100 truncate max-w-[200px] sm:max-w-sm">
              {{ character?.characterName || t('characterSheet') }}
            </span>
          </div>
          
          <div class="flex items-center space-x-2 font-mono">
            <UButton
              color="gray"
              variant="ghost"
              size="xs"
              icon="i-heroicons-language"
              @click="toggleLanguage"
            >
              {{ language === 'en' ? 'ES' : 'EN' }}
            </UButton>
            <UButton
              v-if="canEdit"
              color="gray"
              variant="outline"
              size="xs"
              :icon="editMode ? 'i-heroicons-x-mark' : 'i-heroicons-pencil'"
              :disabled="isLoading"
              @click="editMode = !editMode"
            >
              {{ editMode ? t('cancel') : t('edit') }}
            </UButton>
            
            <UButton
              v-if="editMode && canEdit"
              color="red"
              size="xs"
              icon="i-heroicons-check"
              :loading="isSaving"
              @click="saveCharacter"
            >
              {{ t('saveChanges') }}
            </UButton>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Workspace -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-zinc-200"></div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="text-center py-20 font-mono">
        <div class="mx-auto h-12 w-12 text-rose-500 mb-3">
          <svg class="h-full w-full" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
        </div>
        <h3 class="text-base font-bold text-zinc-200 mb-1">
          {{ t('characterNotFound') }}
        </h3>
        <p class="text-xs text-rose-400 mb-6">{{ error }}</p>
        <UButton color="gray" size="sm" :to="canEdit ? '/dashboard' : '/'">
          {{ canEdit ? t('backToDashboard') : t('backToHome') }}
        </UButton>
      </div>
      
      <!-- Character Loaded State -->
      <div v-else-if="character" class="space-y-6">
        <!-- Navigation Tabs (General, Atributos, Combate, Inventario, Magia) -->
        <div class="flex items-center gap-1.5 border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-none font-mono text-xs">
          <button
            v-for="tab in availableTabs"
            :key="tab.id"
            class="px-3 py-1.5 rounded transition-colors flex items-center gap-2 whitespace-nowrap"
            :class="activeTab === tab.id ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'"
            @click="activeTab = tab.id"
          >
            <UIcon :name="tab.icon" class="text-xs" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- Tab 1: General & Identity -->
        <div v-show="activeTab === 'general'">
          <CharacterHeader
            :character="character"
            :edit-mode="editMode"
            :edit-form="editForm"
            :can-edit="canEdit"
            :image-load-error="imageLoadError"
            :hp-adjustment="hpAdjustment"
            :stamina-adjustment="staminaAdjustment"
            @update:image-load-error="imageLoadError = $event"
            @update:hp-adjustment="hpAdjustment = $event"
            @update:stamina-adjustment="staminaAdjustment = $event"
            @adjust-hp="adjustHp"
            @adjust-stamina="adjustStamina"
            @adjust-stamina-by-amount="adjustStaminaByAmount"
          />
        </div>

        <!-- Tab 2: Ability Scores, Saving Throws & Skills -->
        <div v-show="activeTab === 'attributes'">
          <CharacterAttributes
            :character="character"
            :edit-mode="editMode"
            :edit-form="editForm"
            :saving-throw-proficient="savingThrowProficient"
            :skill-proficient="skillProficient"
          />
        </div>

        <!-- Tab 3: Combat, Attacks & Custom Actions -->
        <div v-show="activeTab === 'combat'">
          <CharacterCombatActions
            :character="character"
            :edit-mode="editMode"
            :edit-form="editForm"
            :can-edit="canEdit"
            :edit-attacks="editAttacks"
            :edit-combat-actions="editCombatActions"
            @add-attack="addAttack"
            @add-skill="addSkill"
            @remove-attack="removeAttack"
            @add-combat-action="addCombatAction"
            @remove-combat-action="removeCombatAction"
            @use-attack-magic-points="useAttackMagicPoints"
          />
        </div>

        <!-- Tab 4: Inventory & Currency -->
        <div v-show="activeTab === 'inventory'">
          <CharacterInventory
            :character="character"
            :edit-mode="editMode"
            :edit-form="editForm"
            :can-edit="canEdit"
            :edit-inventory="editInventory"
            :character-notes="characterNotes"
            @add-inventory-item="addInventoryItem"
            @remove-inventory-item="removeInventoryItem"
            @update:character-notes="characterNotes = $event"
          />
        </div>

        <!-- Tab 5: Spellbook & Magic Features -->
        <div v-show="activeTab === 'magic'">
          <CharacterSpellbook
            :character="character"
            :edit-mode="editMode"
            :edit-form="editForm"
            :can-edit="canEdit"
            @add-magic-ability="addMagicAbility"
            @remove-magic-ability="removeMagicAbility"
            @reset-magic-points="resetMagicPoints"
            @use-magic-ability="useMagicAbility"
            @use-attack-magic-points="useAttackMagicPoints"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { CharacterDTO } from '~/types/dtos'
import CharacterHeader from '~/components/character/CharacterHeader.vue'
import CharacterAttributes from '~/components/character/CharacterAttributes.vue'
import CharacterCombatActions from '~/components/character/CharacterCombatActions.vue'
import CharacterInventory from '~/components/character/CharacterInventory.vue'
import CharacterSpellbook from '~/components/character/CharacterSpellbook.vue'
import { standardSkills } from '~/utils/characterConstants'

const { t, toggleLanguage, language } = useTranslations()

const route = useRoute()
const characterId = route.params.id as string

// Authentication state
const user = useState('user')

// Check if user can edit character (DM, ADMIN, or owner)
const canEdit = computed(() => {
  const userRole = (user.value as any)?.role
  const userId = (user.value as any)?.id
  const characterOwnerId = character.value?.userId

  return userRole === 'DM' || userRole === 'ADMIN' || (characterOwnerId && userId === characterOwnerId)
})

// Reactive state
const character = ref<CharacterDTO | null>(null)
const activeTab = ref('general')
const editMode = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const imageLoadError = ref(false)
const hpAdjustment = ref<number | null>(null)
const staminaAdjustment = ref<number | null>(null)

// Form data
const editForm = ref<Record<string, any>>({})
const characterNotes = ref('')
const editAttacks = ref<any[]>([])
const editInventory = ref<any[]>([])
const editCombatActions = ref<any[]>([])

// Proficiency checkboxes
const savingThrowProficient = ref<Record<string, boolean>>({
  strength: false,
  dexterity: false,
  constitution: false,
  intelligence: false,
  wisdom: false,
  charisma: false
})
const skillProficient = ref<Record<string, boolean>>({})

const availableTabs = computed(() => {
  const tabs = [
    { id: 'general', label: t('basicInfo') || 'General', icon: 'i-heroicons-user' },
    { id: 'attributes', label: t('abilityScores') || 'Atributos', icon: 'i-heroicons-sparkles' },
    { id: 'combat', label: t('attacks') || 'Combate', icon: 'i-heroicons-shield-check' },
    { id: 'inventory', label: t('inventory') || 'Inventario', icon: 'i-heroicons-briefcase' }
  ]

  const isWizardActive = editMode.value ? editForm.value.isWizard : character.value?.notes?.isWizard
  if (isWizardActive) {
    tabs.push({ id: 'magic', label: 'Magia', icon: 'i-heroicons-bolt' })
  }
  return tabs
})

// Helper functions & mutations
function addAttack() {
  editAttacks.value.push({
    name: '',
    attackBonus: undefined,
    damage: '',
    damageType: '',
    attackCategory: 'arma',
    attackForm: 'melee',
    rangeText: '',
    notes: '',
    type: 'attack',
    tier: 'gris',
    isMagic: false,
    magicCost: 0
  })
}

function addSkill() {
  editAttacks.value.push({
    name: '',
    attackBonus: undefined,
    damage: '',
    damageType: '',
    attackCategory: 'habilidad',
    attackForm: 'melee',
    rangeText: '',
    notes: '',
    type: 'skill',
    tier: 'gris',
    isMagic: false,
    magicCost: 0
  })
}

function removeAttack(index: number) {
  editAttacks.value.splice(index, 1)
}

function addInventoryItem() {
  editInventory.value.push({
    name: '',
    quantity: 1,
    weight: undefined,
    equipped: false,
    notes: '',
    tier: 'gris'
  })
}

function removeInventoryItem(index: number) {
  editInventory.value.splice(index, 1)
}

function addCombatAction() {
  editCombatActions.value.push({
    name: '',
    type: 'Action',
    currentUses: 0,
    maxUses: 0,
    description: ''
  })
}

function removeCombatAction(index: number) {
  editCombatActions.value.splice(index, 1)
}

function addMagicAbility() {
  if (!editForm.value.magicAbilities) {
    editForm.value.magicAbilities = []
  }
  editForm.value.magicAbilities.push({
    name: '',
    tier: 'gris',
    cost: 5,
    notes: ''
  })
}

function removeMagicAbility(index: number) {
  editForm.value.magicAbilities?.splice(index, 1)
}

// HP & Stamina adjustments
async function adjustHp() {
  if (!character.value || !hpAdjustment.value || hpAdjustment.value === 0) return

  try {
    const newHp = Math.max(0, (character.value.currentHp || 0) + hpAdjustment.value)
    await $fetch(`/api/characters/${character.value.id}`, {
      method: 'PUT',
      body: { currentHp: newHp }
    })
    await loadCharacter()
    hpAdjustment.value = null
  } catch (err: any) {
    console.error('Error adjusting HP:', err)
  }
}

async function adjustStamina(newStamina: number) {
  if (!character.value) return

  try {
    await $fetch(`/api/characters/${character.value.id}`, {
      method: 'PATCH',
      body: { stamina: newStamina }
    })
    await loadCharacter()
  } catch (err: any) {
    console.error('Error adjusting stamina:', err)
  }
}

async function adjustStaminaByAmount() {
  if (!character.value || !staminaAdjustment.value || staminaAdjustment.value === 0) return

  try {
    const current = character.value.stamina !== undefined ? character.value.stamina : 100
    const max = character.value.maxStamina !== undefined ? character.value.maxStamina : 100
    const newStamina = Math.max(0, Math.min(max, current + staminaAdjustment.value))

    await $fetch(`/api/characters/${character.value.id}`, {
      method: 'PATCH',
      body: { stamina: newStamina }
    })
    await loadCharacter()
    staminaAdjustment.value = null
  } catch (err: any) {
    console.error('Error adjusting stamina by amount:', err)
  }
}

// Magic system actions
async function useMagicAbility(ability: any) {
  if (!character.value) return
  
  const updatedNotes = character.value.notes ? JSON.parse(JSON.stringify(character.value.notes)) : {}
  if (!updatedNotes.magicAbilities) updatedNotes.magicAbilities = []
  
  const targetAbility = updatedNotes.magicAbilities.find((a: any) => a.name === ability.name)
  if (targetAbility) {
    targetAbility.usedCount = (targetAbility.usedCount || 0) + 1
  }
  
  try {
    const response = await $fetch<{success: boolean, data: CharacterDTO}>(`/api/characters/${characterId}`, {
      method: 'PUT',
      body: { notes: updatedNotes }
    })
    if (response.success) {
      character.value = response.data
      editForm.value = { ...response.data }
    }
  } catch (err: any) {
    console.error('Error consuming magic points:', err)
  }
}

async function useAttackMagicPoints(attack: any) {
  if (!character.value) return

  const updatedAttacks = character.value.attacks ? JSON.parse(JSON.stringify(character.value.attacks)) : []
  const target = updatedAttacks.find((a: any) => a.id === attack.id || (a.name === attack.name && a.type === attack.type))
  if (target) {
    target.usedCount = (target.usedCount || 0) + 1
  }

  try {
    const response = await $fetch<{success: boolean, data: CharacterDTO}>(`/api/characters/${characterId}`, {
      method: 'PUT',
      body: { attacks: updatedAttacks }
    })
    if (response.success) {
      character.value = response.data
      editForm.value = { ...response.data }
    }
  } catch (err: any) {
    console.error('Error consuming magic points for attack:', err)
  }
}

async function resetMagicPoints() {
  if (!character.value) return
  
  const updatedNotes = character.value.notes ? JSON.parse(JSON.stringify(character.value.notes)) : {}
  if (Array.isArray(updatedNotes.magicAbilities)) {
    updatedNotes.magicAbilities.forEach((ability: any) => {
      ability.usedCount = 0
    })
  }

  const updatedAttacks = character.value.attacks ? JSON.parse(JSON.stringify(character.value.attacks)) : []
  updatedAttacks.forEach((att: any) => {
    att.usedCount = 0
  })
  
  try {
    const response = await $fetch<{success: boolean, data: CharacterDTO}>(`/api/characters/${characterId}`, {
      method: 'PUT',
      body: { 
        notes: updatedNotes,
        attacks: updatedAttacks
      }
    })
    if (response.success) {
      character.value = response.data
      editForm.value = { ...response.data }
    }
  } catch (err: any) {
    console.error('Error resetting magic points:', err)
  }
}

// Load and Save character
async function loadCharacter() {
  isLoading.value = true
  error.value = null
  
  if (!characterId || characterId === 'create' || characterId.length < 5) {
    error.value = 'Invalid character ID'
    isLoading.value = false
    return
  }
  
  try {
    const response = await $fetch<{success: boolean, data: CharacterDTO}>(`/api/characters/${characterId}`)
    
    if (response.success) {
      character.value = response.data
      editForm.value = { ...response.data }
      const rawNotes = response.data.notes
      let notesObj: Record<string, any> = {}
      if (rawNotes && typeof rawNotes === 'object') {
        characterNotes.value = rawNotes.text || ''
        notesObj = rawNotes
      } else {
        characterNotes.value = typeof rawNotes === 'string' ? rawNotes : ''
        try {
          notesObj = rawNotes ? JSON.parse(rawNotes) : {}
        } catch {
          notesObj = {}
        }
      }
      
      editForm.value.isWizard = !!notesObj.isWizard
      editForm.value.magicLimit = notesObj.magicLimit !== undefined ? Number(notesObj.magicLimit) : 100
      editForm.value.magicAbilities = Array.isArray(notesObj.magicAbilities) ? notesObj.magicAbilities : []
      editForm.value.skillOverrides = notesObj.skillOverrides && typeof notesObj.skillOverrides === 'object' ? { ...notesObj.skillOverrides } : {}
      editForm.value.savingThrowOverrides = notesObj.savingThrowOverrides && typeof notesObj.savingThrowOverrides === 'object' ? { ...notesObj.savingThrowOverrides } : {}
      editForm.value.modifierGraph = notesObj.modifierGraph && typeof notesObj.modifierGraph === 'object' ? JSON.parse(JSON.stringify(notesObj.modifierGraph)) : { version: 1, modifiers: [] }
      imageLoadError.value = false

      editAttacks.value = response.data.attacks ? [...response.data.attacks] : []
      editInventory.value = response.data.inventory ? [...response.data.inventory] : []
      editCombatActions.value = response.data.combatActions ? [...response.data.combatActions] : []

      if (response.data.savingThrows) {
        response.data.savingThrows.forEach((save: any) => {
          savingThrowProficient.value[save.ability] = save.proficient
        })
      }

      if (response.data.skills) {
        response.data.skills.forEach((skill: any) => {
          skillProficient.value[skill.name] = skill.proficient
        })
      }
    } else {
      throw new Error('Character not found')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load character'
    console.error('Error loading character:', err)
  } finally {
    isLoading.value = false
  }
}

async function saveCharacter() {
  if (!character.value || !editForm.value) return

  isSaving.value = true

  try {
    const savingThrows = Object.entries(savingThrowProficient.value)
      .filter(([_, proficient]) => proficient)
      .map(([ability, proficient]) => ({ ability, proficient }))

    const skills = Object.entries(skillProficient.value)
      .filter(([_, proficient]) => proficient)
      .map(([name, proficient]) => {
        const skill = standardSkills.find(s => s.name === name)
        return {
          name,
          ability: skill?.ability || 'strength',
          proficient,
          expertise: false,
          category: 'OTRO'
        }
      })

    const { id, userId, ownerId, user, owner, createdAt, updatedAt, isWizard, magicLimit, magicAbilities, skillOverrides, savingThrowOverrides, modifierGraph, ...updateFields } = editForm.value

    const currentNotesObj = character.value.notes && typeof character.value.notes === 'object' ? { ...character.value.notes } : {}
    currentNotesObj.text = characterNotes.value
    currentNotesObj.isWizard = !!isWizard
    currentNotesObj.magicLimit = magicLimit !== undefined ? Number(magicLimit) : 100
    currentNotesObj.magicAbilities = Array.isArray(magicAbilities) ? magicAbilities : []
    currentNotesObj.skillOverrides = skillOverrides && typeof skillOverrides === 'object' ? { ...skillOverrides } : {}
    currentNotesObj.savingThrowOverrides = savingThrowOverrides && typeof savingThrowOverrides === 'object' ? { ...savingThrowOverrides } : {}
    const activeModGraph = modifierGraph || currentNotesObj.modifierGraph || { version: 1, modifiers: [] }
    if (activeModGraph && Array.isArray(activeModGraph.modifiers) && Array.isArray(editInventory.value)) {
      for (const mod of activeModGraph.modifiers) {
        if (mod.sourceType === 'item' && mod.sourceName) {
          const matchingItem = editInventory.value.find((i: any) => i.name === mod.sourceName || (i.id && i.id === mod.sourceId))
          if (matchingItem) {
            if (matchingItem.id) mod.sourceId = matchingItem.id
            mod.sourceName = matchingItem.name
          }
        }
      }
    }
    currentNotesObj.modifierGraph = activeModGraph

    const updateData = {
      ...updateFields,
      notes: currentNotesObj,
      attacks: editAttacks.value,
      inventory: editInventory.value,
      combatActions: editCombatActions.value,
      savingThrows,
      skills
    }
    
    const response = await $fetch<{success: boolean, data: CharacterDTO}>(`/api/characters/${characterId}`, {
      method: 'PUT',
      body: updateData
    })
    
    if (response.success) {
      character.value = response.data
      editForm.value = { ...response.data }
      editMode.value = false
    } else {
      throw new Error('Failed to update character')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to save character'
    console.error('Error saving character:', err)
  } finally {
    isSaving.value = false
  }
}

watch(editMode, (newValue) => {
  if (newValue && character.value) {
    editForm.value = { ...character.value }
    const notesObj = character.value.notes || {}
    editForm.value.isWizard = !!notesObj.isWizard
    editForm.value.magicLimit = notesObj.magicLimit !== undefined ? Number(notesObj.magicLimit) : 100
    editForm.value.magicAbilities = Array.isArray(notesObj.magicAbilities) ? JSON.parse(JSON.stringify(notesObj.magicAbilities)) : []
    editForm.value.skillOverrides = notesObj.skillOverrides && typeof notesObj.skillOverrides === 'object' ? { ...notesObj.skillOverrides } : {}
    editForm.value.savingThrowOverrides = notesObj.savingThrowOverrides && typeof notesObj.savingThrowOverrides === 'object' ? { ...notesObj.savingThrowOverrides } : {}
    editForm.value.modifierGraph = notesObj.modifierGraph && typeof notesObj.modifierGraph === 'object' ? JSON.parse(JSON.stringify(notesObj.modifierGraph)) : { version: 1, modifiers: [] }

    editAttacks.value = character.value.attacks ? [...character.value.attacks] : []
    editInventory.value = character.value.inventory ? [...character.value.inventory] : []
    editCombatActions.value = character.value.combatActions ? [...character.value.combatActions] : []
  }
})

onMounted(() => {
  loadCharacter()
})

useHead({
  title: computed(() => character.value?.characterName || 'Character Sheet'),
  meta: [
    { name: 'description', content: 'View and manage your D&D character' }
  ]
})
</script>
