<template>
  <div>
    <!-- Player Invite Modal -->
    <UModal v-model="showInviteModal" :ui="{ width: 'max-w-md' }">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">
            📨 {{ t('invitePlayers') }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="closeInviteModal" />
        </div>

        <div v-if="isLoadingOnlineUsers" class="text-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-blue-500 mx-auto" />
          <p class="mt-2 text-zinc-400">{{ t('loadingUsers') }}...</p>
        </div>

        <div v-else-if="onlineUsers.length === 0" class="text-center py-8">
          <div class="text-4xl mb-4">😴</div>
          <p class="text-zinc-400">{{ t('noOnlineUsers') }}</p>
          <p class="text-xs text-zinc-500 mt-2">{{ t('usersMustBeOnline') }}</p>
        </div>

        <div v-else class="space-y-3 max-h-96 overflow-y-auto">
          <div v-for="onlineUser in onlineUsers" :key="onlineUser.id" 
            class="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div>
              <div class="font-medium text-white">{{ onlineUser.name }}</div>
              <div class="text-xs text-zinc-400">
                {{ onlineUser.role }} • {{ onlineUser.roomCode === 'default' ? 'Lobby' : 'In Game' }}
              </div>
            </div>
            <UButton 
              size="xs" 
              color="blue" 
              icon="i-heroicons-paper-airplane"
              @click="handleSendInvite(onlineUser)"
            >
              {{ t('send') }}
            </UButton>
          </div>
        </div>
      </div>
    </UModal>

    <!-- Room Creation Modal -->
    <UModal v-model="showCreateRoom" :ui="{ width: 'max-w-md' }">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">
            🏠 {{ t('createNewRoom') }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="closeCreateRoom" />
        </div>

        <div class="space-y-4">
          <div class="text-center py-4">
            <div class="text-6xl mb-4">🎲</div>
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              {{ t('createRoomDesc') }}
            </p>
            <p class="text-sm text-zinc-400">
              {{ t('createRoomNote') }}
            </p>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-8">
          <UButton color="gray" variant="outline" @click="closeCreateRoom">
            {{ t('cancel') }}
          </UButton>
          <UButton color="primary" @click="handleCreateRoom" icon="i-heroicons-plus">
            {{ t('createRoom') }}
          </UButton>
        </div>
      </div>
    </UModal>

    <!-- DM Roll Request Modal -->
    <UModal v-model="showRollRequestModal" :ui="{ width: 'max-w-md' }">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">
            🎲 {{ t('requestRollFrom') }} {{ selectedPlayerForRequest?.name }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="closeRollRequestModal" />
        </div>

        <div class="space-y-4">
          <!-- Dice Type Selection -->
          <div>
            <UFormGroup :label="t('selectDiceType')">
              <div class="grid grid-cols-2 gap-3">
                <UButton v-for="diceType in diceTypes" :key="diceType.type"
                  :color="requestedDiceType === diceType.type ? 'primary' : 'gray'"
                  :variant="requestedDiceType === diceType.type ? 'solid' : 'outline'"
                  class="flex flex-col items-center p-4 h-20" @click="requestedDiceType = diceType.type">
                  <img :src="`/assets/dices/${diceType.name}.svg`" :alt="diceType.name" class="w-8 h-8 mb-1" />
                  <div class="text-xs">{{ diceType.name }}</div>
                </UButton>
              </div>
            </UFormGroup>
          </div>

          <!-- Optional Message -->
          <div>
            <UFormGroup :label="t('optionalMessage')">
              <UTextarea v-model="rollRequestMessage" :placeholder="t('rollRequestPlaceholder')" rows="3" />
            </UFormGroup>
          </div>

          <!-- Modifier (optional) -->
          <div>
            <UFormGroup :label="t('modifierOptional')">
              <UInput v-model.number="rollRequestModifier" type="number" placeholder="0" />
            </UFormGroup>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-8">
          <UButton color="gray" variant="outline" @click="closeRollRequestModal">
            {{ t('cancel') }}
          </UButton>
          <UButton color="primary" @click="handleSendRollRequest" :disabled="!requestedDiceType"
            icon="i-heroicons-paper-airplane">
            {{ t('sendRequest') }}
          </UButton>
        </div>
      </div>
    </UModal>

    <!-- DM Player Stats Editing Modal -->
    <UModal v-model="isEditingPlayer" :ui="{ width: 'max-w-2xl' }">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">
            {{ t('editStatsFor') }} {{ editingPlayer?.name }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="closeEditModal" />
        </div>

        <div v-if="editingPlayerStats" class="space-y-6">
          <!-- Hit Points -->
          <div>
            <h4 class="text-sm font-medium text-white mb-3">{{ t('health') }}</h4>
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup :label="t('currentHp')">
                <UInput v-model.number="editingPlayerStats.hitPoints.current" type="number" min="0"
                  :max="editingPlayerStats.hitPoints.max" />
              </UFormGroup>
              <UFormGroup :label="t('maxHp')">
                <UInput v-model.number="editingPlayerStats.hitPoints.max" type="number" min="1" />
              </UFormGroup>
            </div>
          </div>

          <!-- Core Stats -->
          <div>
            <h4 class="text-sm font-medium text-white mb-3">{{ t('coreStats') }}</h4>
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup :label="t('armorClass')">
                <UInput v-model.number="editingPlayerStats.armorClass" type="number" min="1" />
              </UFormGroup>
              <UFormGroup :label="t('level')">
                <UInput v-model.number="editingPlayerStats.level" type="number" min="1" max="20" />
              </UFormGroup>
              <UFormGroup :label="t('proficiencyBonus')">
                <UInput v-model.number="editingPlayerStats.proficiencyBonus" type="number" min="1" />
              </UFormGroup>
              <UFormGroup :label="t('speed')">
                <UInput v-model.number="editingPlayerStats.speed" type="number" min="0" />
              </UFormGroup>
            </div>
          </div>

          <!-- Abilities -->
          <div>
            <h4 class="text-sm font-medium text-white mb-3">{{ t('abilityScores') }}</h4>
            <div class="grid grid-cols-3 gap-4">
              <UFormGroup :label="`${t('strength')} (${t('str')})`">
                <UInput v-model.number="editingPlayerStats.abilities.strength" type="number" min="1" max="30" />
              </UFormGroup>
              <UFormGroup :label="`${t('dexterity')} (${t('dex')})`">
                <UInput v-model.number="editingPlayerStats.abilities.dexterity" type="number" min="1" max="30" />
              </UFormGroup>
              <UFormGroup :label="`${t('constitution')} (${t('con')})`">
                <UInput v-model.number="editingPlayerStats.abilities.constitution" type="number" min="1" max="30" />
              </UFormGroup>
              <UFormGroup :label="`${t('intelligence')} (${t('int')})`">
                <UInput v-model.number="editingPlayerStats.abilities.intelligence" type="number" min="1" max="30" />
              </UFormGroup>
              <UFormGroup :label="`${t('wisdom')} (${t('wis')})`">
                <UInput v-model.number="editingPlayerStats.abilities.wisdom" type="number" min="1" max="30" />
              </UFormGroup>
              <UFormGroup :label="`${t('charisma')} (${t('cha')})`">
                <UInput v-model.number="editingPlayerStats.abilities.charisma" type="number" min="1" max="30" />
              </UFormGroup>
            </div>
          </div>

          <!-- Initiative -->
          <div>
            <UFormGroup :label="t('initiativeModifier')">
              <UInput v-model.number="editingPlayerStats.initiative" type="number" />
            </UFormGroup>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-8">
          <UButton color="gray" variant="outline" @click="closeEditModal">
            {{ t('cancel') }}
          </UButton>
          <UButton color="primary" @click="handleSavePlayerStats" :disabled="!editingPlayerStats">
            {{ t('saveChanges') }}
          </UButton>
        </div>
      </div>
    </UModal>

    <!-- Player Roll Request Notification Modal -->
    <UModal v-model="showRollRequestNotification" :ui="{ width: 'max-w-md' }" :prevent-close="true">
      <div class="p-6">
        <div class="text-center">
          <div class="text-6xl mb-4">🎲</div>
          <h3 class="text-lg font-semibold text-white mb-2">
            {{ t('rollRequestFromDm') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            {{ t('dmRequestingRoll') }} <strong>{{ pendingRollRequest?.diceType }}</strong>
          </p>

          <div v-if="pendingRollRequest?.message" class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
            <p class="text-sm text-blue-900 dark:text-blue-100">
              "{{ pendingRollRequest.message }}"
            </p>
          </div>

          <div v-if="pendingRollRequest?.modifier && pendingRollRequest.modifier !== 0"
            class="text-sm text-zinc-400 mb-4">
            {{ t('modifier') }}: {{ pendingRollRequest.modifier > 0 ? '+' : '' }}{{ pendingRollRequest.modifier }}
          </div>

          <div class="flex justify-center space-x-3">
            <UButton color="gray" variant="outline" @click="handleDeclineRollRequest">
              {{ t('decline') }}
            </UButton>
            <UButton color="primary" @click="handleAcceptRollRequest" icon="i-heroicons-cube">
              {{ t('roll') }} {{ pendingRollRequest?.diceType }}
            </UButton>
          </div>
        </div>
      </div>
    </UModal>

    <!-- Add Enemy Modal -->
    <UModal v-model="showAddEnemyModal" :ui="{ width: 'max-w-md' }">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-white mb-4">
          👹 {{ t('addEnemy') }}
        </h3>

        <div class="space-y-4">
          <UFormGroup :label="t('enemyName')" required>
            <UInput v-model="newEnemy.name" :placeholder="t('enemyNamePlaceholder')" />
          </UFormGroup>

          <UFormGroup :label="t('hitPoints')" required>
            <UInput v-model.number="newEnemy.hitPoints" type="number" min="1" placeholder="10" />
          </UFormGroup>

          <UFormGroup :label="t('armorClass')">
            <UInput v-model.number="newEnemy.armorClass" type="number" min="1" placeholder="10" />
          </UFormGroup>

          <UFormGroup :label="t('initiativeModifier')">
            <UInput v-model.number="newEnemy.initiative" type="number" placeholder="0" />
          </UFormGroup>

          <div class="flex justify-end space-x-3 mt-6">
            <UButton color="gray" variant="outline" @click="closeAddEnemyModal">
              {{ t('cancel') }}
            </UButton>
            <UButton color="green" @click="handleAddEnemy" :disabled="!newEnemy.name || !newEnemy.hitPoints">
              {{ t('addEnemy') }}
            </UButton>
          </div>
        </div>
      </div>
    </UModal>

    <!-- Special Abilities Modal -->
    <SpecialAbilitiesModal v-model="showSpecialAbilitiesModal" :character-name="currentPlayerName"
      :special-abilities="currentPlayerAbilities" @roll-ability="handleRollAbility" @use-ability="handleUseAbility" />

    <!-- Character Detail Modal (for DM) -->
    <CharacterDetailModal v-model="showCharacterDetailModal" :character="selectedCharacterForDetail" :ui="{
      width: 'w-full',
      height: 'h-auto'
    }" class="modal-custom-size" />

    <!-- DM Show Image Modal -->
    <UModal v-model="showDmImageModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">{{ t('showImageToPlayers') }}</h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="closeDmImageModal" />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup :label="t('uploadImage')" :help="t('selectImageHelp')">
            <input type="file" accept="image/*" @change="handleImageUpload" class="block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-purple-50 file:text-purple-700
              hover:file:bg-purple-100
              dark:file:bg-purple-900/20 dark:file:text-purple-300
            "/>
          </UFormGroup>

          <div class="relative">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
              <div class="w-full border-t border-gray-700"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="bg-zinc-900 px-2 text-sm text-gray-500">{{ t('or') }}</span>
            </div>
          </div>

          <UFormGroup :label="t('imageUrl')">
            <UInput v-model="dmImageUrl" :placeholder="t('imageUrlPlaceholder')" />
          </UFormGroup>

          <UFormGroup :label="t('captionOptional')">
            <UInput v-model="dmImageCaption" :placeholder="t('imageCaptionPlaceholder')" />
          </UFormGroup>

          <div v-if="dmImageUrl" class="mt-4">
            <p class="text-sm text-gray-400 mb-2">{{ t('preview') }}:</p>
            <img :src="dmImageUrl" class="w-full h-48 object-contain rounded bg-black/50" />
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton color="gray" variant="ghost" @click="closeDmImageModal">{{ t('cancel') }}</UButton>
            <UButton color="purple" :loading="isSendingImage" @click="handleSendDmImage">{{ t('showToPlayers') }}</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Player Image Display Modal -->
    <UModal v-model="showImageDisplayModal" :ui="{ width: 'max-w-4xl' }">
      <div class="relative bg-black rounded-lg overflow-hidden">
        <img :src="displayedImageUrl" class="w-full h-auto max-h-[80vh] object-contain" />
        
        <div v-if="displayedImageCaption" class="absolute bottom-0 left-0 right-0 bg-black/70 p-4 text-center">
          <p class="text-white text-lg font-medium">{{ displayedImageCaption }}</p>
        </div>

        <UButton color="white" variant="ghost" icon="i-heroicons-x-mark" 
          class="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full"
          @click="closeImageDisplayModal" />
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { DiceType } from '~/types/dice-constants'

interface Player {
  userId: string
  name: string
  role: string
  stats: any
}

interface OnlineUser {
  id: string
  name: string
  role: string
  roomCode: string
}

interface PendingRollRequest {
  diceType: string
  message?: string
  modifier?: number
}

interface NewEnemy {
  name: string
  hitPoints: number
  armorClass: number
  initiative: number
}

interface Props {
  // Modal visibility states
  showInviteModal: boolean
  showCreateRoom: boolean
  showRollRequestModal: boolean
  isEditingPlayer: boolean
  showRollRequestNotification: boolean
  showAddEnemyModal: boolean
  showSpecialAbilitiesModal: boolean
  showCharacterDetailModal: boolean
  showDmImageModal: boolean
  showImageDisplayModal: boolean
  
  // Modal data
  isLoadingOnlineUsers: boolean
  onlineUsers: OnlineUser[]
  selectedPlayerForRequest: Player | null
  diceTypes: DiceType[]
  requestedDiceType: string
  rollRequestMessage: string
  rollRequestModifier: number
  editingPlayer: Player | null
  editingPlayerStats: any
  pendingRollRequest: PendingRollRequest | null
  newEnemy: NewEnemy
  currentPlayerName: string
  currentPlayerAbilities: any[]
  selectedCharacterForDetail: any
  dmImageUrl: string
  dmImageCaption: string
  isSendingImage: boolean
  displayedImageUrl: string
  displayedImageCaption: string
}

interface Emits {
  // Modal visibility controls
  (e: 'update:showInviteModal', value: boolean): void
  (e: 'update:showCreateRoom', value: boolean): void
  (e: 'update:showRollRequestModal', value: boolean): void
  (e: 'update:isEditingPlayer', value: boolean): void
  (e: 'update:showRollRequestNotification', value: boolean): void
  (e: 'update:showAddEnemyModal', value: boolean): void
  (e: 'update:showSpecialAbilitiesModal', value: boolean): void
  (e: 'update:showCharacterDetailModal', value: boolean): void
  (e: 'update:showDmImageModal', value: boolean): void
  (e: 'update:showImageDisplayModal', value: boolean): void
  
  // Modal data updates
  (e: 'update:requestedDiceType', value: string): void
  (e: 'update:rollRequestMessage', value: string): void
  (e: 'update:rollRequestModifier', value: number): void
  (e: 'update:editingPlayerStats', value: any): void
  (e: 'update:newEnemy', value: NewEnemy): void
  (e: 'update:dmImageUrl', value: string): void
  (e: 'update:dmImageCaption', value: string): void
  
  // Actions
  (e: 'sendInvite', user: OnlineUser): void
  (e: 'createRoom'): void
  (e: 'sendRollRequest'): void
  (e: 'savePlayerStats'): void
  (e: 'acceptRollRequest'): void
  (e: 'declineRollRequest'): void
  (e: 'addEnemy'): void
  (e: 'rollAbility', ability: any): void
  (e: 'useAbility', ability: any): void
  (e: 'imageUpload', event: Event): void
  (e: 'sendDmImage'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Translations
const { t } = useTranslations()

// Computed properties for v-model sync
const showInviteModal = computed({
  get: () => props.showInviteModal,
  set: (value) => emit('update:showInviteModal', value)
})

const showCreateRoom = computed({
  get: () => props.showCreateRoom,
  set: (value) => emit('update:showCreateRoom', value)
})

const showRollRequestModal = computed({
  get: () => props.showRollRequestModal,
  set: (value) => emit('update:showRollRequestModal', value)
})

const isEditingPlayer = computed({
  get: () => props.isEditingPlayer,
  set: (value) => emit('update:isEditingPlayer', value)
})

const showRollRequestNotification = computed({
  get: () => props.showRollRequestNotification,
  set: (value) => emit('update:showRollRequestNotification', value)
})

const showAddEnemyModal = computed({
  get: () => props.showAddEnemyModal,
  set: (value) => emit('update:showAddEnemyModal', value)
})

const showSpecialAbilitiesModal = computed({
  get: () => props.showSpecialAbilitiesModal,
  set: (value) => emit('update:showSpecialAbilitiesModal', value)
})

const showCharacterDetailModal = computed({
  get: () => props.showCharacterDetailModal,
  set: (value) => emit('update:showCharacterDetailModal', value)
})

const showDmImageModal = computed({
  get: () => props.showDmImageModal,
  set: (value) => emit('update:showDmImageModal', value)
})

const showImageDisplayModal = computed({
  get: () => props.showImageDisplayModal,
  set: (value) => emit('update:showImageDisplayModal', value)
})

const requestedDiceType = computed({
  get: () => props.requestedDiceType,
  set: (value) => emit('update:requestedDiceType', value)
})

const rollRequestMessage = computed({
  get: () => props.rollRequestMessage,
  set: (value) => emit('update:rollRequestMessage', value)
})

const rollRequestModifier = computed({
  get: () => props.rollRequestModifier,
  set: (value) => emit('update:rollRequestModifier', value)
})

const editingPlayerStats = computed({
  get: () => props.editingPlayerStats,
  set: (value) => emit('update:editingPlayerStats', value)
})

const newEnemy = computed({
  get: () => props.newEnemy,
  set: (value) => emit('update:newEnemy', value)
})

const dmImageUrl = computed({
  get: () => props.dmImageUrl,
  set: (value) => emit('update:dmImageUrl', value)
})

const dmImageCaption = computed({
  get: () => props.dmImageCaption,
  set: (value) => emit('update:dmImageCaption', value)
})

// Event handlers
function closeInviteModal() {
  showInviteModal.value = false
}

function closeCreateRoom() {
  showCreateRoom.value = false
}

function closeRollRequestModal() {
  showRollRequestModal.value = false
}

function closeEditModal() {
  isEditingPlayer.value = false
}

function closeAddEnemyModal() {
  showAddEnemyModal.value = false
}

function closeDmImageModal() {
  showDmImageModal.value = false
}

function closeImageDisplayModal() {
  showImageDisplayModal.value = false
}

function handleSendInvite(user: OnlineUser) {
  emit('sendInvite', user)
}

function handleCreateRoom() {
  emit('createRoom')
}

function handleSendRollRequest() {
  emit('sendRollRequest')
}

function handleSavePlayerStats() {
  emit('savePlayerStats')
}

function handleAcceptRollRequest() {
  emit('acceptRollRequest')
}

function handleDeclineRollRequest() {
  emit('declineRollRequest')
}

function handleAddEnemy() {
  emit('addEnemy')
}

function handleRollAbility(ability: any) {
  emit('rollAbility', ability)
}

function handleUseAbility(ability: any) {
  emit('useAbility', ability)
}

function handleImageUpload(event: Event) {
  emit('imageUpload', event)
}

function handleSendDmImage() {
  emit('sendDmImage')
}
</script>