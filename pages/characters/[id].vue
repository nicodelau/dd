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
      <div v-else-if="character">
        <!-- Mobile Navigation Tabs (visible only on mobile) -->
        <div class="lg:hidden flex overflow-x-auto whitespace-nowrap gap-2 pb-3 mb-6 border-b border-gray-250 dark:border-gray-700 scrollbar-none sticky top-16 bg-gray-50 dark:bg-gray-900 z-10 pt-2">
          <UButton
            v-for="tab in [
              { id: 'general', label: t('basicInfo'), icon: 'i-heroicons-user' },
              { id: 'attributes', label: t('abilityScores'), icon: 'i-heroicons-sparkles' },
              { id: 'combat', label: t('attacks'), icon: 'i-heroicons-shield-check' },
              { id: 'inventory', label: t('inventory'), icon: 'i-heroicons-briefcase' },
              { id: 'currency', label: t('currency'), icon: 'i-heroicons-banknotes' }
            ]"
            :key="tab.id"
            :color="activeMobileTab === tab.id ? 'primary' : 'gray'"
            :variant="activeMobileTab === tab.id ? 'solid' : 'ghost'"
            size="sm"
            class="rounded-full flex-shrink-0"
            @click="activeMobileTab = tab.id"
            :icon="tab.icon"
          >
            {{ tab.label }}
          </UButton>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Left Sidebar - Portrait, Inventory & Currency -->
        <div class="space-y-6" :class="{ 'hidden lg:block': !['general', 'currency', 'inventory'].includes(activeMobileTab) }">
          <!-- Character Portrait -->
          <UCard :class="{ 'hidden lg:block': activeMobileTab !== 'general' }">
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
          <UCard :class="{ 'hidden lg:block': activeMobileTab !== 'currency' }">
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
          <UCard :class="{ 'hidden lg:block': activeMobileTab !== 'inventory' }">
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

            <!-- Filters & Sorting (Read-only mode) -->
            <div v-if="!editMode && character.inventory && character.inventory.length > 0" class="flex flex-col sm:flex-row lg:flex-col xl:flex-col gap-2 mb-4 pb-4 border-b border-gray-150 dark:border-gray-800">
              <div class="flex-1 flex items-center gap-2 justify-between lg:w-full">
                <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Filtrar:</span>
                <USelect
                  v-model="inventoryFilterTier"
                  :options="[
                    { value: 'all', label: 'Todos los Tiers' },
                    { value: 'gris', label: getTierClasses('gris').name },
                    { value: 'azul', label: getTierClasses('azul').name },
                    { value: 'verde', label: getTierClasses('verde').name },
                    { value: 'violeta', label: getTierClasses('violeta').name },
                    { value: 'naranja', label: getTierClasses('naranja').name },
                    { value: 'rojo', label: getTierClasses('rojo').name }
                  ]"
                  size="xs"
                  class="w-36 sm:w-36 lg:w-full lg:max-w-[180px]"
                />
              </div>
              <div class="flex items-center gap-2 justify-between lg:w-full">
                <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Ordenar:</span>
                <USelect
                  v-model="inventorySortBy"
                  :options="[
                    { value: 'tier', label: 'Por Tier (Mejor a peor)' },
                    { value: 'newest', label: 'Más nuevo primero' },
                    { value: 'oldest', label: 'Más viejo primero' }
                  ]"
                  size="xs"
                  class="w-48 sm:w-48 lg:w-full lg:max-w-[180px]"
                />
              </div>
            </div>

            <div v-if="editMode ? (!editInventory || editInventory.length === 0) : (!displayInventory || displayInventory.length === 0)" class="text-center py-8 text-gray-500 dark:text-gray-400">
              {{ t('noItems') }}
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="(item, index) in editMode ? editInventory : displayInventory"
                :key="item.id || index"
                class="border rounded-lg p-3 relative overflow-hidden transition-all duration-300"
                :class="editMode ? 'border-gray-200 dark:border-gray-700' : [getTierClasses(item.tier).card, getTierClasses(item.tier).glow]"
              >
                <!-- Diagonal Tier Banner -->
                <div 
                  v-if="!editMode && item.tier && item.tier !== 'gris'" 
                  class="absolute top-0 right-0 overflow-hidden w-16 h-16 pointer-events-none z-10"
                >
                  <div 
                    class="absolute transform rotate-45 text-[9px] font-bold text-center py-0.5 w-[90px] -right-[26px] top-[12px] shadow-sm uppercase tracking-wider text-white select-none"
                    :class="getTierBannerBg(item.tier)"
                  >
                    {{ t('newTierBanner') }}
                  </div>
                </div>

                <div class="grid grid-cols-1 gap-3">
                  <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-3">
                    <div class="md:col-span-2 lg:col-span-1">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ t('itemName') }}
                      </label>
                      <UInput
                        v-if="editMode"
                        v-model="editInventory[index].name"
                        :placeholder="t('itemName')"
                      />
                      <div v-else class="flex items-center space-x-2">
                        <p class="text-gray-900 dark:text-white font-medium" :class="getTierClasses(item.tier).text">{{ item.name }}</p>
                        <UBadge v-if="item.tier" :color="getTierClasses(item.tier).badgeColor" size="xs" variant="soft">
                          {{ getTierClasses(item.tier).name }}
                        </UBadge>
                      </div>
                    </div>
                    <div v-if="editMode">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ t('tier') }}
                      </label>
                      <USelect
                        v-model="editInventory[index].tier"
                        :options="tierOptions"
                        size="sm"
                      />
                    </div>
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
          <UCard :class="{ 'hidden lg:block': activeMobileTab !== 'general' }">
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
        <div class="lg:col-span-2 space-y-6" :class="{ 'hidden lg:block': !['general', 'attributes', 'combat'].includes(activeMobileTab) }">
          <!-- Ability Scores Card -->
           <UCard :class="{ 'hidden lg:block': activeMobileTab !== 'attributes' }">
             <template #header>
               <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                 {{ t('abilityScores') }}
               </h3>
             </template>
             
             <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
               <div 
                 v-for="stat in [
                   { key: 'str', ability: 'strength', bg: 'from-red-500/5 to-orange-500/5 dark:from-red-500/10 dark:to-orange-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400' },
                   { key: 'dex', ability: 'dexterity', bg: 'from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400' },
                   { key: 'con', ability: 'constitution', bg: 'from-orange-500/5 to-amber-500/5 dark:from-orange-500/10 dark:to-amber-500/10 border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400' },
                   { key: 'int', ability: 'intelligence', bg: 'from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10 border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400' },
                   { key: 'wis', ability: 'wisdom', bg: 'from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
                   { key: 'cha', ability: 'charisma', bg: 'from-pink-500/5 to-rose-500/5 dark:from-pink-500/10 dark:to-rose-500/10 border-pink-200 dark:border-pink-500/20 text-pink-600 dark:text-pink-400' }
                 ]" 
                 :key="stat.key" 
                 class="relative group flex flex-col items-center justify-between p-3 rounded-xl border bg-gradient-to-b dark:bg-zinc-950/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg" 
                 :class="stat.bg"
               >
                 <span class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                   {{ t(stat.key) }}
                 </span>
                 
                 <div class="my-2 text-center w-full flex flex-col items-center">
                   <template v-if="editMode">
                     <UInput
                       v-model.number="editForm[stat.ability]"
                       type="number"
                       min="1"
                       max="30"
                       class="text-center w-20"
                     />
                   </template>
                   <template v-else>
                     <span class="text-3xl font-extrabold text-gray-900 dark:text-white">
                       {{ getFormattedBonus(getAbilityModifier(character[stat.ability] || 10)) }}
                     </span>
                     <span class="mt-1.5 px-2 py-0.5 text-xs rounded-full bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700/50 font-semibold">
                       {{ character[stat.ability] || 10 }}
                     </span>
                   </template>
                 </div>
               </div>
             </div>
           </UCard>
          <!-- Basic Info Card -->
          <UCard :class="{ 'hidden lg:block': activeMobileTab !== 'general' }">
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
                <label class="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2 tracking-wide">
                  Habilidades Mágicas
                </label>
                <div v-if="editMode" class="flex items-center space-x-3 py-1">
                  <UToggle
                    v-model="editForm.isWizard"
                    color="cyan"
                  />
                  <span class="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    {{ editForm.isWizard ? 'Magia Habilitada' : 'Magia Deshabilitada' }}
                  </span>
                </div>
                <div v-else class="flex items-center py-1">
                  <UBadge 
                    v-if="character?.notes?.isWizard"
                    color="cyan" 
                    variant="soft" 
                    size="sm"
                    class="font-bold tracking-wide shadow-[0_0_10px_rgba(6,182,212,0.15)] animate-pulse"
                  >
                    ✨ Magia Activa
                  </UBadge>
                  <UBadge 
                    v-else
                    color="gray" 
                    variant="soft" 
                    size="sm"
                    class="opacity-60"
                  >
                    Sin Magia
                  </UBadge>
                </div>
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
          
           <!-- Combat Stats Card -->
           <UCard :class="{ 'hidden lg:block': activeMobileTab !== 'combat' }">
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

                <div v-if="editMode">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('maxStamina') || 'Estamina Máx.' }}
                  </label>
                  <UInput
                    v-model.number="editForm.maxStamina"
                    type="number"
                    min="1"
                  />
                </div>

                <div v-if="editMode">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('stamina') }}
                  </label>
                  <UInput
                    v-model.number="editForm.stamina"
                    type="number"
                    min="0"
                    :max="character.maxStamina || 100"
                  />
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

            <!-- Stamina Bar -->
            <div class="mt-6">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('stamina') }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ Math.round(((character.stamina !== undefined ? character.stamina : 100) / (character.maxStamina || 100)) * 100) }}%
                </span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-3 mb-3">
                <div 
                  class="h-3 rounded-full bg-orange-500 transition-all duration-300"
                  :style="`width: ${Math.max(0, Math.min(100, ((character.stamina !== undefined ? character.stamina : 100) / (character.maxStamina || 100)) * 100))}%`"
                ></div>
              </div>
              
              <!-- Quick Stamina adjustment input and buttons (not in editMode) -->
              <div v-if="!editMode && canEdit" class="space-y-3">
                <div class="flex items-center space-x-2">
                  <UInput
                    v-model.number="staminaAdjustment"
                    type="number"
                    placeholder="±Estamina"
                    class="w-24 text-sm"
                    @keyup.enter="adjustStaminaByAmount"
                  />
                  <UButton
                    size="sm"
                    variant="outline"
                    @click="adjustStaminaByAmount"
                    :disabled="!staminaAdjustment || staminaAdjustment === 0"
                  >
                    {{ t('adjust') || 'Ajustar' }}
                  </UButton>
                </div>
                <div class="flex space-x-2">
                  <UButton
                    size="sm"
                    color="orange"
                    variant="soft"
                    icon="i-heroicons-arrow-path"
                    @click="adjustStamina(character.maxStamina !== undefined ? character.maxStamina : 100)"
                  >
                    {{ t('refillStamina') }}
                  </UButton>
                  <UButton
                    size="sm"
                    color="red"
                    variant="soft"
                    icon="i-heroicons-minus"
                    @click="adjustStamina(Math.max(0, (character.stamina !== undefined ? character.stamina : 100) - 5))"
                  >
                    {{ t('subtractStamina') }}
                  </UButton>
                </div>
              </div>
            </div>
          </UCard>
          

          
           <!-- Combat Actions Card -->
           <UCard :class="{ 'hidden lg:block': activeMobileTab !== 'combat' }">
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
          

            <!-- PANEL DE HABILIDADES MÁGICAS (WIZARD SPECIALTY FEATURE) -->
            <UCard
              v-if="editMode ? editForm.isWizard : character?.notes?.isWizard"
              class="border border-cyan-200 dark:border-cyan-800/40 shadow-[0_0_15px_rgba(6,182,212,0.05)]"
              :class="{ 'hidden lg:block': activeMobileTab !== 'combat' }"
            >
              <template #header>
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 class="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-blue-400 flex items-center gap-2">
                      <UIcon name="i-heroicons-sparkles" class="text-cyan-500 animate-pulse" />
                      Habilidades Mágicas / Conjuros
                    </h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Gestiona tus habilidades mágicas consumiendo puntos de tu reserva de maná/energía.
                    </p>
                  </div>
                  
                  <!-- Magic Points Pool display -->
                  <div class="flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-950/40 dark:to-blue-950/40 border border-cyan-200/50 dark:border-cyan-800/30 rounded-xl px-4 py-2">
                    <span class="text-xs font-semibold text-cyan-600 dark:text-cyan-400">Puntos Mágicos:</span>
                    <div v-if="editMode" class="flex items-center gap-1">
                      <UInput
                        v-model.number="editForm.magicLimit"
                        type="number"
                        min="0"
                        class="w-20 text-center"
                        size="xs"
                      />
                    </div>
                    <div v-else class="flex items-center gap-2">
                      <div class="flex items-center gap-1.5">
                        <span class="text-lg font-extrabold text-cyan-600 dark:text-cyan-400">
                          {{ getRemainingMagicPoints(character) }}
                        </span>
                        <span class="text-xs text-gray-400">/</span>
                        <span class="text-sm font-semibold text-gray-600 dark:text-zinc-300">
                          {{ character?.notes?.magicLimit || 100 }}
                        </span>
                      </div>
                      <UButton
                        color="cyan"
                        variant="ghost"
                        size="xs"
                        icon="i-heroicons-arrow-path"
                        class="p-1"
                        title="Restablecer Puntos Mágicos"
                        @click="resetMagicPoints"
                      />
                    </div>
                  </div>
                </div>
              </template>

              <!-- Warning / Empty state -->
              <div
                v-if="editMode ? (!editForm.magicAbilities || editForm.magicAbilities.length === 0) : (!character?.notes?.magicAbilities || character.notes.magicAbilities.length === 0) && displayMagicAttacks.length === 0 && displayMagicSkills.length === 0"
                class="text-center py-8 text-gray-500 dark:text-gray-400"
              >
                No tienes habilidades mágicas configuradas.
                <div v-if="editMode" class="mt-4">
                  <UButton
                    color="cyan"
                    variant="soft"
                    size="sm"
                    icon="i-heroicons-plus"
                    @click="addMagicAbility"
                  >
                    Agregar Habilidad Mágica
                  </UButton>
                </div>
              </div>

              <!-- List of magic abilities -->
              <div v-if="editMode ? true : (character?.notes?.magicAbilities?.length > 0 || displayMagicAttacks.length > 0 || displayMagicSkills.length > 0)" class="space-y-4">
                <div class="flex justify-between items-center pb-2 border-b border-gray-150 dark:border-gray-800/60">
                  <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Lista de Habilidades Mágicas</span>
                  <UButton
                    v-if="editMode"
                    color="cyan"
                    variant="ghost"
                    size="xs"
                    icon="i-heroicons-plus"
                    @click="addMagicAbility"
                  >
                    Añadir habilidad
                  </UButton>
                </div>

                <div
                  v-if="editMode ? (editForm.magicAbilities && editForm.magicAbilities.length > 0) : (character?.notes?.magicAbilities && character.notes.magicAbilities.length > 0)"
                  v-for="(magicAbility, index) in editMode ? editForm.magicAbilities : character.notes.magicAbilities"
                  :key="index"
                  class="relative border rounded-xl p-4 transition-all duration-300 overflow-hidden bg-gradient-to-r dark:bg-zinc-950/30"
                  :class="editMode ? 'border-gray-200 dark:border-gray-800' : [getTierClasses(magicAbility.tier).card, getTierClasses(magicAbility.tier).glow]"
                >
                  <!-- Diagonal Tier Banner -->
                  <div 
                    v-if="!editMode && magicAbility.tier && magicAbility.tier !== 'gris'" 
                    class="absolute top-0 right-0 overflow-hidden w-16 h-16 pointer-events-none z-10"
                  >
                    <div 
                      class="absolute transform rotate-45 text-[9px] font-bold text-center py-0.5 w-[90px] -right-[26px] top-[12px] shadow-sm uppercase tracking-wider text-white select-none"
                      :class="getTierBannerBg(magicAbility.tier)"
                    >
                      Mágico
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <!-- Title / Name -->
                    <div class="md:col-span-2">
                      <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Nombre de la Habilidad
                      </label>
                      <UInput
                        v-if="editMode"
                        v-model="editForm.magicAbilities[index].name"
                        placeholder="Ej. Tormenta de Ceniza"
                        size="sm"
                      />
                      <p v-else class="font-bold text-gray-900 dark:text-white" :class="getTierClasses(magicAbility.tier).text">
                        {{ magicAbility.name || 'Habilidad Mágica Sin Nombre' }}
                      </p>
                    </div>

                    <!-- Tier Selection -->
                    <div>
                      <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Tier
                      </label>
                      <USelect
                        v-if="editMode"
                        v-model="editForm.magicAbilities[index].tier"
                        :options="tierOptions"
                        size="sm"
                      />
                      <div v-else-if="magicAbility.tier" class="mt-1">
                        <UBadge :color="getTierClasses(magicAbility.tier).badgeColor" size="xs" variant="soft">
                          {{ getTierClasses(magicAbility.tier).name }}
                        </UBadge>
                      </div>
                    </div>

                    <!-- Cost in points -->
                    <div>
                      <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Consumo de Maná
                      </label>
                      <div class="flex items-center gap-1.5">
                        <UInput
                          v-if="editMode"
                          v-model.number="editForm.magicAbilities[index].cost"
                          type="number"
                          min="0"
                          size="sm"
                          class="w-20"
                        />
                        <span v-else class="font-bold text-cyan-600 dark:text-cyan-400 text-sm mt-1">
                          {{ magicAbility.cost ?? 0 }} MP
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Description -->
                  <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/40">
                    <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Descripción del Efecto / Nota
                    </label>
                    <UTextarea
                      v-if="editMode"
                      v-model="editForm.magicAbilities[index].notes"
                      placeholder="Indica qué hace esta habilidad mágica al activarse..."
                      :rows="2"
                      size="sm"
                    />
                    <p v-else class="text-gray-700 dark:text-gray-300 text-sm italic">
                      {{ magicAbility.notes || 'Sin descripción' }}
                    </p>
                  </div>

                  <!-- Use / Activate Buttons in Read Mode, Trash in Edit Mode -->
                  <div class="mt-3 flex justify-between items-center border-t border-gray-100 dark:border-gray-800/40 pt-3">
                    <div class="flex items-center gap-2">
                      <span v-if="!editMode" class="text-xs text-gray-400">
                        {{ getFormattedBonus(getAbilityModifier(character.intelligence || 10)) }} check
                      </span>
                    </div>

                    <!-- Activate button to consume points directly -->
                    <div v-if="!editMode">
                      <UButton
                        color="cyan"
                        variant="solid"
                        size="xs"
                        icon="i-heroicons-bolt"
                        :disabled="!canUseAbility(magicAbility)"
                        @click="useMagicAbility(magicAbility)"
                      >
                        Usar Habilidad ({{ magicAbility.cost ?? 0 }})
                      </UButton>
                    </div>

                    <UButton
                      v-if="editMode"
                      color="red"
                      variant="ghost"
                      size="xs"
                      icon="i-heroicons-trash"
                      @click="removeMagicAbility(index)"
                    >
                      {{ t('remove') || 'Eliminar' }}
                    </UButton>
                  </div>
                </div>

                <!-- SECCIÓN: ATAQUES Y CONJUROS MÁGICOS ASIGNADOS (Read mode only) -->
                <div v-if="!editMode && (displayMagicAttacks.length > 0 || displayMagicSkills.length > 0)" class="mt-6 pt-6 border-t border-cyan-200/40 dark:border-cyan-800/30 space-y-4">
                  <span class="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">Ataques y Habilidades Mágicas del Personaje</span>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Attacks/Spells list -->
                    <div 
                      v-for="attack in displayMagicAttacks" 
                      :key="attack.id"
                      class="border border-cyan-200/50 dark:border-cyan-800/30 bg-cyan-50/5 dark:bg-cyan-950/10 rounded-xl p-3 flex flex-col justify-between"
                    >
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="font-bold text-sm text-gray-900 dark:text-white">{{ attack.name }}</span>
                          <UBadge :color="getTierClasses(attack.tier).badgeColor" size="xs" variant="soft">
                            {{ getTierClasses(attack.tier).name }}
                          </UBadge>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Daño: <span class="font-semibold text-gray-800 dark:text-zinc-200">{{ attack.damage || 'N/A' }}</span>
                          | Rango: <span class="text-gray-800 dark:text-zinc-200">{{ attack.rangeText || 'N/A' }}</span>
                        </p>
                        <p class="text-xs text-gray-600 dark:text-gray-300 mt-1 italic line-clamp-2">{{ attack.notes || 'Sin descripción' }}</p>
                      </div>

                      <div class="mt-3 pt-2 border-t border-cyan-200/30 dark:border-cyan-800/20 flex justify-between items-center">
                        <span class="text-xs font-bold text-cyan-600 dark:text-cyan-400">{{ attack.magicCost || 0 }} MP</span>
                        <UButton
                          color="cyan"
                          variant="solid"
                          size="xs"
                          icon="i-heroicons-bolt"
                          :disabled="!canUseAbility({ cost: attack.magicCost })"
                          @click="useAttackMagicPoints(attack)"
                        >
                          Lanzar Magia
                        </UButton>
                      </div>
                    </div>

                    <!-- Skills list -->
                    <div 
                      v-for="ability in displayMagicSkills" 
                      :key="ability.id"
                      class="border border-cyan-200/50 dark:border-cyan-800/30 bg-cyan-50/5 dark:bg-cyan-950/10 rounded-xl p-3 flex flex-col justify-between"
                    >
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="font-bold text-sm text-gray-900 dark:text-white">{{ ability.name }}</span>
                          <UBadge :color="getTierClasses(ability.tier).badgeColor" size="xs" variant="soft">
                            {{ getTierClasses(ability.tier).name }}
                          </UBadge>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Efecto/Daño: <span class="font-semibold text-gray-800 dark:text-zinc-200">{{ ability.damage || 'N/A' }}</span>
                          | Rango: <span class="text-gray-800 dark:text-zinc-200">{{ ability.rangeText || 'N/A' }}</span>
                        </p>
                        <p class="text-xs text-gray-600 dark:text-gray-300 mt-1 italic line-clamp-2">{{ ability.notes || 'Sin descripción' }}</p>
                      </div>

                      <div class="mt-3 pt-2 border-t border-cyan-200/30 dark:border-cyan-800/20 flex justify-between items-center">
                        <span class="text-xs font-bold text-cyan-600 dark:text-cyan-400">{{ ability.magicCost || 0 }} MP</span>
                        <UButton
                          color="cyan"
                          variant="solid"
                          size="xs"
                          icon="i-heroicons-bolt"
                          :disabled="!canUseAbility({ cost: ability.magicCost })"
                          @click="useAttackMagicPoints(ability)"
                        >
                          Lanzar Magia
                        </UButton>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </UCard>

            
           <!-- Attacks Card -->
           <UCard :class="{ 'hidden lg:block': activeMobileTab !== 'combat' }">
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

              <!-- Filters & Sorting (Read-only mode) -->
              <div v-if="!editMode && character.attacks && character.attacks.filter(a => a.type !== 'skill').length > 0" class="flex flex-col sm:flex-row gap-2 mb-4 pb-4 border-b border-gray-150 dark:border-gray-800">
                <div class="flex-1 flex items-center gap-2">
                  <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Filtrar:</span>
                  <USelect
                    v-model="attacksFilterTier"
                    :options="[
                      { value: 'all', label: 'Todos los Tiers' },
                      { value: 'gris', label: getTierClasses('gris').name },
                      { value: 'azul', label: getTierClasses('azul').name },
                      { value: 'verde', label: getTierClasses('verde').name },
                      { value: 'violeta', label: getTierClasses('violeta').name },
                      { value: 'naranja', label: getTierClasses('naranja').name },
                      { value: 'rojo', label: getTierClasses('rojo').name }
                    ]"
                    size="xs"
                    class="w-36"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Ordenar:</span>
                  <USelect
                    v-model="attacksSortBy"
                    :options="[
                      { value: 'tier', label: 'Por Tier (Mejor a peor)' },
                      { value: 'newest', label: 'Más nuevo primero' },
                      { value: 'oldest', label: 'Más viejo primero' }
                    ]"
                    size="xs"
                    class="w-48"
                  />
                </div>
              </div>

               <div v-if="editMode ? (!editAttacks || editAttacks.filter(a => a.type !== 'skill').length === 0) : (!displayAttacks || displayAttacks.length === 0)" class="text-center py-8 text-gray-500 dark:text-gray-400">
                 {{ t('noAttacks') }}
               </div>

               <div v-else class="space-y-4">
                 <template v-for="(attack, index) in editMode ? editAttacks : displayAttacks" :key="attack.id || index">
                   <div
                     v-if="attack.type !== 'skill'"
                     class="border rounded-lg p-4 relative overflow-hidden transition-all duration-300"
                     :class="editMode ? 'border-gray-200 dark:border-gray-700' : [getTierClasses(attack.tier).card, getTierClasses(attack.tier).glow]"
                   >
                     <!-- Diagonal Tier Banner -->
                     <div 
                       v-if="!editMode && attack.tier && attack.tier !== 'gris'" 
                       class="absolute top-0 right-0 overflow-hidden w-16 h-16 pointer-events-none z-10"
                     >
                       <div 
                         class="absolute transform rotate-45 text-[9px] font-bold text-center py-0.5 w-[90px] -right-[26px] top-[12px] shadow-sm uppercase tracking-wider text-white select-none"
                         :class="getTierBannerBg(attack.tier)"
                       >
                         {{ t('newTierBanner') }}
                       </div>
                     </div>

                     <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       <div class="lg:col-span-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                         <div class="flex-1">
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             {{ t('name') }}
                           </label>
                           <UInput
                             v-if="editMode"
                             v-model="editAttacks[index].name"
                             :placeholder="t('attackName')"
                           />
                           <p v-else class="font-bold text-gray-900 dark:text-white" :class="getTierClasses(attack.tier).text">
                             {{ attack.name }}
                           </p>
                         </div>

                         <div v-if="editMode" class="w-full md:w-32">
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             {{ t('tier') }}
                           </label>
                           <USelect
                             v-model="editAttacks[index].tier"
                             :options="tierOptions"
                             size="sm"
                           />
                         </div>
                         <div v-else-if="attack.tier" class="self-start md:self-center mt-1 md:mt-5">
                           <UBadge :color="getTierClasses(attack.tier).badgeColor" size="xs" variant="soft">
                             {{ getTierClasses(attack.tier).name }}
                           </UBadge>
                         </div>
                       </div>

                       <div>
                         <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                           {{ t('attackBonus') }}
                         </label>
                         <UInput
                           v-if="editMode"
                           v-model.number="editAttacks[index].attackBonus"
                           type="number"
                           placeholder="+0"
                         />
                         <p v-else class="text-gray-900 dark:text-white font-medium text-sm mt-1">
                           {{ attack.attackBonus !== undefined ? (attack.attackBonus >= 0 ? '+' : '') + attack.attackBonus : 'N/A' }}
                         </p>
                       </div>

                       <div class="grid grid-cols-2 gap-2">
                         <div>
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             {{ t('damage') }}
                           </label>
                           <UInput
                             v-if="editMode"
                             v-model="editAttacks[index].damage"
                             placeholder="1d8+3"
                           />
                           <p v-else class="text-gray-900 dark:text-white font-medium text-sm mt-1">{{ attack.damage || 'N/A' }}</p>
                         </div>

                         <div>
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             {{ t('rangeProperties') }}
                           </label>
                           <UInput
                             v-if="editMode"
                             v-model="editAttacks[index].rangeText"
                             placeholder="5 ft"
                           />
                           <p v-else class="text-gray-900 dark:text-white text-sm mt-1">{{ attack.rangeText || 'N/A' }}</p>
                         </div>
                       </div>
                     </div>

                     <div class="mt-4">
                       <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                         {{ t('description') }}
                       </label>
                       <UTextarea
                         v-if="editMode"
                         v-model="editAttacks[index].notes"
                         :placeholder="t('attackDescription')"
                         :rows="2"
                       />
                       <p v-else class="text-gray-700 dark:text-gray-300 text-sm border-t border-gray-100 dark:border-gray-800/40 pt-1.5 mt-1 italic">
                         {{ attack.notes || t('noDescription') }}
                       </p>
                     </div>

                     <div v-if="editMode" class="mt-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-3">
                       <div class="flex items-center space-x-2">
                         <span class="text-xs text-gray-500">{{ t('entryType') }}:</span>
                         <USelect
                           v-model="editAttacks[index].type"
                           :options="[
                             { value: 'attack', label: t('attackType') },
                             { value: 'skill', label: t('skillType') }
                           ]"
                           size="sm"
                         />
                       </div>
                       <div class="flex items-center gap-2">
                         <UCheckbox v-model="editAttacks[index].isMagic" size="sm" />
                         <span class="text-xs text-gray-500">¿Es Mágico?</span>
                         <UInput v-if="editAttacks[index].isMagic" v-model.number="editAttacks[index].magicCost" type="number" min="0" size="xs" class="w-16" />
                       </div>
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
                     <div v-else-if="attack.isMagic" class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/40 flex justify-between items-center">
                       <div class="flex items-center gap-2">
                         <UBadge color="cyan" variant="soft" size="xs">Mágico</UBadge>
                         <span class="text-xs text-cyan-650 dark:text-cyan-400 font-semibold">{{ attack.magicCost || 0 }} MP</span>
                       </div>
                       <UButton
                         v-if="character?.notes?.isWizard"
                         color="cyan"
                         variant="solid"
                         size="xs"
                         icon="i-heroicons-bolt"
                         :disabled="!canUseAbility({ cost: attack.magicCost })"
                         @click="useAttackMagicPoints(attack)"
                       >
                         Lanzar Magia
                       </UButton>
                     </div>
                   </div>
                 </template>
               </div>
             </UCard>

             <!-- Custom Skills Card -->
             <UCard class="mt-6" :class="{ 'hidden lg:block': activeMobileTab !== 'combat' }">
               <template #header>
                 <div class="flex items-center justify-between">
                   <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                     {{ t('skillsLabel') }}
                   </h3>
                   <UButton
                     v-if="editMode && canEdit"
                     color="primary"
                     variant="soft"
                     size="sm"
                     icon="i-heroicons-plus"
                     @click="addSkill"
                   >
                     {{ t('addSkill') }}
                   </UButton>
                 </div>
               </template>

              <!-- Filters & Sorting (Read-only mode) -->
              <div v-if="!editMode && character.attacks && character.attacks.filter(a => a.type === 'skill').length > 0" class="flex flex-col sm:flex-row gap-2 mb-4 pb-4 border-b border-gray-150 dark:border-gray-800">
                <div class="flex-1 flex items-center gap-2">
                  <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Filtrar:</span>
                  <USelect
                    v-model="skillsFilterTier"
                    :options="[
                      { value: 'all', label: 'Todos los Tiers' },
                      { value: 'gris', label: getTierClasses('gris').name },
                      { value: 'azul', label: getTierClasses('azul').name },
                      { value: 'verde', label: getTierClasses('verde').name },
                      { value: 'violeta', label: getTierClasses('violeta').name },
                      { value: 'naranja', label: getTierClasses('naranja').name },
                      { value: 'rojo', label: getTierClasses('rojo').name }
                    ]"
                    size="xs"
                    class="w-36"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Ordenar:</span>
                  <USelect
                    v-model="skillsSortBy"
                    :options="[
                      { value: 'tier', label: 'Por Tier (Mejor a peor)' },
                      { value: 'newest', label: 'Más nuevo primero' },
                      { value: 'oldest', label: 'Más viejo primero' }
                    ]"
                    size="xs"
                    class="w-48"
                  />
                </div>
              </div>

               <div v-if="editMode ? (!editAttacks || editAttacks.filter(a => a.type === 'skill').length === 0) : (!displaySkills || displaySkills.length === 0)" class="text-center py-8 text-gray-500 dark:text-gray-400">
                 {{ t('noSkills') }}
               </div>

               <div v-else class="space-y-4">
                 <template v-for="(ability, index) in editMode ? editAttacks : displaySkills" :key="ability.id || index">
                   <div
                     v-if="ability.type === 'skill'"
                     class="border rounded-lg p-4 relative overflow-hidden transition-all duration-300"
                     :class="editMode ? 'border-gray-200 dark:border-gray-700' : [getTierClasses(ability.tier).card, getTierClasses(ability.tier).glow]"
                   >
                     <!-- Diagonal Tier Banner -->
                     <div 
                       v-if="!editMode && ability.tier && ability.tier !== 'gris'" 
                       class="absolute top-0 right-0 overflow-hidden w-16 h-16 pointer-events-none z-10"
                     >
                       <div 
                         class="absolute transform rotate-45 text-[9px] font-bold text-center py-0.5 w-[90px] -right-[26px] top-[12px] shadow-sm uppercase tracking-wider text-white select-none"
                         :class="getTierBannerBg(ability.tier)"
                       >
                         {{ t('newTierBanner') }}
                       </div>
                     </div>

                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 md:col-span-2">
                         <div class="flex-1">
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             {{ t('skillName') }}
                           </label>
                           <UInput
                             v-slot="{}"
                             v-if="editMode"
                             v-model="editAttacks[index].name"
                             :placeholder="t('skillName')"
                           />
                           <p v-else class="font-bold text-gray-900 dark:text-white" :class="getTierClasses(ability.tier).text">
                             {{ ability.name }}
                           </p>
                         </div>

                         <div v-if="editMode" class="w-full md:w-32">
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             {{ t('tier') }}
                           </label>
                           <USelect
                             v-model="editAttacks[index].tier"
                             :options="tierOptions"
                             size="sm"
                           />
                         </div>
                         <div v-else-if="ability.tier" class="self-start md:self-center mt-1 md:mt-5">
                           <UBadge :color="getTierClasses(ability.tier).badgeColor" size="xs" variant="soft">
                             {{ getTierClasses(ability.tier).name }}
                           </UBadge>
                         </div>
                       </div>

                       <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             Effect/Damage
                           </label>
                           <UInput
                             v-slot="{}"
                             v-if="editMode"
                             v-model="editAttacks[index].damage"
                             placeholder="e.g. 8d6 Fire, or 3d8 Healing"
                           />
                           <p v-else class="text-gray-900 dark:text-white text-sm mt-1 font-semibold">{{ ability.damage || 'N/A' }}</p>
                         </div>

                         <div>
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             Range/Properties
                           </label>
                           <UInput
                             v-if="editMode"
                             v-model="editAttacks[index].rangeText"
                             placeholder="e.g. 150 ft, Self"
                           />
                           <p v-else class="text-gray-900 dark:text-white text-sm mt-1">{{ ability.rangeText || 'N/A' }}</p>
                         </div>
                       </div>
                     </div>

                     <div class="mt-4">
                       <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                         {{ t('description') }}
                       </label>
                       <UTextarea
                         v-if="editMode"
                         v-model="editAttacks[index].notes"
                         :placeholder="t('skillDescriptionPlaceholder')"
                         :rows="2"
                       />
                       <p v-else class="text-gray-700 dark:text-gray-300 text-sm border-t border-gray-150 dark:border-gray-800/40 pt-1.5 mt-1 italic">
                         {{ ability.notes || t('noNotes') }}
                       </p>
                     </div>

                     <div v-if="editMode" class="mt-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-3">
                       <div class="flex items-center space-x-2">
                         <span class="text-xs text-gray-500">{{ t('entryType') }}:</span>
                         <USelect
                           v-model="editAttacks[index].type"
                           :options="[
                             { value: 'attack', label: t('attackType') },
                             { value: 'skill', label: t('skillType') }
                           ]"
                           size="sm"
                         />
                       </div>
                       <div class="flex items-center gap-2">
                         <UCheckbox v-model="editAttacks[index].isMagic" size="sm" />
                         <span class="text-xs text-gray-500">¿Es Mágico?</span>
                         <UInput v-if="editAttacks[index].isMagic" v-model.number="editAttacks[index].magicCost" type="number" min="0" size="xs" class="w-16" />
                       </div>
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
                     <div v-else-if="ability.isMagic" class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/40 flex justify-between items-center">
                       <div class="flex items-center gap-2">
                         <UBadge color="cyan" variant="soft" size="xs">Mágico</UBadge>
                         <span class="text-xs text-cyan-650 dark:text-cyan-400 font-semibold">{{ ability.magicCost || 0 }} MP</span>
                       </div>
                       <UButton
                         v-if="character?.notes?.isWizard"
                         color="cyan"
                         variant="solid"
                         size="xs"
                         icon="i-heroicons-bolt"
                         :disabled="!canUseAbility({ cost: ability.magicCost })"
                         @click="useAttackMagicPoints(ability)"
                       >
                         Lanzar Magia
                       </UButton>
                     </div>
                   </div>
                 </template>
               </div>
             </UCard>
          </div>
         
         <!-- Right Sidebar - Skills & Saving Throws -->
          <div class="space-y-6" :class="{ 'hidden lg:block': !['general', 'attributes'].includes(activeMobileTab) }">


            <!-- Saving Throws -->
            <UCard :class="{ 'hidden lg:block': activeMobileTab !== 'attributes' }">
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
            <UCard :class="{ 'hidden lg:block': activeMobileTab !== 'attributes' }">
              <template #header>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ t('skills') }}
                </h3>
              </template>

              <div class="space-y-2">
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
            <UCard :class="{ 'hidden lg:block': activeMobileTab !== 'general' }">
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
                  <div v-if="editMode" class="flex items-center space-x-2">
                    <UInput
                      v-model.number="editForm.inspiration"
                      type="number"
                      min="0"
                      max="20"
                      class="w-16 text-center"
                      :placeholder="character.inspiration || 0"
                    />
                  </div>
                  <span v-else class="font-medium text-gray-900 dark:text-white">{{ character.inspiration || 0 }}</span>
                </div>
              </div>
            </UCard>
          </div>
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
const activeMobileTab = ref('general')
const editMode = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const imageLoadError = ref(false)
const hpAdjustment = ref<number | null>(null)
const staminaAdjustment = ref<number | null>(null)

