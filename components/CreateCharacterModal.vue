<template>
  <UModal
    v-model="isOpen"
    :ui="{
      width: 'w-full sm:max-w-2xl',
      height: 'h-full sm:h-auto'
    }"
  >
    <UCard
      :ui="{
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800'
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Character
          </h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="closeModal"
          />
        </div>
      </template>

      <form @submit.prevent="submitForm" class="space-y-6">
        <!-- Player and Character Name -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Player Name" name="playerName">
            <UInput
              v-model="form.playerName"
              placeholder="Enter player name"
            />
          </UFormGroup>
          
          <UFormGroup label="Character Name" name="characterName" required>
            <UInput
              v-model="form.characterName"
              placeholder="Enter character name"
              required
            />
          </UFormGroup>
        </div>

        <!-- Race and Subrace -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Race" name="race">
            <UInput
              v-model="form.race"
              placeholder="Enter race (e.g., Human, Elf, Custom Race)"
            />
          </UFormGroup>
          
          <UFormGroup label="Subrace" name="subrace">
            <UInput
              v-model="form.subrace"
              placeholder="Enter subrace (optional)"
            />
          </UFormGroup>
        </div>

        <!-- Class and Level -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Class" name="className">
            <UInput
              v-model="form.className"
              placeholder="Enter class (e.g., Fighter, Wizard, Custom Class)"
            />
          </UFormGroup>
          
          <UFormGroup label="Level" name="classLevel">
            <UInput
              v-model.number="form.classLevel"
              type="number"
              min="1"
              max="20"
              placeholder="1"
            />
          </UFormGroup>
        </div>

        <!-- Background and Alignment -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Background" name="background">
            <UInput
              v-model="form.background"
              placeholder="Enter background (e.g., Soldier, Noble, Custom)"
            />
          </UFormGroup>
          
          <UFormGroup label="Alignment" name="alignment">
            <UInput
              v-model="form.alignment"
              placeholder="Enter alignment (e.g., Lawful Good, Custom)"
            />
          </UFormGroup>
        </div>

        <!-- Character Image -->
        <UFormGroup label="Character Image" name="avatar">
          <div class="flex items-center space-x-4">
            <UAvatar
              :src="form.avatar || '/placeholder-character.png'"
              :alt="form.characterName || 'Character'"
              size="lg"
            />
            <div class="flex-1">
              <UInput
                v-model="form.avatar"
                placeholder="Enter image URL"
              />
              <p class="text-xs text-gray-500 mt-1">
                Paste an image URL or upload to an image hosting service
              </p>
            </div>
          </div>
        </UFormGroup>

        <!-- Ability Scores -->
        <UAccordion :items="abilityScoreItems" multiple>
          <template #ability-scores>
            <div class="p-4 space-y-4">
              <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Ability Scores
              </h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <UFormGroup label="Strength" name="strength">
                  <div class="flex items-center space-x-2">
                    <UInput
                      v-model.number="form.strength"
                      type="number"
                      min="1"
                      max="30"
                      placeholder="10"
                      class="flex-1"
                    />
                    <UBadge 
                      :color="getModifierColor(getAbilityModifier(form.strength || 10))"
                      variant="soft"
                      size="sm"
                    >
                      {{ getAbilityModifierString(form.strength || 10) }}
                    </UBadge>
                  </div>
                </UFormGroup>
                
                <UFormGroup label="Dexterity" name="dexterity">
                  <div class="flex items-center space-x-2">
                    <UInput
                      v-model.number="form.dexterity"
                      type="number"
                      min="1"
                      max="30"
                      placeholder="10"
                      class="flex-1"
                    />
                    <UBadge 
                      :color="getModifierColor(getAbilityModifier(form.dexterity || 10))"
                      variant="soft"
                      size="sm"
                    >
                      {{ getAbilityModifierString(form.dexterity || 10) }}
                    </UBadge>
                  </div>
                </UFormGroup>
                
                <UFormGroup label="Constitution" name="constitution">
                  <div class="flex items-center space-x-2">
                    <UInput
                      v-model.number="form.constitution"
                      type="number"
                      min="1"
                      max="30"
                      placeholder="10"
                      class="flex-1"
                    />
                    <UBadge 
                      :color="getModifierColor(getAbilityModifier(form.constitution || 10))"
                      variant="soft"
                      size="sm"
                    >
                      {{ getAbilityModifierString(form.constitution || 10) }}
                    </UBadge>
                  </div>
                </UFormGroup>
                
                <UFormGroup label="Intelligence" name="intelligence">
                  <div class="flex items-center space-x-2">
                    <UInput
                      v-model.number="form.intelligence"
                      type="number"
                      min="1"
                      max="30"
                      placeholder="10"
                      class="flex-1"
                    />
                    <UBadge 
                      :color="getModifierColor(getAbilityModifier(form.intelligence || 10))"
                      variant="soft"
                      size="sm"
                    >
                      {{ getAbilityModifierString(form.intelligence || 10) }}
                    </UBadge>
                  </div>
                </UFormGroup>
                
                <UFormGroup label="Wisdom" name="wisdom">
                  <div class="flex items-center space-x-2">
                    <UInput
                      v-model.number="form.wisdom"
                      type="number"
                      min="1"
                      max="30"
                      placeholder="10"
                      class="flex-1"
                    />
                    <UBadge 
                      :color="getModifierColor(getAbilityModifier(form.wisdom || 10))"
                      variant="soft"
                      size="sm"
                    >
                      {{ getAbilityModifierString(form.wisdom || 10) }}
                    </UBadge>
                  </div>
                </UFormGroup>
                
                <UFormGroup label="Charisma" name="charisma">
                  <div class="flex items-center space-x-2">
                    <UInput
                      v-model.number="form.charisma"
                      type="number"
                      min="1"
                      max="30"
                      placeholder="10"
                      class="flex-1"
                    />
                    <UBadge 
                      :color="getModifierColor(getAbilityModifier(form.charisma || 10))"
                      variant="soft"
                      size="sm"
                    >
                      {{ getAbilityModifierString(form.charisma || 10) }}
                    </UBadge>
                  </div>
                </UFormGroup>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <UFormGroup label="Proficiency Bonus" name="proficiencyBonus">
                  <UInput
                    v-model.number="form.proficiencyBonus"
                    type="number"
                    min="1"
                    max="6"
                    placeholder="2"
                  />
                </UFormGroup>
                
                <UFormGroup label="Passive Perception" name="passivePerception">
                  <UInput
                    v-model.number="form.passivePerception"
                    type="number"
                    min="1"
                    placeholder="10"
                  />
                </UFormGroup>
              </div>
            </div>
          </template>
        </UAccordion>

        <!-- Skills Section -->
        <UAccordion :items="skillsItems" multiple>
          <template #skills>
            <div class="p-4 space-y-4">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-md font-semibold text-gray-900 dark:text-white">
                  Skills & Abilities
                </h4>
                <UButton
                  color="primary"
                  variant="soft"
                  size="sm"
                  icon="i-heroicons-plus"
                  @click="addNewSkill"
                >
                  Add Skill
                </UButton>
              </div>
              
              <div class="space-y-3" v-if="form.skills.length > 0">
                <div 
                  v-for="(skill, index) in form.skills" 
                  :key="index"
                  class="grid grid-cols-1 lg:grid-cols-5 gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <UFormGroup label="Name" name="skillName">
                    <UInput
                      v-model="skill.name"
                      placeholder="Skill name"
                    />
                  </UFormGroup>
                  
                  <UFormGroup label="Ability" name="skillAbility">
                    <USelect
                      v-model="skill.ability"
                      :options="abilityOptions"
                      placeholder="Choose ability"
                    />
                  </UFormGroup>
                  
                  <UFormGroup label="Category" name="skillCategory">
                    <USelect
                      v-model="skill.category"
                      :options="skillCategoryOptions"
                      placeholder="Category"
                    />
                  </UFormGroup>
                  
                  <div class="flex items-end space-x-2">
                    <UCheckbox
                      v-model="skill.proficient"
                      label="Proficient"
                    />
                    <UCheckbox
                      v-model="skill.expertise"
                      label="Expertise"
                      :disabled="!skill.proficient"
                    />
                  </div>
                  
                  <div class="flex items-end">
                    <UButton
                      color="red"
                      variant="ghost"
                      size="sm"
                      icon="i-heroicons-trash"
                      @click="removeSkill(index)"
                    >
                      Remove
                    </UButton>
                  </div>
                  
                  <!-- Description for custom skills -->
                  <div v-if="skill.category === 'OTRO'" class="lg:col-span-5">
                    <UFormGroup label="Description" name="skillDescription">
                      <UTextarea
                        v-model="skill.description"
                        placeholder="Describe what this skill does..."
                        :rows="2"
                      />
                    </UFormGroup>
                  </div>
                </div>
              </div>
              
              <div v-else class="text-center text-gray-500 dark:text-gray-400 py-8">
                No skills added yet. Click "Add Skill" to get started.
              </div>
            </div>
          </template>
        </UAccordion>

        <!-- Additional Sections -->
        <UAccordion :items="accordionItems" multiple>
          <template #basic-stats>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
              <UFormGroup label="Max HP" name="maxHp">
                <UInput
                  v-model.number="form.maxHp"
                  type="number"
                  min="1"
                  placeholder="8"
                />
              </UFormGroup>
              
              <UFormGroup label="Armor Class" name="armorClass">
                <UInput
                  v-model.number="form.armorClass"
                  type="number"
                  min="1"
                  placeholder="10"
                />
              </UFormGroup>
              
              <UFormGroup label="Speed" name="speed">
                <UInput
                  v-model.number="form.speed"
                  type="number"
                  min="0"
                  placeholder="30"
                />
              </UFormGroup>
              
              <UFormGroup label="Initiative" name="initiative">
                <UInput
                  v-model.number="form.initiative"
                  type="number"
                  placeholder="+0"
                />
              </UFormGroup>
            </div>
          </template>
          
          <template #physical>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
              <UFormGroup label="Age" name="age">
                <UInput
                  v-model.number="form.age"
                  type="number"
                  min="1"
                  placeholder="25"
                />
              </UFormGroup>
              
              <UFormGroup label="Height" name="height">
                <UInput
                  v-model="form.height"
                  placeholder="5'10&quot;"
                />
              </UFormGroup>
              
              <UFormGroup label="Weight" name="weight">
                <UInput
                  v-model="form.weight"
                  placeholder="180 lbs"
                />
              </UFormGroup>
              
              <UFormGroup label="Eyes" name="eyes">
                <UInput
                  v-model="form.eyes"
                  placeholder="Brown"
                />
              </UFormGroup>
              
              <UFormGroup label="Skin" name="skin">
                <UInput
                  v-model="form.skin"
                  placeholder="Tan"
                />
              </UFormGroup>
              
              <UFormGroup label="Hair" name="hair">
                <UInput
                  v-model="form.hair"
                  placeholder="Black"
                />
              </UFormGroup>
            </div>
          </template>
        </UAccordion>
      </form>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <UButton
            color="gray"
            variant="outline"
            @click="closeModal"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="submitForm"
            :loading="isSubmitting"
            :disabled="!isFormValid"
          >
            Create Character
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
interface Character {
  id: number
  playerName?: string
  characterName: string
  race?: string
  subrace?: string
  className?: string
  classLevel: number
  background?: string
  alignment?: string
  avatar?: string
  age?: number
  height?: string
  weight?: string
  eyes?: string
  skin?: string
  hair?: string
  maxHp: number
  currentHp: number
  armorClass?: number
  speed?: number
  initiative?: number
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  proficiencyBonus?: number
  passivePerception?: number
}

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [character: Character]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isSubmitting = ref(false)

