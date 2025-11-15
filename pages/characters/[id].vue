<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <UButton
              :to="canEdit ? '/dashboard' : '/'"
              color="gray"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              size="sm"
            >
              {{ canEdit ? 'Back to Dashboard' : 'Back to Home' }}
            </UButton>
            
            <div class="h-6 border-l border-gray-300 dark:border-gray-600"></div>
            
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ character?.characterName || 'Character Sheet' }}
            </h1>
          </div>
          
          <div class="flex items-center space-x-2">
            <UButton
              v-if="canEdit"
              color="gray"
              variant="outline"
              icon="i-heroicons-pencil"
              @click="editMode = !editMode"
              :disabled="isLoading"
            >
              {{ editMode ? 'Cancel' : 'Edit' }}
            </UButton>
            
            <UButton
              v-if="editMode && canEdit"
              color="primary"
              icon="i-heroicons-check"
              @click="saveCharacter"
              :loading="isSaving"
            >
              Save Changes
            </UButton>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="mx-auto h-24 w-24 text-red-300 mb-4">
          <svg class="h-full w-full" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Character Not Found
        </h3>
        <p class="text-red-500 mb-6">{{ error }}</p>
        <UButton color="primary" :to="canEdit ? '/dashboard' : '/'">
          {{ canEdit ? 'Back to Dashboard' : 'Back to Home' }}
        </UButton>
      </div>
      
      <!-- Character Content -->
      <div v-else-if="character" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column - Character Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Info Card -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Basic Information
              </h3>
            </template>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Character Name
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.characterName"
                  placeholder="Character name"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.characterName || 'Unknown' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Player Name
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.playerName"
                  placeholder="Player name"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.playerName || 'Unassigned' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Race
                </label>
                <USelect
                  v-if="editMode"
                  v-model="editForm.race"
                  :options="raceOptions"
                  placeholder="Select race"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.race || 'Unknown' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subrace
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.subrace"
                  placeholder="e.g., High Elf, Hill Dwarf"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.subrace || 'Not set' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ancestry
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.ancestry"
                  placeholder="Character lineage or ancestry"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.ancestry || 'Not set' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class & Level
                </label>
                <div v-if="editMode" class="flex space-x-2">
                  <USelect
                    v-model="editForm.className"
                    :options="classOptions"
                    placeholder="Class"
                    class="flex-1"
                  />
                  <UInput
                    v-model.number="editForm.classLevel"
                    type="number"
                    min="1"
                    max="20"
                    class="w-20"
                  />
                </div>
                <p v-else class="text-gray-900 dark:text-white">{{ (character.className || 'Unknown') }} {{ character.classLevel || 1 }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background
                </label>
                <USelect
                  v-if="editMode"
                  v-model="editForm.background"
                  :options="backgroundOptions"
                  placeholder="Select background"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.background || 'Not set' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alignment
                </label>
                <USelect
                  v-if="editMode"
                  v-model="editForm.alignment"
                  :options="alignmentOptions"
                  placeholder="Select alignment"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.alignment || 'Not set' }}</p>
              </div>
            </div>
          </UCard>
          
           <!-- Combat Stats Card -->
           <UCard>
             <template #header>
               <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                 Combat Statistics
               </h3>
             </template>

             <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Armor Class
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model.number="editForm.armorClass"
                   type="number"
                   min="1"
                 />
                 <p v-else class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.armorClass || 10 }}</p>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Speed
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model.number="editForm.speed"
                   type="number"
                   min="0"
                 />
                 <p v-else class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.speed || 30 }} ft</p>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Max HP
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model.number="editForm.maxHp"
                   type="number"
                   min="1"
                 />
                 <p v-else class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.maxHp || 0 }}</p>
               </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current HP
                  </label>
                  <div v-if="editMode" class="space-y-2">
                    <UInput
                      v-model.number="editForm.currentHp"
                      type="number"
                      min="0"
                      :max="character.maxHp"
                    />
                  </div>
                  <div v-else class="space-y-2">
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.currentHp || 0 }}</p>
                    <!-- Quick HP adjustment for DMs -->
                    <div v-if="canEdit" class="flex items-center space-x-2">
                      <UInput
                        v-model.number="hpAdjustment"
                        type="number"
                        placeholder="±HP"
                        class="w-20 text-sm"
                        @keyup.enter="adjustHp"
                      />
                      <UButton
                        size="sm"
                        variant="outline"
                        @click="adjustHp"
                        :disabled="!hpAdjustment || hpAdjustment === 0"
                      >
                        Adjust
                      </UButton>
                    </div>
                  </div>
                </div>
             </div>

             <!-- Proficiency Checkboxes -->
             <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
               <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">
                 Proficiencies
               </h4>

               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <!-- Saving Throws Proficiency -->
                 <div>
                   <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                     Saving Throws
                   </h5>
                   <div class="space-y-2">
                     <div v-for="ability in ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']" :key="ability" class="flex items-center space-x-2">
                       <UCheckbox
                         v-if="editMode"
                         v-model="savingThrowProficient[ability]"
                         size="sm"
                       />
                       <span class="text-sm text-gray-600 dark:text-gray-400 capitalize">{{ ability }}</span>
                     </div>
                   </div>
                 </div>


               </div>
             </div>
            
            <!-- Health Bar -->
            <div class="mt-6">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Health</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ Math.round(((character.currentHp || 0) / (character.maxHp || 1)) * 100) }}%
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div 
                  class="h-3 rounded-full transition-all duration-300"
                  :class="{
                    'bg-green-500': ((character.currentHp || 0) / (character.maxHp || 1)) > 0.6,
                    'bg-yellow-500': ((character.currentHp || 0) / (character.maxHp || 1)) > 0.3 && ((character.currentHp || 0) / (character.maxHp || 1)) <= 0.6,
                    'bg-red-500': ((character.currentHp || 0) / (character.maxHp || 1)) <= 0.3
                  }"
                  :style="`width: ${Math.max(0, ((character.currentHp || 0) / (character.maxHp || 1)) * 100)}%`"
                ></div>
              </div>
            </div>
          </UCard>
          
          <!-- Physical Characteristics Card -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Physical Characteristics
              </h3>
            </template>
            
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Age
                </label>
                <UInput
                  v-if="editMode"
                  v-model.number="editForm.age"
                  type="number"
                  min="1"
                  placeholder="Age"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.age || 'Not set' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Height
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.height"
                  placeholder="e.g., 5'8&quot;"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.height || 'Not set' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weight
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.weight"
                  placeholder="e.g., 160 lbs"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.weight || 'Not set' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eyes
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.eyes"
                  placeholder="Eye color"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.eyes || 'Not set' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skin
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.skin"
                  placeholder="Skin color/type"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.skin || 'Not set' }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hair
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.hair"
                  placeholder="Hair color/style"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.hair || 'Not set' }}</p>
              </div>
            </div>
          </UCard>
          
           <!-- Combat Actions Card -->
           <UCard>
             <template #header>
               <div class="flex items-center justify-between">
                 <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                   Combat Actions
                 </h3>
                 <UButton
                   v-if="editMode && canEdit"
                   color="primary"
                   variant="soft"
                   size="sm"
                   icon="i-heroicons-plus"
                   @click="addCombatAction"
                 >
                   Add Action
                 </UButton>
               </div>
             </template>

             <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Hit Dice
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model="editForm.hitDice"
                   placeholder="e.g., 1d8"
                 />
                 <p v-else class="text-lg font-bold text-gray-900 dark:text-white">{{ character.hitDice || 'Not set' }}</p>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Initiative
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model.number="editForm.initiative"
                   type="number"
                   placeholder="Initiative"
                 />
                 <p v-else class="text-lg font-bold text-gray-900 dark:text-white">
                   {{ character.initiative !== undefined ? (character.initiative >= 0 ? '+' : '') + character.initiative : 'Not set' }}
                 </p>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Passive Perception
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model.number="editForm.passivePerception"
                   type="number"
                   min="1"
                   placeholder="Passive Perception"
                 />
                 <p v-else class="text-lg font-bold text-gray-900 dark:text-white">{{ character.passivePerception || 10 }}</p>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Death Saves
                 </label>
                 <div v-if="editMode" class="space-y-2">
                   <div class="flex space-x-2">
                     <span class="text-xs text-gray-500">Success:</span>
                     <UInput
                       v-model.number="editForm.deathSaveSuccesses"
                       type="number"
                       min="0"
                       max="3"
                       class="w-16"
                     />
                   </div>
                   <div class="flex space-x-2">
                     <span class="text-xs text-gray-500">Failures:</span>
                     <UInput
                       v-model.number="editForm.deathSaveFailures"
                       type="number"
                       min="0"
                       max="3"
                       class="w-16"
                     />
                   </div>
                 </div>
                 <div v-else class="text-sm text-gray-900 dark:text-white">
                   <div>✓ {{ character.deathSaveSuccesses || 0 }}/3</div>
                   <div>✗ {{ character.deathSaveFailures || 0 }}/3</div>
                 </div>
               </div>
             </div>

             <!-- Custom Combat Actions -->
             <div v-if="editCombatActions.length > 0 || (character.combatActions && character.combatActions.length > 0)" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
               <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">
                 Custom Actions
               </h4>

               <div class="space-y-4">
                 <div
                   v-for="(action, index) in editMode ? editCombatActions : (character.combatActions || [])"
                   :key="index"
                   class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                 >
                   <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                       <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Action Name
                       </label>
                       <UInput
                         v-if="editMode"
                         v-model="editCombatActions[index].name"
                         placeholder="Action name"
                       />
                       <p v-else class="text-gray-900 dark:text-white font-medium">{{ action.name }}</p>
                     </div>

                     <div>
                       <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Type
                       </label>
                       <USelect
                         v-if="editMode"
                         v-model="editCombatActions[index].type"
                         :options="actionTypeOptions"
                         placeholder="Action type"
                       />
                       <p v-else class="text-gray-900 dark:text-white">{{ action.type || 'Action' }}</p>
                     </div>

                     <div>
                       <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Uses
                       </label>
                       <div v-if="editMode" class="flex space-x-2">
                         <UInput
                           v-model.number="editCombatActions[index].currentUses"
                           type="number"
                           min="0"
                           placeholder="0"
                           class="flex-1"
                         />
                         <span class="text-gray-500">/</span>
                         <UInput
                           v-model.number="editCombatActions[index].maxUses"
                           type="number"
                           min="0"
                           placeholder="0"
                           class="flex-1"
                         />
                       </div>
                       <p v-else class="text-gray-900 dark:text-white">
                         {{ action.currentUses || 0 }}/{{ action.maxUses || 0 }}
                       </p>
                     </div>
                   </div>

                   <div class="mt-4">
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Description
                     </label>
                     <UTextarea
                       v-if="editMode"
                       v-model="editCombatActions[index].description"
                       placeholder="Describe what this action does..."
                       :rows="2"
                     />
                     <p v-else class="text-gray-900 dark:text-white text-sm">{{ action.description || 'No description' }}</p>
                   </div>

                   <div v-if="editMode" class="mt-4 flex justify-end">
                     <UButton
                       color="red"
                       variant="ghost"
                       size="sm"
                       icon="i-heroicons-trash"
                       @click="removeCombatAction(index)"
                     >
                       Remove
                     </UButton>
                   </div>
                 </div>
               </div>
             </div>
           </UCard>
          
          <!-- Ability Scores Card -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Ability Scores
              </h3>
            </template>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div class="text-center">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  STR
                </label>
                <UInput
                  v-if="editMode"
                  v-model.number="editForm.strength"
                  type="number"
                  min="1"
                  max="30"
                  class="text-center"
                />
                <div v-else class="space-y-1">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.strength || 10 }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {{ Math.floor(((character.strength || 10) - 10) / 2) >= 0 ? '+' : '' }}{{ Math.floor(((character.strength || 10) - 10) / 2) }}
                  </div>
                </div>
              </div>
              
              <div class="text-center">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  DEX
                </label>
                <UInput
                  v-if="editMode"
                  v-model.number="editForm.dexterity"
                  type="number"
                  min="1"
                  max="30"
                  class="text-center"
                />
                <div v-else class="space-y-1">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.dexterity || 10 }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {{ Math.floor(((character.dexterity || 10) - 10) / 2) >= 0 ? '+' : '' }}{{ Math.floor(((character.dexterity || 10) - 10) / 2) }}
                  </div>
                </div>
              </div>
              
              <div class="text-center">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CON
                </label>
                <UInput
                  v-if="editMode"
                  v-model.number="editForm.constitution"
                  type="number"
                  min="1"
                  max="30"
                  class="text-center"
                />
                <div v-else class="space-y-1">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.constitution || 10 }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {{ Math.floor(((character.constitution || 10) - 10) / 2) >= 0 ? '+' : '' }}{{ Math.floor(((character.constitution || 10) - 10) / 2) }}
                  </div>
                </div>
              </div>
              
              <div class="text-center">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  INT
                </label>
                <UInput
                  v-if="editMode"
                  v-model.number="editForm.intelligence"
                  type="number"
                  min="1"
                  max="30"
                  class="text-center"
                />
                <div v-else class="space-y-1">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.intelligence || 10 }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {{ Math.floor(((character.intelligence || 10) - 10) / 2) >= 0 ? '+' : '' }}{{ Math.floor(((character.intelligence || 10) - 10) / 2) }}
                  </div>
                </div>
              </div>
              
              <div class="text-center">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  WIS
                </label>
                <UInput
                  v-if="editMode"
                  v-model.number="editForm.wisdom"
                  type="number"
                  min="1"
                  max="30"
                  class="text-center"
                />
                <div v-else class="space-y-1">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.wisdom || 10 }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {{ Math.floor(((character.wisdom || 10) - 10) / 2) >= 0 ? '+' : '' }}{{ Math.floor(((character.wisdom || 10) - 10) / 2) }}
                  </div>
                </div>
              </div>
              
              <div class="text-center">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CHA
                </label>
                <UInput
                  v-if="editMode"
                  v-model.number="editForm.charisma"
                  type="number"
                  min="1"
                  max="30"
                  class="text-center"
                />
                <div v-else class="space-y-1">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ character.charisma || 10 }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {{ Math.floor(((character.charisma || 10) - 10) / 2) >= 0 ? '+' : '' }}{{ Math.floor(((character.charisma || 10) - 10) / 2) }}
                  </div>
                </div>
              </div>
            </div>
          </UCard>
          
           <!-- Saving Throws Card -->
           <UCard>
             <template #header>
               <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                 Saving Throws
               </h3>
             </template>

             <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
               <div class="flex items-center justify-between">
                 <div class="flex items-center space-x-2">
                   <UCheckbox
                     v-if="editMode"
                     v-model="savingThrowProficient.strength"
                     size="sm"
                   />
                   <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Strength</span>
                 </div>
                 <span class="text-lg font-bold text-gray-900 dark:text-white">
                   {{ getFormattedBonus(getSavingThrowModifier('strength')) }}
                 </span>
               </div>

               <div class="flex items-center justify-between">
                 <div class="flex items-center space-x-2">
                   <UCheckbox
                     v-if="editMode"
                     v-model="savingThrowProficient.dexterity"
                     size="sm"
                   />
                   <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Dexterity</span>
                 </div>
                 <span class="text-lg font-bold text-gray-900 dark:text-white">
                   {{ getFormattedBonus(getSavingThrowModifier('dexterity')) }}
                 </span>
               </div>

               <div class="flex items-center justify-between">
                 <div class="flex items-center space-x-2">
                   <UCheckbox
                     v-if="editMode"
                     v-model="savingThrowProficient.constitution"
                     size="sm"
                   />
                   <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Constitution</span>
                 </div>
                 <span class="text-lg font-bold text-gray-900 dark:text-white">
                   {{ getFormattedBonus(getSavingThrowModifier('constitution')) }}
                 </span>
               </div>

               <div class="flex items-center justify-between">
                 <div class="flex items-center space-x-2">
                   <UCheckbox
                     v-if="editMode"
                     v-model="savingThrowProficient.intelligence"
                     size="sm"
                   />
                   <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Intelligence</span>
                 </div>
                 <span class="text-lg font-bold text-gray-900 dark:text-white">
                   {{ getFormattedBonus(getSavingThrowModifier('intelligence')) }}
                 </span>
               </div>

               <div class="flex items-center justify-between">
                 <div class="flex items-center space-x-2">
                   <UCheckbox
                     v-if="editMode"
                     v-model="savingThrowProficient.wisdom"
                     size="sm"
                   />
                   <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Wisdom</span>
                 </div>
                 <span class="text-lg font-bold text-gray-900 dark:text-white">
                   {{ getFormattedBonus(getSavingThrowModifier('wisdom')) }}
                 </span>
               </div>

               <div class="flex items-center justify-between">
                 <div class="flex items-center space-x-2">
                   <UCheckbox
                     v-if="editMode"
                     v-model="savingThrowProficient.charisma"
                     size="sm"
                   />
                   <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Charisma</span>
                 </div>
                 <span class="text-lg font-bold text-gray-900 dark:text-white">
                   {{ getFormattedBonus(getSavingThrowModifier('charisma')) }}
                 </span>
               </div>
             </div>
           </UCard>
          
           <!-- Skills Card -->
           <UCard>
             <template #header>
               <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                 Skills
               </h3>
             </template>

             <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
               <div v-for="skill in standardSkills" :key="skill.name" class="flex items-center justify-between">
                 <div class="flex items-center space-x-2">
                   <UCheckbox
                     v-if="editMode"
                     v-model="skillProficient[skill.name]"
                     size="sm"
                   />
                   <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ skill.label }}</span>
                 </div>
                 <span class="text-lg font-bold text-gray-900 dark:text-white">
                   {{ getFormattedBonus(getSkillModifier(skill.name, skill.ability)) }}
                 </span>
               </div>
             </div>
           </UCard>

           <!-- Attacks Card -->
           <UCard>
             <template #header>
               <div class="flex items-center justify-between">
                 <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                   Attacks
                 </h3>
                 <UButton
                   v-if="editMode && canEdit"
                   color="primary"
                   variant="soft"
                   size="sm"
                   icon="i-heroicons-plus"
                   @click="addAttack"
                 >
                   Add Attack
                 </UButton>
               </div>
             </template>

              <div v-if="editMode ? (!editAttacks || editAttacks.length === 0) : (!character.attacks || character.attacks.length === 0)" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No attacks configured yet.
              </div>

              <div v-else class="space-y-4">
                <div
                  v-for="(attack, index) in editMode ? editAttacks : character.attacks"
                  :key="attack.id || index"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Name
                     </label>
                     <UInput
                       v-if="editMode"
                       v-model="editAttacks[index].name"
                       placeholder="Attack name"
                     />
                     <p v-else class="text-gray-900 dark:text-white">{{ attack.name }}</p>
                   </div>

                   <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Attack Bonus
                     </label>
                     <UInput
                       v-if="editMode"
                       v-model.number="editAttacks[index].attackBonus"
                       type="number"
                       placeholder="+0"
                     />
                     <p v-else class="text-gray-900 dark:text-white">
                       {{ attack.attackBonus !== undefined ? (attack.attackBonus >= 0 ? '+' : '') + attack.attackBonus : 'N/A' }}
                     </p>
                   </div>

                   <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Damage
                     </label>
                     <UInput
                       v-if="editMode"
                       v-model="editAttacks[index].damage"
                       placeholder="1d8+3"
                     />
                     <p v-else class="text-gray-900 dark:text-white">{{ attack.damage || 'N/A' }}</p>
                   </div>

                   <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Range/Properties
                     </label>
                     <UInput
                       v-if="editMode"
                       v-model="editAttacks[index].rangeText"
                       placeholder="5 ft"
                     />
                     <p v-else class="text-gray-900 dark:text-white">{{ attack.rangeText || 'N/A' }}</p>
                   </div>
                 </div>

                 <div class="mt-4">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Description
                   </label>
                   <UTextarea
                     v-if="editMode"
                     v-model="editAttacks[index].notes"
                     placeholder="Attack description..."
                     :rows="2"
                   />
                   <p v-else class="text-gray-900 dark:text-white">{{ attack.notes || 'No description' }}</p>
                 </div>

                 <div v-if="editMode" class="mt-4 flex justify-end">
                   <UButton
                     color="red"
                     variant="ghost"
                     size="sm"
                     icon="i-heroicons-trash"
                     @click="removeAttack(index)"
                   >
                     Remove
                   </UButton>
                 </div>
               </div>
             </div>
           </UCard>

           <!-- Inventory Card -->
           <UCard>
             <template #header>
               <div class="flex items-center justify-between">
                 <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                   Inventory
                 </h3>
                 <UButton
                   v-if="editMode && canEdit"
                   color="primary"
                   variant="soft"
                   size="sm"
                   icon="i-heroicons-plus"
                   @click="addInventoryItem"
                 >
                   Add Item
                 </UButton>
               </div>
             </template>

              <div v-if="editMode ? (!editInventory || editInventory.length === 0) : (!character.inventory || character.inventory.length === 0)" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No items in inventory.
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="(item, index) in editMode ? editInventory : character.inventory"
                  :key="item.id || index"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                 <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                   <div class="md:col-span-2">
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       Item Name
                     </label>
                     <UInput
                       v-if="editMode"
                       v-model="editInventory[index].name"
                       placeholder="Item name"
                     />
                     <p v-else class="text-gray-900 dark:text-white font-medium">{{ item.name }}</p>
                   </div>

                   <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       Quantity
                     </label>
                     <UInput
                       v-if="editMode"
                       v-model.number="editInventory[index].quantity"
                       type="number"
                       min="1"
                       placeholder="1"
                     />
                     <p v-else class="text-gray-900 dark:text-white">{{ item.quantity }}</p>
                   </div>

                   <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       Weight (lbs)
                     </label>
                     <UInput
                       v-if="editMode"
                       v-model.number="editInventory[index].weight"
                       type="number"
                       step="0.1"
                       min="0"
                       placeholder="0.0"
                     />
                     <p v-else class="text-gray-900 dark:text-white">{{ item.weight || 0 }} lbs</p>
                   </div>
                 </div>

                 <div class="mt-3">
                   <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                     Notes
                   </label>
                   <UTextarea
                     v-if="editMode"
                     v-model="editInventory[index].notes"
                     placeholder="Item description or notes..."
                     :rows="2"
                   />
                   <p v-else class="text-gray-900 dark:text-white text-sm">{{ item.notes || 'No notes' }}</p>
                 </div>

                 <div v-if="editMode" class="mt-3 flex items-center justify-between">
                   <UCheckbox
                     v-model="editInventory[index].equipped"
                     label="Equipped"
                   />
                   <UButton
                     color="red"
                     variant="ghost"
                     size="sm"
                     icon="i-heroicons-trash"
                     @click="removeInventoryItem(index)"
                   >
                     Remove
                   </UButton>
                 </div>

                 <div v-else-if="item.equipped" class="mt-2">
                   <UBadge color="green" variant="soft" size="sm">Equipped</UBadge>
                 </div>
               </div>
             </div>
           </UCard>

           <!-- Coins Card -->
           <UCard>
             <template #header>
               <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                 Currency
               </h3>
             </template>

             <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Copper (cp)
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model.number="editForm.copperCoins"
                   type="number"
                   min="0"
                   placeholder="0"
                 />
                 <p v-else class="text-2xl font-bold text-orange-600">{{ character.copperCoins || 0 }}</p>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Silver (sp)
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model.number="editForm.silverCoins"
                   type="number"
                   min="0"
                   placeholder="0"
                 />
                 <p v-else class="text-2xl font-bold text-gray-400">{{ character.silverCoins || 0 }}</p>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Electrum (ep)
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model.number="editForm.electrumCoins"
                   type="number"
                   min="0"
                   placeholder="0"
                 />
                 <p v-else class="text-2xl font-bold text-blue-400">{{ character.electrumCoins || 0 }}</p>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Gold (gp)
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model.number="editForm.goldCoins"
                   type="number"
                   min="0"
                   placeholder="0"
                 />
                 <p v-else class="text-2xl font-bold text-yellow-500">{{ character.goldCoins || 0 }}</p>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Platinum (pp)
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model.number="editForm.platinumCoins"
                   type="number"
                   min="0"
                   placeholder="0"
                 />
                 <p v-else class="text-2xl font-bold text-gray-300">{{ character.platinumCoins || 0 }}</p>
               </div>
             </div>

             <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
               <div class="flex justify-between items-center">
                 <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Total Value (gp)</span>
                 <span class="text-lg font-bold text-gray-900 dark:text-white">
                   {{ calculateTotalWealth() }}
                 </span>
               </div>
             </div>
           </UCard>
         </div>
        
        <!-- Right Column - Quick Info & Actions -->
        <div class="space-y-6">
          <!-- Character Portrait -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Character Portrait
              </h3>
            </template>
            
             <div class="text-center">
               <!-- Avatar Image or Initials -->
               <div class="relative h-32 w-32 mx-auto mb-4">
                 <img
                   v-if="character.avatar && !imageLoadError"
                   :src="character.avatar"
                   :alt="character.characterName || 'Character'"
                   class="h-32 w-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                   @error="imageLoadError = true"
                   @load="imageLoadError = false"
                 />
                 <div
                   v-if="!character.avatar || imageLoadError"
                   class="h-32 w-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl border-4 border-gray-200 dark:border-gray-600"
                 >
                   {{ character.characterName?.charAt(0)?.toUpperCase() || '?' }}
                 </div>
               </div>
              
              <!-- Avatar URL Input in Edit Mode -->
              <div v-if="editMode" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Avatar URL
                </label>
                <UInput
                  v-model="editForm.avatar"
                  placeholder="https://example.com/avatar.jpg"
                  type="url"
                />
              </div>
              
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ (character.race || 'Unknown') }} {{ (character.className || 'Unknown') }}
              </p>
            </div>
          </UCard>
          
          <!-- Quick Stats -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Stats
              </h3>
            </template>
            
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Experience</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ (character.experience || 0).toLocaleString() }} XP</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Proficiency Bonus</span>
                <span class="font-medium text-gray-900 dark:text-white">+{{ character.proficiencyBonus || 2 }}</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-300">Inspiration</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ character.inspiration ? 'Yes' : 'No' }}
                </span>
              </div>
            </div>
          </UCard>
          
          <!-- Character Notes -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Notes
              </h3>
            </template>
            
            <UTextarea
              v-if="editMode"
              v-model="characterNotes"
              placeholder="Add character notes..."
              :rows="4"
            />
            
            <div v-else class="text-gray-600 dark:text-gray-300 min-h-[100px]">
              {{ characterNotes || 'No notes added yet.' }}
            </div>
          </UCard>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { CharacterDTO } from '~/types/dtos'