// Sorting and Filtering reactive variables
const inventoryFilterTier = ref('all')
const inventorySortBy = ref('tier')
const attacksFilterTier = ref('all')
const attacksSortBy = ref('tier')
const skillsFilterTier = ref('all')
const skillsSortBy = ref('tier')

// Form data
const editForm = ref<Partial<CharacterDTO>>({})
const characterNotes = ref('')

// Attacks and inventory data
const editAttacks = ref<Array<{name: string, attackBonus?: number, damage?: string, rangeText?: string, notes?: string, type?: string, tier?: string, isMagic?: boolean, magicCost?: number}>>([])
const editInventory = ref<Array<{name: string, quantity: number, weight?: number, equipped: boolean, notes?: string, tier?: string}>>([])
const editCombatActions = ref<Array<{name: string, type: string, currentUses: number, maxUses: number, description?: string}>>([])

// Tier definitions and style maps
const tierOptions = computed(() => [
  { value: 'gris', label: t('gris') || 'Común' },
  { value: 'azul', label: t('azul') || 'Poco común' },
  { value: 'verde', label: t('verde') || 'Raro' },
  { value: 'violeta', label: t('violeta') || 'Ultrararo' },
  { value: 'naranja', label: t('naranja') || 'Épico' },
  { value: 'rojo', label: t('rojo') || 'Legendario' }
])

