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
            <USelect
              v-model="form.race"
              :options="raceOptions"
              placeholder="Select race"
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
            <USelect
              v-model="form.className"
              :options="classOptions"
              placeholder="Select class"
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
            <USelect
              v-model="form.background"
              :options="backgroundOptions"
              placeholder="Select background"
            />
          </UFormGroup>
          
          <UFormGroup label="Alignment" name="alignment">
            <USelect
              v-model="form.alignment"
              :options="alignmentOptions"
              placeholder="Select alignment"
            />
          </UFormGroup>
        </div>

        <!-- Basic Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

        <!-- Physical Characteristics -->
        <UAccordion :items="accordionItems" multiple>
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
  maxHp: number
  currentHp: number
  armorClass?: number
  speed?: number
  initiative?: number
  age?: number
  height?: string
  weight?: string
  eyes?: string
  skin?: string
  hair?: string
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
  maxHp: 8,
  armorClass: 10,
  speed: 30,
  initiative: 0,
  age: undefined as number | undefined,
  height: '',
  weight: '',
  eyes: '',
  skin: '',
  hair: ''
})

// Options
const raceOptions = [
  { label: 'Human', value: 'Human' },
  { label: 'Elf', value: 'Elf' },
  { label: 'Dwarf', value: 'Dwarf' },
  { label: 'Halfling', value: 'Halfling' },
  { label: 'Dragonborn', value: 'Dragonborn' },
  { label: 'Gnome', value: 'Gnome' },
  { label: 'Half-Elf', value: 'Half-Elf' },
  { label: 'Half-Orc', value: 'Half-Orc' },
  { label: 'Tiefling', value: 'Tiefling' }
]

const classOptions = [
  { label: 'Barbarian', value: 'Barbarian' },
  { label: 'Bard', value: 'Bard' },
  { label: 'Cleric', value: 'Cleric' },
  { label: 'Druid', value: 'Druid' },
  { label: 'Fighter', value: 'Fighter' },
  { label: 'Monk', value: 'Monk' },
  { label: 'Paladin', value: 'Paladin' },
  { label: 'Ranger', value: 'Ranger' },
  { label: 'Rogue', value: 'Rogue' },
  { label: 'Sorcerer', value: 'Sorcerer' },
  { label: 'Warlock', value: 'Warlock' },
  { label: 'Wizard', value: 'Wizard' }
]

const backgroundOptions = [
  { label: 'Acolyte', value: 'Acolyte' },
  { label: 'Criminal', value: 'Criminal' },
  { label: 'Folk Hero', value: 'Folk Hero' },
  { label: 'Noble', value: 'Noble' },
  { label: 'Sage', value: 'Sage' },
  { label: 'Soldier', value: 'Soldier' }
]

const alignmentOptions = [
  { label: 'Lawful Good', value: 'Lawful Good' },
  { label: 'Neutral Good', value: 'Neutral Good' },
  { label: 'Chaotic Good', value: 'Chaotic Good' },
  { label: 'Lawful Neutral', value: 'Lawful Neutral' },
  { label: 'True Neutral', value: 'True Neutral' },
  { label: 'Chaotic Neutral', value: 'Chaotic Neutral' },
  { label: 'Lawful Evil', value: 'Lawful Evil' },
  { label: 'Neutral Evil', value: 'Neutral Evil' },
  { label: 'Chaotic Evil', value: 'Chaotic Evil' }
]

const accordionItems = [
  {
    label: 'Physical Characteristics',
    icon: 'i-heroicons-user',
    slot: 'physical',
    defaultOpen: false
  }
]

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
    maxHp: 8,
    armorClass: 10,
    speed: 30,
    initiative: 0,
    age: undefined,
    height: '',
    weight: '',
    eyes: '',
    skin: '',
    hair: ''
  }
}

async function submitForm() {
  if (!isFormValid.value || isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    // TODO: Replace with actual API call
    // const response = await $fetch('/api/characters', {
    //   method: 'POST',
    //   body: form.value
    // })
    
    // Mock response for now
    const newCharacter: Character = {
      id: Date.now(),
      ...form.value,
      currentHp: form.value.maxHp
    }
    
    emit('created', newCharacter)
    closeModal()
    
    // Show success notification
    // useToast().add({
    //   title: 'Character Created',
    //   description: `${form.value.characterName} has been created successfully!`,
    //   color: 'green'
    // })
  } catch (error) {
    console.error('Error creating character:', error)
    // Show error notification
    // useToast().add({
    //   title: 'Error',
    //   description: 'Failed to create character. Please try again.',
    //   color: 'red'
    // })
  } finally {
    isSubmitting.value = false
  }
}
</script>