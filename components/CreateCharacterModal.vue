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
        divide: 'divide-y divide-zinc-800 divide-zinc-800'
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white text-white">
            {{ t('createNewCharacter') }}
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
          <UFormGroup :label="t('playerName')" name="playerName">
            <UInput
              v-model="form.playerName"
              :placeholder="t('enterPlayerName')"
            />
          </UFormGroup>
          
          <UFormGroup :label="t('characterName')" name="characterName" required>
            <UInput
              v-model="form.characterName"
              :placeholder="t('enterCharacterName')"
              required
            />
          </UFormGroup>
        </div>

        <!-- Race and Subrace -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup :label="t('race')" name="race">
            <UInput
              v-model="form.race"
              :placeholder="t('enterRace')"
            />
          </UFormGroup>
          
          <UFormGroup :label="t('subrace')" name="subrace">
            <UInput
              v-model="form.subrace"
              :placeholder="t('enterSubrace')"
            />
          </UFormGroup>
        </div>

        <!-- Class and Level -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup :label="t('class')" name="className">
            <UInput
              v-model="form.className"
              :placeholder="t('enterClass')"
            />
          </UFormGroup>
          
          <UFormGroup :label="t('level')" name="classLevel">
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
          <UFormGroup :label="t('background')" name="background">
            <UInput
              v-model="form.background"
              :placeholder="t('enterBackground')"
            />
          </UFormGroup>
          
          <UFormGroup :label="t('alignment')" name="alignment">
            <UInput
              v-model="form.alignment"
              :placeholder="t('enterAlignment')"
            />
          </UFormGroup>
        </div>

        <!-- Character Image -->
        <UFormGroup :label="t('characterPortrait')" name="avatar">
          <div class="flex items-center space-x-4">
            <UAvatar
              :src="form.avatar || '/placeholder-character.png'"
              :alt="form.characterName || 'Character'"
              size="lg"
            />
            <div class="flex-1">
              <UInput
                v-model="form.avatar"
                :placeholder="t('enterImageUrl')"
              />
              <p class="text-xs text-gray-500 mt-1">
                {{ t('pasteImageUrl') }}
              </p>
            </div>
          </div>
        </UFormGroup>

        <!-- Ability Scores -->
        <UAccordion :items="abilityScoreItems" multiple>
          <template #ability-scores>
            <div class="p-4 space-y-4">
              <h4 class="text-md font-semibold text-white text-white mb-4">
                {{ t('abilityScores') }}
              </h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <UFormGroup :label="t('strength')" name="strength">
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
                
                <UFormGroup :label="t('dexterity')" name="dexterity">
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
                
                <UFormGroup :label="t('constitution')" name="constitution">
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
                
                <UFormGroup :label="t('intelligence')" name="intelligence">
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
                
                <UFormGroup :label="t('wisdom')" name="wisdom">
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
                
                <UFormGroup :label="t('charisma')" name="charisma">
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
                <UFormGroup :label="t('proficiencyBonus')" name="proficiencyBonus">
                  <UInput
                    v-model.number="form.proficiencyBonus"
                    type="number"
                    min="1"
                    max="6"
                    placeholder="2"
                  />
                </UFormGroup>
                
                <UFormGroup :label="t('passivePerception')" name="passivePerception">
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
                <h4 class="text-md font-semibold text-white text-white">
                  {{ t('skillsAndAbilities') }}
                </h4>
                <UButton
                  color="primary"
                  variant="soft"
                  size="sm"
                  icon="i-heroicons-plus"
                  @click="addNewSkill"
                >
                  {{ t('addSkill') }}
                </UButton>
              </div>
              
              <div class="space-y-3" v-if="form.skills.length > 0">
                <div 
                  v-for="(skill, index) in form.skills" 
                  :key="index"
                  class="grid grid-cols-1 lg:grid-cols-5 gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <UFormGroup :label="t('name')" name="skillName">
                    <UInput
                      v-model="skill.name"
                      :placeholder="t('skillName')"
                    />
                  </UFormGroup>
                  
                  <UFormGroup :label="t('ability')" name="skillAbility">
                    <USelect
                      v-model="skill.ability"
                      :options="abilityOptions"
                      :placeholder="t('chooseAbility')"
                    />
                  </UFormGroup>
                  
                  <UFormGroup :label="t('category')" name="skillCategory">
                    <USelect
                      v-model="skill.category"
                      :options="skillCategoryOptions"
                      :placeholder="t('category')"
                    />
                  </UFormGroup>
                  
                  <div class="flex items-end space-x-2">
                    <UCheckbox
                      v-model="skill.proficient"
                      :label="t('proficient')"
                    />
                    <UCheckbox
                      v-model="skill.expertise"
                      :label="t('expertise')"
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
                      {{ t('remove') }}
                    </UButton>
                  </div>
                  
                  <!-- Description for custom skills -->
                  <div v-if="skill.category === 'OTRO'" class="lg:col-span-5">
                    <UFormGroup :label="t('description')" name="skillDescription">
                      <UTextarea
                        v-model="skill.description"
                        :placeholder="t('skillDescriptionPlaceholder')"
                        :rows="2"
                      />
                    </UFormGroup>
                  </div>
                </div>
              </div>
              
              <div v-else class="text-center text-gray-500 dark:text-gray-400 py-8">
                {{ t('noSkillsAdded') }}
              </div>
            </div>
          </template>
        </UAccordion>

        <!-- Additional Sections -->
        <UAccordion :items="accordionItems" multiple>
          <template #basic-stats>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
              <UFormGroup :label="t('maxHp')" name="maxHp">
                <UInput
                  v-model.number="form.maxHp"
                  type="number"
                  min="1"
                  placeholder="8"
                />
              </UFormGroup>
              
              <UFormGroup :label="t('ac')" name="armorClass">
                <UInput
                  v-model.number="form.armorClass"
                  type="number"
                  min="1"
                  placeholder="10"
                />
              </UFormGroup>
              
              <UFormGroup :label="t('speed')" name="speed">
                <UInput
                  v-model.number="form.speed"
                  type="number"
                  min="0"
                  placeholder="30"
                />
              </UFormGroup>
              
              <UFormGroup :label="t('initiative')" name="initiative">
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
              <UFormGroup :label="t('age')" name="age">
                <UInput
                  v-model.number="form.age"
                  type="number"
                  min="1"
                  placeholder="25"
                />
              </UFormGroup>
              
              <UFormGroup :label="t('height')" name="height">
                <UInput
                  v-model="form.height"
                  placeholder="5'10&quot;"
                />
              </UFormGroup>
              
              <UFormGroup :label="t('weight')" name="weight">
                <UInput
                  v-model="form.weight"
                  placeholder="180 lbs"
                />
              </UFormGroup>
              
              <UFormGroup :label="t('eyes')" name="eyes">
                <UInput
                  v-model="form.eyes"
                  placeholder="Brown"
                />
              </UFormGroup>
              
              <UFormGroup :label="t('skin')" name="skin">
                <UInput
                  v-model="form.skin"
                  placeholder="Tan"
                />
              </UFormGroup>
              
              <UFormGroup :label="t('hair')" name="hair">
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
            {{ t('cancel') }}
          </UButton>
          <UButton
            color="primary"
            @click="submitForm"
            :loading="isSubmitting"
            :disabled="!isFormValid"
          >
            {{ t('createCharacter') }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const { t } = useTranslations()

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

const abilityScoreItems = computed(() => [
  {
    label: t('abilityScores'),
    icon: 'i-heroicons-chart-bar',
    slot: 'ability-scores',
    defaultOpen: true
  }
])

const skillsItems = computed(() => [
  {
    label: t('skillsAndAbilities'),
    icon: 'i-heroicons-academic-cap',
    slot: 'skills',
    defaultOpen: false
  }
])

const accordionItems = computed(() => [
  {
    label: t('basicCombatStats'),
    icon: 'i-heroicons-shield-check',
    slot: 'basic-stats',
    defaultOpen: false
  },
  {
    label: t('physicalCharacteristics'),
    icon: 'i-heroicons-user',
    slot: 'physical',
    defaultOpen: false
  }
])

const abilityOptions = computed(() => [
  { label: t('strength'), value: 'strength' },
  { label: t('dexterity'), value: 'dexterity' },
  { label: t('constitution'), value: 'constitution' },
  { label: t('intelligence'), value: 'intelligence' },
  { label: t('wisdom'), value: 'wisdom' },
  { label: t('charisma'), value: 'charisma' }
])

const skillCategoryOptions = computed(() => [
  { label: t('damageTypeLabel'), value: 'DANO' },
  { label: t('help'), value: 'AYUDA' },
  { label: t('other'), value: 'OTRO' }
])

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
        title: t('characterCreated'),
        description: `${form.value.characterName} ${t('characterCreatedDesc')}`,
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
      title: t('error'),
      description: error.data?.message || error.message || t('errorCreatingCharacterDesc'),
      color: 'red'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>