const getTierClasses = (tier?: string) => {
  switch (tier?.toLowerCase()) {
    case 'azul':
      return {
        card: 'border-l-4 border-l-blue-500 bg-blue-50/5 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/50',
        text: 'text-blue-600 dark:text-blue-400 font-semibold',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        badgeColor: 'blue',
        name: t('tierRefinado') || 'Poco Común',
        glow: 'shadow-[0_0_10px_rgba(59,130,246,0.15)]'
      }
    case 'verde':
      return {
        card: 'border-l-4 border-l-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50',
        text: 'text-emerald-600 dark:text-emerald-400 font-semibold',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        badgeColor: 'green',
        name: t('tierMagico') || 'Mágico',
        glow: 'shadow-[0_0_10px_rgba(16,185,129,0.15)]'
      }
    case 'violeta':
      return {
        card: 'border-l-4 border-l-purple-500 bg-purple-50/5 dark:bg-purple-950/10 border-purple-200 dark:border-purple-900/50',
        text: 'text-purple-600 dark:text-purple-400 font-semibold',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        badgeColor: 'purple',
        name: t('tierMistico') || 'Ultrararo',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.25)]'
      }
    case 'naranja':
      return {
        card: 'border-l-4 border-l-orange-500 bg-orange-50/5 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900/50',
        text: 'text-orange-600 dark:text-orange-400 font-bold',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        badgeColor: 'orange',
        name: t('tierLegendario') || 'Épico',
        glow: 'shadow-[0_0_20px_rgba(249,115,22,0.35)]'
      }
    case 'rojo':
    case 'rojo sangre':
      return {
        card: 'border-l-4 border-l-red-650 bg-red-50/5 dark:bg-red-950/15 border-red-300 dark:border-red-900/50',
        text: 'text-red-600 dark:text-red-500 font-extrabold tracking-wide uppercase font-serif animate-pulse',
        badge: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border border-red-500/30',
        badgeColor: 'red',
        name: t('tierDivino') || 'Legendario',
        glow: 'shadow-[0_0_25px_rgba(220,38,38,0.5)] border border-red-500/50'
      }
    case 'gris':
    default:
      return {
        card: 'border-l-4 border-l-zinc-400 bg-zinc-50/5 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-800',
        text: 'text-zinc-700 dark:text-zinc-300',
        badge: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
        badgeColor: 'gray',
        name: t('tierComun') || 'Común',
        glow: ''
      }
  }
}

