const fs = require('fs');

const filePath = '/home/nicolas/Documents/GitHub/dd/pages/characters/[id].vue';
let fileContent = fs.readFileSync(filePath, 'utf8');

// 1. Make Navigation Header Sticky
console.log('1. Making navigation header sticky...');
const navTarget = '<!-- Navigation -->\n    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">';
const navReplacement = '<!-- Navigation -->\n    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">';
if (fileContent.includes(navTarget)) {
  fileContent = fileContent.replace(navTarget, navReplacement);
}

// 2. Update Inventory Card template
console.log('2. Updating Inventory card...');
const inventoryTargetStart = '<UCard :class="{ \'hidden lg:block\': activeMobileTab !== \'inventory\' }">\n            <template #header>\n              <div class="flex items-center justify-between">\n                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">\n                  {{ t(\'inventory\') }}\n                </h3>\n                <UButton\n                  v-if="editMode && canEdit"\n                  color="primary"\n                  variant="soft"\n                  size="sm"\n                  icon="i-heroicons-plus"\n                  @click="addInventoryItem"\n                >\n                  {{ t(\'addItem\') }}\n                </UButton>\n              </div>\n            </template>\n\n             <div v-if="editMode ? (!editInventory || editInventory.length === 0) : (!character.inventory || character.inventory.length === 0)" class="text-center py-8 text-gray-500 dark:text-gray-400">\n               {{ t(\'noItems\') }}\n             </div>\n\n             <div v-else class="space-y-3">\n               <div\n                 v-for="(item, index) in editMode ? editInventory : character.inventory"\n                 :key="item.id || index"\n                 class="border border-gray-200 dark:border-gray-700 rounded-lg p-3"\n               >';

const inventoryReplacement = `<UCard :class="{ 'hidden lg:block': activeMobileTab !== 'inventory' }">
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
             <div v-if="!editMode && character.inventory && character.inventory.length > 0" class="flex flex-col sm:flex-row gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
               <div class="flex-1 flex items-center gap-2">
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
                   class="w-36"
                 />
               </div>
               <div class="flex items-center gap-2">
                 <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Ordenar:</span>
                 <USelect
                   v-model="inventorySortBy"
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
                 </div>`;

// Use simple index replacing for robustness since formatting varies
const invIdx = fileContent.indexOf('<!-- Inventory -->');
const invCardOpen = fileContent.indexOf('<UCard', invIdx);
const invDivOpen = fileContent.indexOf('<div', invCardOpen);
// Locate the header end
const invHeaderEnd = fileContent.indexOf('</template>', invCardOpen) + '</template>'.length;
// Find the closing UCard for inventory
const invCardClose = fileContent.indexOf('</UCard>', invCardOpen);
const invBodyOriginal = fileContent.substring(invHeaderEnd, invCardClose);

// Build new inventory body
const invBodyNew = `

             <!-- Filters & Sorting (Read-only mode) -->
             <div v-if="!editMode && character.inventory && character.inventory.length > 0" class="flex flex-col sm:flex-row gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
               <div class="flex-1 flex items-center gap-2">
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
                   class="w-36"
                 />
               </div>
               <div class="flex items-center gap-2">
                 <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Ordenar:</span>
                 <USelect
                   v-model="inventorySortBy"
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
                 </div>` + invBodyOriginal.substring(invBodyOriginal.indexOf('<div class="grid grid-cols-1 gap-3">'));

// Also replace the badge within inventory body
const oldInvBadge = `v-else-if="item.tier" class="self-start md:self-center mt-1 md:mt-5">\n                      <UBadge :color="getTierClasses(item.tier).badgeColor" size="xs" variant="soft">\n                        {{ t(item.tier || 'gris') }}\n                      </UBadge>\n                    </div>`;
const newInvBadge = `v-else-if="item.tier" class="self-start md:self-center mt-1 md:mt-5">
                      <UBadge :color="getTierClasses(item.tier).badgeColor" size="xs" variant="soft">
                        {{ getTierClasses(item.tier).name }}
                      </UBadge>
                    </div>`;