const route = useRoute()
const characterId = route.params.id as string

// Authentication
const user = useState('user')

// Check if user can edit characters (DM, ADMIN, or character owner)
const canEdit = computed(() => {
  const userRole = (user.value as any)?.role
  const userId = (user.value as any)?.id
  const characterOwnerId = character.value?.userId

  return userRole === 'DM' || userRole === 'ADMIN' || (characterOwnerId && userId === characterOwnerId)
})

// Reactive state
const character = ref<CharacterDTO | null>(null)
const editMode = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const imageLoadError = ref(false)
const hpAdjustment = ref<number | null>(null)

// Form data
const editForm = ref<Partial<CharacterDTO>>({})
const characterNotes = ref('')

// Attacks and inventory data
const editAttacks = ref<Array<{name: string, attackBonus?: number, damage?: string, rangeText?: string, notes?: string}>>([])
const editInventory = ref<Array<{name: string, quantity: number, weight?: number, equipped: boolean, notes?: string}>>([])
const editCombatActions = ref<Array<{name: string, type: string, currentUses: number, maxUses: number, description?: string}>>([])

// Proficiency checkboxes
const savingThrowProficient = ref({
  strength: false,
  dexterity: false,
  constitution: false,
  intelligence: false,
  wisdom: false,
  charisma: false
})