const getTierBannerBg = (tier?: string) => {
  switch (tier?.toLowerCase()) {
    case 'azul': return 'bg-blue-600'
    case 'verde': return 'bg-emerald-600'
    case 'violeta': return 'bg-purple-600'
    case 'naranja': return 'bg-orange-500'
    case 'rojo':
    case 'rojo sangre': return 'bg-red-600 animate-pulse'
    default: return 'bg-gray-500'
  }
}

const getTierPriority = (tier?: string) => {
  switch (tier?.toLowerCase()) {
    case 'rojo':
    case 'rojo sangre': return 5
    case 'naranja': return 4
    case 'violeta': return 3
    case 'verde': return 2
    case 'azul': return 1
    case 'gris':
    default: return 0
  }
}

const displayInventory = computed(() => {
  if (!character.value?.inventory) return []
  let items = [...character.value.inventory]
  if (inventoryFilterTier.value !== 'all') {
    items = items.filter(item => (item.tier || 'gris').toLowerCase() === inventoryFilterTier.value.toLowerCase())
  }
  items.sort((a, b) => {
    if (inventorySortBy.value === 'tier') {
      return getTierPriority(b.tier) - getTierPriority(a.tier)
    } else if (inventorySortBy.value === 'newest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    } else if (inventorySortBy.value === 'oldest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateA - dateB
    }
    return 0
  })
  return items
})