let finalInvBody = invBodyNew;
if (finalInvBody.includes('{{ t(item.tier || \'gris\') }}')) {
  finalInvBody = finalInvBody.replace('{{ t(item.tier || \'gris\') }}', '{{ getTierClasses(item.tier).name }}');
}

fileContent = fileContent.substring(0, invHeaderEnd) + finalInvBody + fileContent.substring(invCardClose);

// 3. Update Attacks Card template
console.log('3. Updating Attacks card...');
const atkIdx = fileContent.indexOf('<!-- Attacks Card -->');
const atkCardOpen = fileContent.indexOf('<UCard', atkIdx);
const atkHeaderEnd = fileContent.indexOf('</template>', atkCardOpen) + '</template>'.length;
const atkCardClose = fileContent.indexOf('</UCard>', atkCardOpen);
const atkBodyOriginal = fileContent.substring(atkHeaderEnd, atkCardClose);

const atkBodyNew = `

               <!-- Filters & Sorting (Read-only mode) -->
               <div v-if="!editMode && character.attacks && character.attacks.filter(a => a.type !== 'skill').length > 0" class="flex flex-col sm:flex-row gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
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
                     </div>` + atkBodyOriginal.substring(atkBodyOriginal.indexOf('<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">'));

let finalAtkBody = atkBodyNew;
if (finalAtkBody.includes('{{ t(attack.tier || \'gris\') }}')) {
  finalAtkBody = finalAtkBody.replace('{{ t(attack.tier || \'gris\') }}', '{{ getTierClasses(attack.tier).name }}');
}

fileContent = fileContent.substring(0, atkHeaderEnd) + finalAtkBody + fileContent.substring(atkCardClose);

// 4. Update Custom Skills Card template
console.log('4. Updating Custom Skills card...');
const skillIdx = fileContent.indexOf('<!-- Custom Skills Card -->');
const skillCardOpen = fileContent.indexOf('<UCard', skillIdx);
const skillHeaderEnd = fileContent.indexOf('</template>', skillCardOpen) + '</template>'.length;
const skillCardClose = fileContent.indexOf('</UCard>', skillCardOpen);
const skillBodyOriginal = fileContent.substring(skillHeaderEnd, skillCardClose);

const skillBodyNew = `

               <!-- Filters & Sorting (Read-only mode) -->
               <div v-if="!editMode && character.attacks && character.attacks.filter(a => a.type === 'skill').length > 0" class="flex flex-col sm:flex-row gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
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
                     </div>` + skillBodyOriginal.substring(skillBodyOriginal.indexOf('<div class="grid grid-cols-1 md:grid-cols-2 gap-4">'));

let finalSkillBody = skillBodyNew;
if (finalSkillBody.includes('{{ t(ability.tier || \'gris\') }}')) {
  finalSkillBody = finalSkillBody.replace('{{ t(ability.tier || \'gris\') }}', '{{ getTierClasses(ability.tier).name }}');
}

fileContent = fileContent.substring(0, skillHeaderEnd) + finalSkillBody + fileContent.substring(skillCardClose);

// 5. Make Inspiration editable
console.log('5. Making inspiration editable...');
const inspirationOld = `<div class="flex justify-between items-center">\n                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ t('inspiration') }}</span>\n                  <span class="font-medium text-gray-900 dark:text-white">\n                    {{ character.inspiration ? t('yes') : t('no') }}\n                  </span>\n                </div>`;

const inspirationNew = `<div class="flex justify-between items-center">
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
                </div>`;

if (fileContent.includes(inspirationOld)) {
  fileContent = fileContent.replace(inspirationOld, inspirationNew);
} else {
  // Let's try searching with slightly relaxed spacing/newlines
  const inspSearch = `{{ t('inspiration') }}`;
  const inspIdx = fileContent.indexOf(inspSearch);
  const containerStart = fileContent.lastIndexOf('<div class="flex justify-between items-center">', inspIdx);
  const containerEnd = fileContent.indexOf('</div>', inspIdx) + '</div>'.length;
  if (containerStart !== -1 && containerEnd !== -1) {
    const originalContainer = fileContent.substring(containerStart, containerEnd);
    fileContent = fileContent.replace(originalContainer, inspirationNew);
  }
}

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Successfully completed new features additions!');