const skillProficient = ref<Record<string, boolean>>({})

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

const actionTypeOptions = [
  { label: 'Action', value: 'Action' },
  { label: 'Bonus Action', value: 'Bonus Action' },
  { label: 'Reaction', value: 'Reaction' },
  { label: 'Free Action', value: 'Free Action' },
  { label: 'Special', value: 'Special' }
]

// Standard D&D 5e Skills
const standardSkills = [
  { name: 'acrobatics', label: 'Acrobacias', ability: 'dexterity' },
  { name: 'animal_handling', label: 'Trato con Animales', ability: 'wisdom' },
  { name: 'arcana', label: 'Arcanos', ability: 'intelligence' },
  { name: 'athletics', label: 'Atletismo', ability: 'strength' },
  { name: 'deception', label: 'Engaño', ability: 'charisma' },
  { name: 'history', label: 'Historia', ability: 'intelligence' },
  { name: 'insight', label: 'Perspicacia', ability: 'wisdom' },
  { name: 'intimidation', label: 'Intimidación', ability: 'charisma' },
  { name: 'investigation', label: 'Investigación', ability: 'intelligence' },
  { name: 'medicine', label: 'Medicina', ability: 'wisdom' },
  { name: 'nature', label: 'Naturaleza', ability: 'intelligence' },
  { name: 'perception', label: 'Percepción', ability: 'wisdom' },
  { name: 'performance', label: 'Interpretación', ability: 'charisma' },
  { name: 'persuasion', label: 'Persuasión', ability: 'charisma' },
  { name: 'religion', label: 'Religión', ability: 'intelligence' },
  { name: 'sleight_of_hand', label: 'Juego de Manos', ability: 'dexterity' },
  { name: 'stealth', label: 'Sigilo', ability: 'dexterity' },
  { name: 'survival', label: 'Supervivencia', ability: 'wisdom' }
]