const displayAttacks = computed(() => {
  if (!character.value?.attacks) return []
  let list = character.value.attacks.filter(a => a.type !== 'skill' && !a.isMagic)
  if (attacksFilterTier.value !== 'all') {
    list = list.filter(a => (a.tier || 'gris').toLowerCase() === attacksFilterTier.value.toLowerCase())
  }
  list.sort((a, b) => {
    if (attacksSortBy.value === 'tier') {
      return getTierPriority(b.tier) - getTierPriority(a.tier)
    } else if (attacksSortBy.value === 'newest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    } else if (attacksSortBy.value === 'oldest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateA - dateB
    }
    return 0
  })
  return list
})

const displaySkills = computed(() => {
  if (!character.value?.attacks) return []
  let list = character.value.attacks.filter(a => a.type === 'skill' && !a.isMagic)
  if (skillsFilterTier.value !== 'all') {
    list = list.filter(a => (a.tier || 'gris').toLowerCase() === skillsFilterTier.value.toLowerCase())
  }
  list.sort((a, b) => {
    if (skillsSortBy.value === 'tier') {
      return getTierPriority(b.tier) - getTierPriority(a.tier)
    } else if (skillsSortBy.value === 'newest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    } else if (skillsSortBy.value === 'oldest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateA - dateB
    }
    return 0
  })
  return list
})