const form = ref({
  playerName: '',
  characterName: '',
  race: '',
  subrace: '',
  className: '',
  classLevel: 1,
  background: '',
  alignment: '',
  avatar: '',
  maxHp: 8,
  armorClass: 10,
  speed: 30,
  initiative: 0,
  age: undefined as number | undefined,
  height: '',
  weight: '',
  eyes: '',
  skin: '',
  hair: '',
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  proficiencyBonus: 2,
  passivePerception: 10,
  skills: [] as Array<{
    name: string
    ability: string
    category: string
    proficient: boolean
    expertise: boolean
    description?: string
  }>
})

// Helper functions for ability scores
function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

function getAbilityModifierString(score: number): string {
  const modifier = getAbilityModifier(score)
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function getModifierColor(modifier: number): string {
  if (modifier >= 3) return 'green'
  if (modifier >= 1) return 'blue'
  if (modifier >= -1) return 'gray'
  if (modifier >= -3) return 'yellow'
  return 'red'
}

const abilityScoreItems = [
  {
    label: 'Ability Scores & Modifiers',
    icon: 'i-heroicons-chart-bar',
    slot: 'ability-scores',
    defaultOpen: true
  }
]

const skillsItems = [
  {
    label: 'Skills & Abilities',
    icon: 'i-heroicons-academic-cap',
    slot: 'skills',
    defaultOpen: false
  }
]

const accordionItems = [
  {
    label: 'Basic Combat Stats',
    icon: 'i-heroicons-shield-check',
    slot: 'basic-stats',
    defaultOpen: false
  },
  {
    label: 'Physical Characteristics',
    icon: 'i-heroicons-user',
    slot: 'physical',
    defaultOpen: false
  }
]

const abilityOptions = [
  { label: 'Strength', value: 'strength' },
  { label: 'Dexterity', value: 'dexterity' },
  { label: 'Constitution', value: 'constitution' },
  { label: 'Intelligence', value: 'intelligence' },
  { label: 'Wisdom', value: 'wisdom' },
  { label: 'Charisma', value: 'charisma' }
]

const skillCategoryOptions = [
  { label: 'Daño', value: 'DANO' },
  { label: 'Ayuda', value: 'AYUDA' },
  { label: 'Otro', value: 'OTRO' }
]

// Skill management functions
function addNewSkill() {
  form.value.skills.push({
    name: '',
    ability: '',
    category: 'OTRO',
    proficient: false,
    expertise: false,
    description: ''
  })
}

function removeSkill(index: number) {
  form.value.skills.splice(index, 1)
}

const isFormValid = computed(() => {
  return form.value.characterName.trim().length > 0
})

function closeModal() {
  emit('update:modelValue', false)
  resetForm()
}

function resetForm() {
  form.value = {
    playerName: '',
    characterName: '',
    race: '',
    subrace: '',
    className: '',
    classLevel: 1,
    background: '',
    alignment: '',
    avatar: '',
    maxHp: 8,
    armorClass: 10,
    speed: 30,
    initiative: 0,
    age: undefined,
    height: '',
    weight: '',
    eyes: '',
    skin: '',
    hair: '',
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    proficiencyBonus: 2,
    passivePerception: 10,
    skills: []
  }
}

async function submitForm() {
  if (!isFormValid.value || isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    const createData = {
      characterName: form.value.characterName,
      playerName: form.value.playerName || undefined,
      race: form.value.race || undefined,
      subrace: form.value.subrace || undefined,
      className: form.value.className || undefined,
      classLevel: form.value.classLevel,
      background: form.value.background || undefined,
      alignment: form.value.alignment || undefined,
      avatar: form.value.avatar || undefined,
      age: form.value.age || undefined,
      height: form.value.height || undefined,
      weight: form.value.weight || undefined,
      eyes: form.value.eyes || undefined,
      skin: form.value.skin || undefined,
      hair: form.value.hair || undefined,
      maxHp: form.value.maxHp,
      currentHp: form.value.maxHp, // Set current HP to max initially
      armorClass: form.value.armorClass,
      speed: form.value.speed,
      initiative: form.value.initiative,
      proficiencyBonus: form.value.proficiencyBonus,
      passivePerception: form.value.passivePerception,
      strength: form.value.strength,
      dexterity: form.value.dexterity,
      constitution: form.value.constitution,
      intelligence: form.value.intelligence,
      wisdom: form.value.wisdom,
      charisma: form.value.charisma
    }
    
    const response = await $fetch('/api/characters', {
      method: 'POST',
      body: createData
    })
    
    if (response.success && response.data) {
      emit('created', response.data)
      closeModal()
      
      // Show success notification
      const toast = useToast()
      toast.add({
        title: 'Character Created',
        description: `${form.value.characterName} has been created successfully!`,
        color: 'green'
      })
    } else {
      throw new Error(response.message || 'Failed to create character')
    }
  } catch (error: any) {
    console.error('Error creating character:', error)
    
    // Show error notification
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error.data?.message || error.message || 'Failed to create character. Please try again.',
      color: 'red'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>