// Helper functions for calculations
const getAbilityModifier = (abilityScore: number) => {
  return Math.floor((abilityScore - 10) / 2)
}

const getFormattedBonus = (modifier: number) => {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

const getSavingThrowModifier = (abilityName: string) => {
  if (!character.value) return 0
  
  const abilityScore = character.value[abilityName as keyof typeof character.value] as number || 10
  const abilityModifier = getAbilityModifier(abilityScore)
  
  // Check if character is proficient in this saving throw
  const isProficient = character.value.savingThrows?.some(
    (save: any) => save.ability === abilityName && save.proficient
  ) || false
  
  const proficiencyBonus = isProficient ? (character.value.proficiencyBonus || 2) : 0
  
  return abilityModifier + proficiencyBonus
}

const getSkillModifier = (skillName: string, abilityName: string) => {
  if (!character.value) return 0
  
  const abilityScore = character.value[abilityName as keyof typeof character.value] as number || 10
  const abilityModifier = getAbilityModifier(abilityScore)
  
  // Check if character is proficient in this skill
  const skill = character.value.skills?.find((s: any) => s.name === skillName)
  const isProficient = skill?.proficient || false
  const hasExpertise = skill?.expertise || false
  
  const proficiencyBonus = character.value.proficiencyBonus || 2
  let totalBonus = abilityModifier
  
  if (isProficient) {
    totalBonus += proficiencyBonus
    if (hasExpertise) {
      totalBonus += proficiencyBonus // Expertise doubles proficiency bonus
    }
  }
  
  return totalBonus
}

// Methods
function addAttack() {
  editAttacks.value.push({
    name: '',
    attackBonus: undefined,
    damage: '',
    rangeText: '',
    notes: ''
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
    notes: ''
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

async function adjustHp() {
  if (!character.value || !hpAdjustment.value || hpAdjustment.value === 0) return

  try {
    const newHp = Math.max(0, (character.value.currentHp || 0) + hpAdjustment.value)

    // Direct update of character's current HP
    await $fetch(`/api/characters/${character.value.id}`, {
      method: 'PUT',
      body: { currentHp: newHp }
    })

    // Reload character data to reflect changes
    await loadCharacter()
    hpAdjustment.value = null
  } catch (err: any) {
    console.error('Error adjusting HP:', err)
  }
}

function calculateTotalWealth() {
  const copper = character.value?.copperCoins || 0
  const silver = character.value?.silverCoins || 0
  const electrum = character.value?.electrumCoins || 0
  const gold = character.value?.goldCoins || 0
  const platinum = character.value?.platinumCoins || 0

  const total = (copper * 0.01) + (silver * 0.1) + (electrum * 0.5) + gold + (platinum * 10)
  return total.toFixed(2)
}

async function loadCharacter() {
  isLoading.value = true
  error.value = null
  
  // Validate that characterId is a valid UUID or ID format
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
      characterNotes.value = typeof response.data.notes === 'string' ? response.data.notes : ''
      imageLoadError.value = false

      // Initialize attacks
      editAttacks.value = response.data.attacks ? [...response.data.attacks] : []

      // Initialize inventory
      editInventory.value = response.data.inventory ? [...response.data.inventory] : []

      // Initialize combat actions
      editCombatActions.value = response.data.combatActions ? [...response.data.combatActions] : []

      // Initialize saving throw proficiencies
      if (response.data.savingThrows) {
        response.data.savingThrows.forEach((save: any) => {
          savingThrowProficient.value[save.ability] = save.proficient
        })
      }

      // Initialize skill proficiencies
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
    // Prepare saving throws data
    const savingThrows = Object.entries(savingThrowProficient.value)
      .filter(([_, proficient]) => proficient)
      .map(([ability, proficient]) => ({ ability, proficient }))

    // Prepare skills data
    const skills = Object.entries(skillProficient.value)
      .filter(([_, proficient]) => proficient)
      .map(([name, proficient]) => {
        const skill = standardSkills.find(s => s.name === name)
        return {
          name,
          ability: skill?.ability || 'strength',
          proficient,
          expertise: false, // Could be enhanced later
          category: 'STANDARD'
        }
      })

    // Exclude system fields that shouldn't be updated by users
    const { id, userId, ownerId, user, owner, createdAt, updatedAt, ...updateFields } = editForm.value

    const updateData = {
      ...updateFields,
      notes: characterNotes.value,
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

// Watch for edit mode changes
watch(editMode, (newValue) => {
  if (newValue && character.value) {
    editForm.value = { ...character.value }
    editAttacks.value = character.value.attacks ? [...character.value.attacks] : []
    editInventory.value = character.value.inventory ? [...character.value.inventory] : []
    editCombatActions.value = character.value.combatActions ? [...character.value.combatActions] : []

    // Reset proficiency checkboxes
    savingThrowProficient.value = {
      strength: false,
      dexterity: false,
      constitution: false,
      intelligence: false,
      wisdom: false,
      charisma: false
    }
    skillProficient.value = {}

    // Load current proficiencies
    if (character.value.savingThrows) {
      character.value.savingThrows.forEach((save: any) => {
        savingThrowProficient.value[save.ability] = save.proficient
      })
    }
    if (character.value.skills) {
      character.value.skills.forEach((skill: any) => {
        skillProficient.value[skill.name] = skill.proficient
      })
    }
  }
})

// Load character on mount
onMounted(() => {
  loadCharacter()
})

// SEO
useHead({
  title: computed(() => character.value?.characterName || 'Character Sheet'),
  meta: [
    { name: 'description', content: 'View and manage your D&D character' }
  ]
})
</script>