const displayMagicAttacks = computed(() => {
  if (!character.value?.attacks) return []
  return character.value.attacks.filter(a => a.type !== 'skill' && a.isMagic)
})

const displayMagicSkills = computed(() => {
  if (!character.value?.attacks) return []
  return character.value.attacks.filter(a => a.type === 'skill' && a.isMagic)
})

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
    notes: '',
    type: 'attack',
    tier: 'gris'
  })
}

function addSkill() {
  editAttacks.value.push({
    name: '',
    attackBonus: undefined,
    damage: '',
    rangeText: '',
    notes: '',
    type: 'skill',
    tier: 'gris'
  })
}

// Magic abilities management methods
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

function getRemainingMagicPoints(char: any) {
  if (!char?.notes) return 100
  const limit = char.notes.magicLimit !== undefined ? Number(char.notes.magicLimit) : 100
  
  // Calculate consumed points by used abilities
  const abilities = char.notes.magicAbilities || []
  const consumedAbilities = abilities.reduce((acc: number, abi: any) => {
    return acc + (abi.usedCount ? (abi.usedCount * (abi.cost || 0)) : 0)
  }, 0)

  // Calculate consumed points by used attacks / skills
  const attacks = char.attacks || []
  const consumedAttacks = attacks.reduce((acc: number, att: any) => {
    if (att.isMagic && att.usedCount) {
      return acc + (att.usedCount * (att.magicCost || 0))
    }
    return acc
  }, 0)
  
  return Math.max(0, limit - (consumedAbilities + consumedAttacks))
}

