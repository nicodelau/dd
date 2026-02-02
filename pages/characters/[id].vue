<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <UButton
              :to="(user?.role === 'DM' || user?.role === 'ADMIN') ? '/dashboard' : '/'"
              color="gray"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              size="sm"
            >
              {{ (user?.role === 'DM' || user?.role === 'ADMIN') ? t('backToDashboard') : t('backToHome') }}
            </UButton>
            
            <div class="h-6 border-l border-gray-300 dark:border-gray-600"></div>
            
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ character?.characterName || t('characterSheet') }}
            </h1>
          </div>
          
          <div class="flex items-center space-x-2">
            <UButton
              color="primary"
              variant="solid"
              size="sm"
              icon="i-heroicons-language"
              @click="toggleLanguage"
            >
              {{ language === 'en' ? 'ES' : 'EN' }}
            </UButton>
            <UButton
              v-if="canEdit"
              color="gray"
              variant="outline"
              icon="i-heroicons-pencil"
              @click="editMode = !editMode"
              :disabled="isLoading"
            >
              {{ editMode ? t('cancel') : t('edit') }}
            </UButton>
            
            <UButton
              v-if="editMode && canEdit"
              color="primary"
              icon="i-heroicons-check"
              @click="saveCharacter"
              :loading="isSaving"
            >
              {{ t('saveChanges') }}
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
          {{ t('characterNotFound') }}
        </h3>
        <p class="text-red-500 mb-6">{{ error }}</p>
        <UButton color="primary" :to="canEdit ? '/dashboard' : '/'">
          {{ canEdit ? t('backToDashboard') : t('backToHome') }}
        </UButton>
      </div>
      
      <!-- Character Content -->
      <div v-else-if="character" class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Left Sidebar - Portrait, Inventory & Currency -->
        <div class="space-y-6">
          <!-- Character Portrait -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('characterPortrait') }}
              </h3>
            </template>
            
             <div class="text-center">
               <!-- Avatar Image or Initials -->
               <div class="relative h-32 w-32 mx-auto mb-4">
                 <img
                   v-if="character.avatar && !imageLoadError"
                   :src="character.avatar"
                   :alt="character.characterName || t('character')"
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
                  {{ t('avatarUrl') }}
                </label>
                <UInput
                  v-model="editForm.avatar"
                  :placeholder="t('imageUrlPlaceholder')"
                  type="url"
                />
              </div>
              
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ (character.race || t('unknown')) }} {{ (character.className || t('unknown')) }}
              </p>
            </div>
          </UCard>

          <!-- Currency -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('currency') }}
              </h3>
            </template>

            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('copper') }} (cp)
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
                  {{ t('silver') }} (sp)
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
                  {{ t('gold') }} (gp)
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
                  {{ t('platinum') }} (pp)
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
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('totalValue') }} (gp)</span>
                <span class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ calculateTotalWealth() }}
                </span>
              </div>
            </div>
          </UCard>

          <!-- Inventory -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ t('inventory') }}
                </h3>
                <UButton
                  v-if="editMode && canEdit"
                  color="primary"
                  variant="soft"
                  size="sm"
                  icon="i-heroicons-plus"
                  @click="addInventoryItem"
                >
                  {{ t('addItem') }}
                </UButton>
              </div>
            </template>

             <div v-if="editMode ? (!editInventory || editInventory.length === 0) : (!character.inventory || character.inventory.length === 0)" class="text-center py-8 text-gray-500 dark:text-gray-400">
               {{ t('noItems') }}
             </div>

             <div v-else class="space-y-3">
               <div
                 v-for="(item, index) in editMode ? editInventory : character.inventory"
                 :key="item.id || index"
                 class="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
               >
                <div class="grid grid-cols-1 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {{ t('itemName') }}
                    </label>
                    <UInput
                      v-if="editMode"
                      v-model="editInventory[index].name"
                      :placeholder="t('itemName')"
                    />
                    <p v-else class="text-gray-900 dark:text-white font-medium">{{ item.name }}</p>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ t('quantity') }}
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
                        {{ t('weight') }} (lbs)
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

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {{ t('notes') }}
                    </label>
                    <UTextarea
                      v-if="editMode"
                      v-model="editInventory[index].notes"
                      :placeholder="t('itemDescription')"
                      :rows="2"
                    />
                    <p v-else class="text-gray-900 dark:text-white text-sm">{{ item.notes || t('noNotes') }}</p>
                  </div>

                  <div v-if="editMode" class="flex items-center justify-between">
                    <UCheckbox
                      v-model="editInventory[index].equipped"
                      :label="t('equipped')"
                    />
                    <UButton
                      color="red"
                      variant="ghost"
                      size="sm"
                      icon="i-heroicons-trash"
                      @click="removeInventoryItem(index)"
                    >
                      {{ t('remove') }}
                    </UButton>
                  </div>

                  <div v-else-if="item.equipped" class="mt-2">
                    <UBadge color="green" variant="soft" size="sm">{{ t('equipped') }}</UBadge>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Character Notes -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('notes') }}
              </h3>
            </template>
            
            <UTextarea
              v-if="editMode"
              v-model="characterNotes"
              :placeholder="t('addNotes')"
              :rows="4"
            />
            
            <div v-else class="text-gray-600 dark:text-gray-300 min-h-[100px]">
              {{ characterNotes || t('noNotes') }}
            </div>
          </UCard>
        </div>

        <!-- Center Column - Character Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Info Card -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('basicInfo') }}
              </h3>
            </template>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('characterName') }}
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.characterName"
                  :placeholder="t('characterName')"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.characterName || t('unknown') }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('playerName') }}
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.playerName"
                  :placeholder="t('playerName')"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.playerName || t('unassigned') }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('race') }}
                </label>
                <USelect
                  v-if="editMode"
                  v-model="editForm.race"
                  :options="raceOptions"
                  :placeholder="t('selectRace')"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.race || t('unknown') }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('subrace') }}
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.subrace"
                  :placeholder="t('subracePlaceholder')"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.subrace || t('notSet') }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('ancestry') }}
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.ancestry"
                  :placeholder="t('ancestryPlaceholder')"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.ancestry || t('notSet') }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('classAndLevel') }}
                </label>
                <div v-if="editMode" class="flex space-x-2">
                  <USelect
                    v-model="editForm.className"
                    :options="classOptions"
                    :placeholder="t('classPlaceholder')"
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
                <p v-else class="text-gray-900 dark:text-white">{{ (character.className || t('unknown')) }} {{ character.classLevel || 1 }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('background') }}
                </label>
                <USelect
                  v-if="editMode"
                  v-model="editForm.background"
                  :options="backgroundOptions"
                  :placeholder="t('backgroundPlaceholder')"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.background || t('notSet') }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('alignment') }}
                </label>
                <USelect
                  v-if="editMode"
                  v-model="editForm.alignment"
                  :options="alignmentOptions"
                  :placeholder="t('alignmentPlaceholder')"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.alignment || t('notSet') }}</p>
              </div>
            </div>
          </UCard>
          
           <!-- Combat Stats Card -->
           <UCard>
             <template #header>
               <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                 {{ t('combatStats') }}
               </h3>
             </template>

             <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   {{ t('armorClass') }}
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
                   {{ t('speed') }}
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
                   {{ t('maxHp') }}
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
                    {{ t('currentHp') }}
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
                        {{ t('adjust') }}
                      </UButton>
                    </div>
                  </div>
                </div>
             </div>

             <!-- Proficiency Checkboxes -->
             <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
               <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">
                 {{ t('proficiencies') }}
               </h4>

               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <!-- Saving Throws Proficiency -->
                 <div>
                   <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                     {{ t('savingThrows') }}
                   </h5>
                   <div class="space-y-2">
                     <div v-for="ability in ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']" :key="ability" class="flex items-center space-x-2">
                       <UCheckbox
                         v-if="editMode"
                         v-model="savingThrowProficient[ability]"
                         size="sm"
                       />
                       <span class="text-sm text-gray-600 dark:text-gray-400">{{ t(ability) }}</span>
                     </div>
                   </div>
                 </div>


               </div>
             </div>
            
            <!-- Health Bar -->
            <div class="mt-6">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('health') }}</span>
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
                {{ t('physicalCharacteristics') }}
              </h3>
            </template>
            
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('age') }}
                </label>
                <UInput
                  v-if="editMode"
                  v-model.number="editForm.age"
                  type="number"
                  min="1"
                  :placeholder="t('age')"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.age || t('notSet') }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('height') }}
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.height"
                  placeholder="e.g., 5'8&quot;"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.height || t('notSet') }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('weight') }}
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.weight"
                  placeholder="e.g., 160 lbs"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.weight || t('notSet') }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('eyes') }}
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.eyes"
                  :placeholder="t('eyes')"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.eyes || t('notSet') }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('skin') }}
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.skin"
                  :placeholder="t('skin')"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.skin || t('notSet') }}</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('hair') }}
                </label>
                <UInput
                  v-if="editMode"
                  v-model="editForm.hair"
                  :placeholder="t('hair')"
                />
                <p v-else class="text-gray-900 dark:text-white">{{ character.hair || t('notSet') }}</p>
              </div>
            </div>
          </UCard>
          
           <!-- Combat Actions Card -->
           <UCard>
             <template #header>
               <div class="flex items-center justify-between">
                 <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                   {{ t('combatActions') }}
                 </h3>
                 <UButton
                   v-if="editMode && canEdit"
                   color="primary"
                   variant="soft"
                   size="sm"
                   icon="i-heroicons-plus"
                   @click="addCombatAction"
                 >
                   {{ t('addAction') }}
                 </UButton>
               </div>
             </template>

             <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   {{ t('hitDice') }}
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model="editForm.hitDice"
                   placeholder="e.g., 1d8"
                 />
                 <p v-else class="text-lg font-bold text-gray-900 dark:text-white">{{ character.hitDice || t('notSet') }}</p>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   {{ t('initiative') }}
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model.number="editForm.initiative"
                   type="number"
                   :placeholder="t('initiative')"
                 />
                 <p v-else class="text-lg font-bold text-gray-900 dark:text-white">
                   {{ character.initiative !== undefined ? (character.initiative >= 0 ? '+' : '') + character.initiative : t('notSet') }}
                 </p>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   {{ t('passivePerception') }}
                 </label>
                 <UInput
                   v-if="editMode"
                   v-model.number="editForm.passivePerception"
                   type="number"
                   min="1"
                   :placeholder="t('passivePerception')"
                 />
                 <p v-else class="text-lg font-bold text-gray-900 dark:text-white">{{ character.passivePerception || 10 }}</p>
               </div>

               <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   {{ t('deathSaves') }}
                 </label>
                 <div v-if="editMode" class="space-y-2">
                   <div class="flex space-x-2">
                     <span class="text-xs text-gray-500">{{ t('successes') }}:</span>
                     <UInput
                       v-model.number="editForm.deathSaveSuccesses"
                       type="number"
                       min="0"
                       max="3"
                       class="w-16"
                     />
                   </div>
                   <div class="flex space-x-2">
                     <span class="text-xs text-gray-500">{{ t('failures') }}:</span>
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
                 {{ t('customActions') }}
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
                         {{ t('actionName') }}
                       </label>
                       <UInput
                         v-if="editMode"
                         v-model="editCombatActions[index].name"
                         :placeholder="t('actionName')"
                       />
                       <p v-else class="text-gray-900 dark:text-white font-medium">{{ action.name }}</p>
                     </div>

                     <div>
                       <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         {{ t('type') }}
                       </label>
                       <USelect
                         v-if="editMode"
                         v-model="editCombatActions[index].type"
                         :options="actionTypeOptions"
                         :placeholder="t('type')"
                       />
                       <p v-else class="text-gray-900 dark:text-white">{{ action.type || t('action') }}</p>
                     </div>

                     <div>
                       <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         {{ t('uses') }}
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
                       {{ t('description') }}
                     </label>
                     <UTextarea
                       v-if="editMode"
                       v-model="editCombatActions[index].description"
                       :placeholder="t('description')"
                       :rows="2"
                     />
                     <p v-else class="text-gray-900 dark:text-white text-sm">{{ action.description || t('none') }}</p>
                   </div>

                   <div v-if="editMode" class="mt-4 flex justify-end">
                     <UButton
                       color="red"
                       variant="ghost"
                       size="sm"
                       icon="i-heroicons-trash"
                       @click="removeCombatAction(index)"
                     >
                       {{ t('remove') }}
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
                {{ t('abilityScores') }}
              </h3>
            </template>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div class="text-center">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('str') }}
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
                  {{ t('dex') }}
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
                  {{ t('con') }}
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
                  {{ t('int') }}
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
                  {{ t('wis') }}
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
                  {{ t('cha') }}
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
           
           <!-- Attacks Card -->
           <UCard>
             <template #header>
               <div class="flex items-center justify-between">
                 <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                   {{ t('attacks') }}
                 </h3>
                 <UButton
                   v-if="editMode && canEdit"
                   color="primary"
                   variant="soft"
                   size="sm"
                   icon="i-heroicons-plus"
                   @click="addAttack"
                 >
                   {{ t('addAttack') }}
                 </UButton>
               </div>
             </template>

              <div v-if="editMode ? (!editAttacks || editAttacks.length === 0) : (!character.attacks || character.attacks.length === 0)" class="text-center py-8 text-gray-500 dark:text-gray-400">
                {{ t('noAttacks') }}
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
                       {{ t('name') }}
                     </label>
                     <UInput
                       v-if="editMode"
                       v-model="editAttacks[index].name"
                       :placeholder="t('attackName')"
                     />
                     <p v-else class="text-gray-900 dark:text-white">{{ attack.name }}</p>
                   </div>

                   <div>
                     <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       {{ t('attackBonus') }}
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
                       {{ t('damage') }}
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
                       {{ t('rangeProperties') }}
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
                     {{ t('description') }}
                   </label>
                   <UTextarea
                     v-if="editMode"
                     v-model="editAttacks[index].notes"
                     :placeholder="t('attackDescription')"
                     :rows="2"
                   />
                   <p v-else class="text-gray-900 dark:text-white">{{ attack.notes || t('noDescription') }}</p>
                 </div>

                 <div v-if="editMode" class="mt-4 flex justify-end">
                   <UButton
                     color="red"
                     variant="ghost"
                     size="sm"
                     icon="i-heroicons-trash"
                     @click="removeAttack(index)"
                   >
                     {{ t('remove') }}
                   </UButton>
                 </div>
               </div>
             </div>
            </UCard>
          </div>
         
         <!-- Right Sidebar - Skills & Saving Throws -->
          <div class="space-y-6">
            <!-- Saving Throws -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Saving Throws
                </h3>
              </template>

              <div class="space-y-3">
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

            <!-- Skills -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ t('skills') }}
                </h3>
              </template>

              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div v-for="skill in standardSkills" :key="skill.name" class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <UCheckbox
                      v-if="editMode"
                      v-model="skillProficient[skill.name]"
                      size="sm"
                    />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ skill.label }}</span>
                  </div>
                  <span class="text-sm font-bold text-gray-900 dark:text-white">
                    {{ getFormattedBonus(getSkillModifier(skill.name, skill.ability)) }}
                  </span>
                </div>
              </div>
            </UCard>

            <!-- Quick Stats -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ t('quickStats') }}
                </h3>
              </template>
              
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ t('experience') }}</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ (character.experience || 0).toLocaleString() }} XP</span>
                </div>
                
                 <div class="flex justify-between items-center">
                   <span class="text-sm text-gray-600 dark:text-gray-300">{{ t('proficiencyBonus') }}</span>
                   <div v-if="editMode" class="flex items-center space-x-2">
                     <UInput
                       v-model.number="editForm.proficiencyBonus"
                       type="number"
                       min="1"
                       max="6"
                       class="w-16 text-center"
                       :placeholder="character.proficiencyBonus || 2"
                     />
                   </div>
                   <span v-else class="font-medium text-gray-900 dark:text-white">+{{ character.proficiencyBonus || 2 }}</span>
                 </div>

                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ t('passivePerception') }}</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ character.passivePerception || 10 }}</span>
                </div>
                
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ t('inspiration') }}</span>
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ character.inspiration ? t('yes') : t('no') }}
                  </span>
                </div>
              </div>
            </UCard>
          </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { t, toggleLanguage, language } = useTranslations()
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
  const gold = character.value?.goldCoins || 0
  const platinum = character.value?.platinumCoins || 0

  // Convert everything to gold pieces
  // 1 platinum = 100 gold, 1 gold = 100 silver, 1 silver = 100 copper
  const total = (platinum * 100) + gold + (silver * 0.01) + (copper * 0.0001)
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

  console.log('Saving character with ID:', characterId)

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
          category: 'OTRO'
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