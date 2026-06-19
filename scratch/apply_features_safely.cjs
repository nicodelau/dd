const fs = require('fs');

const filePath = '/home/nicolas/Documents/GitHub/dd/pages/characters/[id].vue';
let fileContent = fs.readFileSync(filePath, 'utf8');

// 1. Helper function to replace card blocks
function replaceCardBlock(content, comment, newCardContent) {
  const startIndex = content.indexOf(comment);
  if (startIndex === -1) {
    throw new Error("Could not find comment: " + comment);
  }
  const cardStart = content.indexOf('<UCard', startIndex);
  if (cardStart === -1) {
    throw new Error("Could not find <UCard after comment: " + comment);
  }
  const cardEnd = content.indexOf('</UCard>', cardStart);
  if (cardEnd === -1) {
    throw new Error("Could not find </UCard> after comment: " + comment);
  }
  const fullEndIndex = cardEnd + '</UCard>'.length;
  return content.substring(0, cardStart) + newCardContent + content.substring(fullEndIndex);
}

// 2. Replace Script Setup State block
console.log('Replacing Script Setup reactive variables & computed properties...');
const stateStartMarker = '// Reactive state';
const stateEndMarker = 'const editCombatActions = ref<Array<{name: string, type: string, currentUses: number, maxUses: number, description?: string}>>([])';

const stateStartIndex = fileContent.indexOf(stateStartMarker);
const stateEndIndex = fileContent.indexOf(stateEndMarker);

if (stateStartIndex === -1 || stateEndIndex === -1) {
  console.error('Could not find state markers in script setup!');
  process.exit(1);
}

const newStateContent = `// Reactive state
const character = ref<CharacterDTO | null>(null)
const activeMobileTab = ref('general')
const editMode = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const imageLoadError = ref(false)
const hpAdjustment = ref<number | null>(null)

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
const editAttacks = ref<Array<{name: string, attackBonus?: number, damage?: string, rangeText?: string, notes?: string, type?: string, tier?: string}>>([])
const editInventory = ref<Array<{name: string, quantity: number, weight?: number, equipped: boolean, notes?: string, tier?: string}>>([])
const editCombatActions = ref<Array<{name: string, type: string, currentUses: number, maxUses: number, description?: string}>>([])

// Tier definitions and style maps
const tierOptions = [
  { value: 'gris', label: 'Gris' },
  { value: 'azul', label: 'Azul' },
  { value: 'verde', label: 'Verde' },
  { value: 'violeta', label: 'Violeta' },
  { value: 'naranja', label: 'Naranja' },
  { value: 'rojo', label: 'Rojo sangre' }
]

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
        name: t('tierMistico') || 'Épico',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.25)]'
      }
    case 'naranja':
      return {
        card: 'border-l-4 border-l-orange-500 bg-orange-50/5 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900/50',
        text: 'text-orange-600 dark:text-orange-400 font-bold',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        badgeColor: 'orange',
        name: t('tierLegendary') || 'Legendario',
        glow: 'shadow-[0_0_20px_rgba(249,115,22,0.35)]'
      }
    case 'rojo':
    case 'rojo sangre':
      return {
        card: 'border-l-4 border-l-red-650 bg-red-50/5 dark:bg-red-950/15 border-red-300 dark:border-red-900/50',
        text: 'text-red-600 dark:text-red-500 font-extrabold tracking-wide uppercase font-serif animate-pulse',
        badge: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border border-red-500/30',
        badgeColor: 'red',
        name: t('tierDivino') || 'Rojo sangre (Mítico)',
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
  let list = character.value.attacks.filter(a => a.type !== 'skill')
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
  let list = character.value.attacks.filter(a => a.type === 'skill')
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
})`;

fileContent = fileContent.substring(0, stateStartIndex) + newStateContent + fileContent.substring(stateEndIndex + stateEndMarker.length);

// 3. Replace Methods block
console.log('Replacing Methods block...');
const methodsStartMarker = '// Methods\nfunction addAttack()';
const methodsEndMarker = 'function removeInventoryItem(index: number) {\n  editInventory.value.splice(index, 1)\n}';

const methodsStartIndex = fileContent.indexOf(methodsStartMarker);
const methodsEndIndex = fileContent.indexOf(methodsEndMarker);

if (methodsStartIndex === -1 || methodsEndIndex === -1) {
  console.error('Could not find methods markers!');
  process.exit(1);
}

const newMethodsContent = `// Methods
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
}`;

fileContent = fileContent.substring(0, methodsStartIndex) + newMethodsContent + fileContent.substring(methodsEndIndex + methodsEndMarker.length);

// 4. Replace Inventory Card template
console.log('Replacing Inventory card template...');
const newInventoryCard = `<UCard :class="{ 'hidden lg:block': activeMobileTab !== 'inventory' }">
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
            <div v-if="!editMode && character.inventory && character.inventory.length > 0" class="flex flex-col sm:flex-row gap-2 mb-4 pb-4 border-b border-gray-150 dark:border-gray-800">
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
                </div>

                <div class="grid grid-cols-1 gap-3">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div class="md:col-span-2">
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
          </UCard>`;

fileContent = replaceCardBlock(fileContent, '<!-- Inventory -->', newInventoryCard);

// 5. Replace Attacks Card template
console.log('Replacing Attacks card template...');
const newAttacksCard = `<UCard :class="{ 'hidden lg:block': activeMobileTab !== 'combat' }">
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
                 </template>
               </div>
             </UCard>`;

fileContent = replaceCardBlock(fileContent, '<!-- Attacks Card -->', newAttacksCard);

// 6. Replace Custom Skills Card template
console.log('Replacing Custom Skills card template...');
const newSkillsCard = `<UCard class="mt-6" :class="{ 'hidden lg:block': activeMobileTab !== 'combat' }">
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
                 </template>
               </div>
             </UCard>`;

fileContent = replaceCardBlock(fileContent, '<!-- Custom Skills Card -->', newSkillsCard);

// 7. Make Inspiration editable
console.log('Making inspiration editable...');
const inspirationOld = '<div class="flex justify-between items-center">\\n                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ t(\'inspiration\') }}</span>\\n                  <span class="font-medium text-gray-900 dark:text-white">\\n                    {{ character.inspiration ? t(\'yes\') : t(\'no\') }}\\n                  </span>\\n                </div>';

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
  // Try slightly relaxed search
  const searchStr = "{{ t('inspiration') }}";
  const idx = fileContent.indexOf(searchStr);
  const startDiv = fileContent.lastIndexOf('<div class="flex justify-between items-center">', idx);
  const endDiv = fileContent.indexOf('</div>', idx) + '</div>'.length;
  if (startDiv !== -1 && endDiv !== -1) {
    const originalContainer = fileContent.substring(startDiv, endDiv);
    fileContent = fileContent.replace(originalContainer, inspirationNew);
  }
}

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Successfully applied all new features safely!');