function canUseAbility(ability: any) {
  if (!character.value) return false
  const remaining = getRemainingMagicPoints(character.value)
  return remaining >= (ability.cost || 0)
}

async function useAttackMagicPoints(attack: any) {
  if (!character.value) return
  if (!canUseAbility({ cost: attack.magicCost })) return

  // Clone attacks array and increment usedCount for targeted attack
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

async function useMagicAbility(ability: any) {
  if (!character.value) return
  if (!canUseAbility(ability)) return
  
  // Clone notes to update cleanly
  const updatedNotes = character.value.notes ? JSON.parse(JSON.stringify(character.value.notes)) : {}
  if (!updatedNotes.magicAbilities) updatedNotes.magicAbilities = []
  
  // Find ability and increment its used count
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

async function resetMagicPoints() {
  if (!character.value) return
  
  // Clone notes to update cleanly
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

async function adjustStamina(newStamina: number) {
  if (!character.value) return

  try {
    // Direct update of character's stamina using PATCH
    await $fetch(`/api/characters/${character.value.id}`, {
      method: 'PATCH',
      body: { stamina: newStamina }
    })

    // Reload character data to reflect changes
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

    // Direct update of character's stamina using PATCH
    await $fetch(`/api/characters/${character.value.id}`, {
      method: 'PATCH',
      body: { stamina: newStamina }
    })

    // Reload character data to reflect changes
    await loadCharacter()
    staminaAdjustment.value = null
  } catch (err: any) {
    console.error('Error adjusting stamina by amount:', err)
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
      const rawNotes = response.data.notes
      let notesObj: Record<string, any> = {}
      if (rawNotes && typeof rawNotes === 'object') {
        characterNotes.value = rawNotes.text || ''
        notesObj = rawNotes
      } else {
        characterNotes.value = typeof rawNotes === 'string' ? rawNotes : ''
        try {
          notesObj = rawNotes ? JSON.parse(rawNotes) : {}
        } catch (e) {
          notesObj = {}
        }
      }
      
      // Load magic variables
      editForm.value.isWizard = !!notesObj.isWizard
      editForm.value.magicLimit = notesObj.magicLimit !== undefined ? Number(notesObj.magicLimit) : 100
      editForm.value.magicAbilities = Array.isArray(notesObj.magicAbilities) ? notesObj.magicAbilities : []
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
    const { id, userId, ownerId, user, owner, createdAt, updatedAt, isWizard, magicLimit, magicAbilities, ...updateFields } = editForm.value

    // Pack magic variables inside structured notes
    const currentNotesObj = character.value.notes && typeof character.value.notes === 'object' ? { ...character.value.notes } : {}
    currentNotesObj.text = characterNotes.value
    currentNotesObj.isWizard = !!isWizard
    currentNotesObj.magicLimit = magicLimit !== undefined ? Number(magicLimit) : 100
    currentNotesObj.magicAbilities = Array.isArray(magicAbilities) ? magicAbilities : []

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

// Watch for edit mode changes
watch(editMode, (newValue) => {
  if (newValue && character.value) {
    editForm.value = { ...character.value }
    const notesObj = character.value.notes || {}
    editForm.value.isWizard = !!notesObj.isWizard
    editForm.value.magicLimit = notesObj.magicLimit !== undefined ? Number(notesObj.magicLimit) : 100
    editForm.value.magicAbilities = Array.isArray(notesObj.magicAbilities) ? JSON.parse(JSON.stringify(notesObj.magicAbilities)) : []

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