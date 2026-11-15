<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
    <!-- Header -->
    <DiceRoomHeader
      :room-info="currentRoom"
      :is-connected="isConnected"
      :is-offline-mode="isOfflineMode"
      :is-offline-mode-preference="isOfflineModePreference"
      :connected-users="connectedUsers"
      :language="language"
      :user="user"
      @copy-room-code="copyRoomCode"
      @toggle-language="toggleLanguage"
      @toggle-offline-mode="toggleOfflineMode"
    />

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
      <!-- Status Banners -->
      <ConnectionBanners
        :is-offline-mode="isOfflineMode"
        :is-in-room="isInRoom"
        :is-connected="isConnected"
        :is-auto-joining="isAutoJoining"
        :current-room-code="currentRoom?.code"
        :joining-room-code="joiningRoomCode"
        :reconnect-attempts="reconnectAttempts"
      />

      <!-- LOBBY VIEW: If user is not yet in an active room -->
      <div v-if="!isInRoom" class="max-w-xl w-full mx-auto my-auto py-8">
        <div class="bg-zinc-900/80 border border-zinc-800 rounded-lg p-6 space-y-6">
          <div class="border-b border-zinc-800 pb-4">
            <h2 class="text-lg font-bold text-zinc-50 flex items-center gap-2">
              <UIcon name="i-heroicons-user-circle" class="w-5 h-5 text-rose-500" />
              {{ t('playerSetup') }}
            </h2>
            <p class="text-xs text-zinc-400 mt-1">
              Configurá tu identidad para participar en la mesa táctica.
            </p>
          </div>

          <!-- Name & Role -->
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-zinc-300 mb-1">
                {{ t('yourName') }}
              </label>
              <UInput 
                v-model="inputUserName" 
                :placeholder="t('enterYourName')"
                size="md"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-zinc-300 mb-2">
                {{ t('selectRole') }}
              </label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  class="flex items-center justify-center gap-2 p-3 rounded-md border text-xs font-semibold transition-colors"
                  :class="userRole === 'Player' ? 'bg-zinc-800 border-zinc-600 text-zinc-50' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'"
                  @click="userRole = 'Player'"
                >
                  <UIcon name="i-heroicons-user" class="w-4 h-4 text-sky-400" />
                  {{ t('player') }}
                </button>
                <button
                  type="button"
                  class="flex items-center justify-center gap-2 p-3 rounded-md border text-xs font-semibold transition-colors"
                  :class="userRole === 'DM' ? 'bg-zinc-800 border-zinc-600 text-zinc-50' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'"
                  @click="userRole = 'DM'"
                >
                  <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-rose-500" />
                  {{ t('dungeonMaster') }}
                </button>
              </div>
            </div>

            <!-- Active character selection for players -->
            <div v-if="userRole === 'Player' && userCharacters.length > 0">
              <label class="block text-xs font-medium text-zinc-300 mb-1">
                {{ t('selectCharacter') || 'Personaje Asignado' }}
              </label>
              <USelect
                v-model="activeCharacterId"
                :options="characterOptions"
                size="sm"
              />
            </div>
          </div>

          <!-- Room Actions: Create or Join -->
          <div class="pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Create Room -->
            <div class="space-y-2">
              <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Nueva Sala
              </span>
              <UButton
                color="rose"
                variant="solid"
                block
                size="md"
                class="font-semibold"
                @click="handleCreateRoom"
                icon="i-heroicons-plus"
              >
                {{ t('createRoom') }}
              </UButton>
            </div>

            <!-- Join Room -->
            <div class="space-y-2">
              <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Unirse a Sala
              </span>
              <div class="flex gap-2">
                <UInput
                  v-model="joinRoomCode"
                  placeholder="CÓDIGO"
                  class="font-mono uppercase flex-1"
                  size="md"
                  maxlength="8"
                  @keyup.enter="handleJoinRoom"
                />
                <UButton
                  color="gray"
                  variant="solid"
                  size="md"
                  @click="handleJoinRoom"
                  icon="i-heroicons-arrow-right"
                >
                  {{ t('join') }}
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ACTIVE ROOM VIEW -->
      <div v-else class="space-y-4">
        <!-- Room Toolbar -->
        <DiceRoomToolbar
          :is-left-sidebar-open="isLeftSidebarOpen"
          :is-right-sidebar-open="isRightSidebarOpen"
          :is-battle-open="showBattleUI || isInBattle"
          :user-role="userRole"
          :current-room="currentRoom"
          @toggle-left-sidebar="isLeftSidebarOpen = !isLeftSidebarOpen"
          @toggle-right-sidebar="isRightSidebarOpen = !isRightSidebarOpen"
          @toggle-battle="showBattleUI = !showBattleUI"
          @show-dm-image="showDmImageModal = true"
          @toggle-music-panel="showMusicPanel = true"
          @open-invite="showInviteModal = true"
          @leave-room="leaveRoom"
        />

        <!-- Combat / Battle Tracker -->
        <div v-if="showBattleUI || isInBattle || battleState.isActive || battleState.phase !== 'ended'">
          <BattlePanel 
            v-if="userRole === 'DM'" 
            :user-role="userRole"
            :current-room="currentRoom"
            :battle-mode="battleMode"
            :is-in-battle="isInBattle"
            :is-battle-loading="isBattleLoading"
            :selected-players="selectedPlayers"
            :unselected-players="unselectedPlayers"
            :is-battle-players-loading="isBattlePlayersLoading"
            :participants-with-initiative="participantsWithInitiative"
            :total-participants="totalParticipants"
            :all-initiative-rolled="allParticipantsRolled"
            :is-rolling-individual-initiative="isRollingIndividualInitiative"
            @start-battle="startBattle"
            @end-battle="endBattle"
            @load-battle-players="loadBattlePlayers"
            @add-player-to-battle="addPlayerToBattle"
            @remove-player-from-battle="removePlayerFromBattle"
            @show-add-enemy-modal="showAddEnemyModal = true"
            @remove-enemy="removeEnemy"
            @roll-initiative="rollInitiative"
            @roll-individual-initiative="rollIndividualInitiative"
            @start-combat-phase="startCombatPhase"
            @damage-participant="damageParticipant"
            @heal-participant="healParticipant"
            @next-turn="nextTurn"
            @previous-turn="previousTurn"
            @next-round="nextRound"
          />
          <PlayerBattleView 
            v-else 
            :battle-state="battleState"
            :current-user="user"
          />
        </div>

        <!-- Main Workspace: Dice Roller & Roll Feed -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left: Dice Roller -->
          <div class="lg:col-span-7 space-y-4">
            <DiceRoller
              :dice-types="diceTypes"
              :selected-dice="selectedDice"
              :total-dice-selected="totalDiceSelected"
              :quick-rolls="currentQuickRolls"
              :modifier="rollModifier"
              :roll-type="rollType"
              :roll-type-options="rollTypeOptions"
              :roll-reason="rollReason"
              :is-rolling="isRolling"
              @roll-single-dice="handleRollSingle"
              @decrement-dice="decrementDice"
              @increment-dice="incrementDice"
              @quick-roll="handleQuickRoll"
              @update-modifier="rollModifier = $event"
              @update-roll-type="rollType = $event"
              @update-roll-reason="rollReason = $event"
              @roll-dice="handleExecuteRoll"
              @clear-selection="clearSelectedDice"
            />
          </div>

          <!-- Right: Roll History Feed -->
          <div class="lg:col-span-5 bg-zinc-950/80 rounded-md border border-zinc-800 p-4">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <h3 class="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <UIcon name="i-heroicons-clock" class="w-4 h-4 text-zinc-400" />
                {{ t('history') }}
              </h3>
              <UButton 
                v-if="userRole === 'DM' && rollHistory.length > 0"
                color="gray"
                variant="ghost"
                size="2xs"
                icon="i-heroicons-trash"
                @click="clearHistory"
              >
                {{ t('clear') }}
              </UButton>
            </div>

            <DiceRollHistory :roll-history="rollHistory" />
          </div>
        </div>
      </div>
    </main>

    <!-- Slide-over Drawers / Sidebars -->
    <LeftSidebar
      :is-open="isLeftSidebarOpen"
      :user-role="userRole"
      :active-character="activeCharacter"
      :user-characters="userCharacters"
      :is-offline-mode="isOfflineMode"
      :is-refreshing-user-data="isRefreshingUserData"
      :player-stats="playerStats"
      :all-players-stats="allPlayersStats"
      :can-edit-stats="userRole === 'DM'"
      @close="isLeftSidebarOpen = false"
      @select-character="selectCharacter"
      @refresh-user-data="refreshUserData"
      @reset-stats="resetStats"
    />

    <RightSidebar
      :is-open="isRightSidebarOpen"
      :user-role="userRole"
      :player-stats="playerStats"
      :active-character="activeCharacter"
      :all-players-stats="allPlayersStats"
      :can-edit-stats="userRole === 'DM'"
      @close="isRightSidebarOpen = false"
      @roll-stat="handleRollStat"
      @roll-skill="handleRollSkill"
      @roll-save="handleRollSave"
      @roll-attack="handleRollAttack"
    />

    <!-- Music Panel Drawer -->
    <MusicPanel
      v-if="currentRoom?.code"
      v-model="showMusicPanel"
      :room-code="currentRoom.code"
      :is-d-m="userRole === 'DM'"
    />

    <!-- Room Modals Container -->
    <DiceRoomModals
      v-model:show-invite-modal="showInviteModal"
      v-model:show-dm-image-modal="showDmImageModal"
      v-model:show-add-enemy-modal="showAddEnemyModal"
      v-model:show-roll-request-modal="showRollRequestModal"
      v-model:show-image-display-modal="showImageDisplayModal"
      :current-room="currentRoom"
      :displayed-image-url="displayedImageUrl"
      :displayed-image-caption="displayedImageCaption"
      @copy-room-code="copyRoomCode"
      @add-enemy="handleAddEnemy"
      @send-dm-image="handleSendDmImage"
    />
  </div>
</template>

<script setup lang="ts">
import type { DiceType, QuickRoll } from '~/types/dice'
import { useDiceRoom } from '~/composables/useDiceRoom'
import { useSocketIO } from '~/composables/useSocketIO'
import { useBattle } from '~/composables/useBattle'
import { useCharacter } from '~/composables/useCharacter'
import { useQuickRolls } from '~/composables/useQuickRolls'
import { useTranslations } from '~/composables/useTranslations'

// Components
import DiceRoomHeader from '~/components/dice/DiceRoomHeader.vue'
import ConnectionBanners from '~/components/dice/ConnectionBanners.vue'
import DiceRoomToolbar from '~/components/dice/DiceRoomToolbar.vue'
import DiceRoller from '~/components/dice/DiceRoller.vue'
import DiceRollHistory from '~/components/dice/DiceRollHistory.vue'
import BattlePanel from '~/components/dice/BattlePanel.vue'
import PlayerBattleView from '~/components/dice/PlayerBattleView.vue'
import LeftSidebar from '~/components/dice/LeftSidebar.vue'
import RightSidebar from '~/components/dice/RightSidebar.vue'
import MusicPanel from '~/components/dice/MusicPanel.vue'
import DiceRoomModals from '~/components/dice/DiceRoomModals.vue'

interface Props {
  roomCode?: string
  autoJoin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  roomCode: '',
  autoJoin: false
})

const { t, currentLanguage: language, toggleLanguage } = useTranslations()
const user = useState<any>('user')
const route = useRoute()
const toast = useToast()

// Core Dice Room Composable
const {
  currentRoom,
  isInRoom,
  isAutoJoining,
  joinRoomCode,
  userRole,
  userName,
  userId,
  isConnected,
  isOfflineMode,
  isOfflineModePreference,
  connectedUsers,
  rollHistory,
  createRoom,
  joinExistingRoom,
  connectToRoom,
  leaveRoom,
  rollDice,
  clearHistory,
  toggleOfflineMode,
  initializeFromRoute
} = useDiceRoom()

// Socket.IO
const socketIO = useSocketIO()

// Battle system
const {
  battleMode,
  isInBattle,
  isBattleLoading,
  showBattleUI,
  newEnemy,
  selectedPlayers,
  unselectedPlayers,
  isBattlePlayersLoading,
  participantsWithInitiative,
  totalParticipants,
  allParticipantsRolled,
  isRollingIndividualInitiative,
  startBattle,
  endBattle,
  addEnemy,
  removeEnemy,
  rollInitiative,
  rollIndividualInitiative,
  startCombatPhase,
  nextTurn,
  previousTurn,
  nextRound,
  damageParticipant,
  healParticipant,
  loadBattlePlayers,
  addPlayerToBattle,
  removePlayerFromBattle
} = useBattle(computed(() => currentRoom.value?.code || 'default'), socketIO)

const battleState = computed(() => battleMode.value || {
  isActive: false,
  round: 1,
  currentTurnIndex: 0,
  phase: 'ended',
  initiativeOrder: [],
  participants: [],
  enemies: {},
  selectedPlayerIds: new Set<string>()
})

// Character management
const {
  userCharacters,
  activeCharacter,
  loadUserCharacters
} = useCharacter()

const activeCharacterId = ref<string>('')
const isRefreshingUserData = ref(false)
const playerStats = ref<any>(null)
const allPlayersStats = ref<any[]>([])

// Quick rolls
const { getQuickRollsFlat } = useQuickRolls()
const currentQuickRolls = computed<QuickRoll[]>(() => {
  return getQuickRollsFlat(activeCharacter.value)
})

// Input states for Lobby
const inputUserName = ref(userName.value || '')
const joiningRoomCode = ref(props.roomCode || (route.params.roomCode as string) || '')

// Modals and Sidebars
const isLeftSidebarOpen = ref(false)
const isRightSidebarOpen = ref(false)
const showMusicPanel = ref(false)
const showInviteModal = ref(false)
const showDmImageModal = ref(false)
const showAddEnemyModal = ref(false)
const showRollRequestModal = ref(false)
const showImageDisplayModal = ref(false)
const displayedImageUrl = ref('')
const displayedImageCaption = ref('')
const reconnectAttempts = ref(0)

// Dice Roller State
const selectedDice = ref<Record<string, number>>({
  d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0
})
const rollModifier = ref(0)
const rollType = ref('normal')
const rollReason = ref('')
const isRolling = ref(false)

const rollTypeOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Ventaja (Advantage)', value: 'advantage' },
  { label: 'Desventaja (Disadvantage)', value: 'disadvantage' }
]

const diceTypes: DiceType[] = [
  { type: 'd4', name: 'D4', sides: 4, color: 'text-blue-500', bgColor: 'bg-zinc-900', symbol: '◆' },
  { type: 'd6', name: 'D6', sides: 6, color: 'text-emerald-500', bgColor: 'bg-zinc-900', symbol: '⬛' },
  { type: 'd8', name: 'D8', sides: 8, color: 'text-purple-500', bgColor: 'bg-zinc-900', symbol: '♦' },
  { type: 'd10', name: 'D10', sides: 10, color: 'text-pink-500', bgColor: 'bg-zinc-900', symbol: '🔟' },
  { type: 'd12', name: 'D12', sides: 12, color: 'text-rose-500', bgColor: 'bg-zinc-900', symbol: '◇' },
  { type: 'd20', name: 'D20', sides: 20, color: 'text-amber-500', bgColor: 'bg-zinc-900', symbol: '●' },
  { type: 'd100', name: 'D100', sides: 100, color: 'text-emerald-400', bgColor: 'bg-zinc-900', symbol: '💯' }
]

const totalDiceSelected = computed(() => {
  return Object.values(selectedDice.value).reduce((sum, count) => sum + count, 0)
})

const characterOptions = computed(() => {
  return userCharacters.value.map(c => ({
    label: `${c.characterName} (${c.className || 'Clase'} ${c.classLevel || 1})`,
    value: c.id
  }))
})

// Dice helper methods
function incrementDice(type: string) {
  selectedDice.value[type] = (selectedDice.value[type] || 0) + 1
}

function decrementDice(type: string) {
  if (selectedDice.value[type] > 0) {
    selectedDice.value[type]--
  }
}

function clearSelectedDice() {
  for (const key of Object.keys(selectedDice.value)) {
    selectedDice.value[key] = 0
  }
  rollModifier.value = 0
  rollReason.value = ''
}

function handleRollSingle(type: string) {
  clearSelectedDice()
  selectedDice.value[type] = 1
  handleExecuteRoll()
}

function handleQuickRoll(roll: QuickRoll) {
  clearSelectedDice()
  for (const [diceType, count] of Object.entries(roll.dice)) {
    selectedDice.value[diceType] = count
  }
  rollModifier.value = roll.modifier || 0
  rollReason.value = roll.label
  handleExecuteRoll()
}

async function handleExecuteRoll() {
  if (totalDiceSelected.value === 0 || isRolling.value) return

  isRolling.value = true

  try {
    const diceRolled: { type: string; count: number; results: number[] }[] = []
    const diceResults: { type: string; result: number }[] = []
    let sum = 0

    for (const [type, count] of Object.entries(selectedDice.value)) {
      if (count > 0) {
        const sides = diceTypes.find(d => d.type === type)?.sides || 20
        const results: number[] = []

        for (let i = 0; i < count; i++) {
          let roll = Math.floor(Math.random() * sides) + 1

          // Advantage / Disadvantage handling for d20
          if (type === 'd20' && (rollType.value === 'advantage' || rollType.value === 'disadvantage')) {
            const secondRoll = Math.floor(Math.random() * sides) + 1
            if (rollType.value === 'advantage') {
              roll = Math.max(roll, secondRoll)
            } else {
              roll = Math.min(roll, secondRoll)
            }
          }

          results.push(roll)
          diceResults.push({ type, result: roll })
          sum += roll
        }

        diceRolled.push({ type, count, results })
      }
    }

    const total = sum + (rollModifier.value || 0)
    const isD20Only = totalDiceSelected.value === 1 && selectedDice.value.d20 === 1
    const d20Result = isD20Only ? diceResults[0].result : null

    await rollDice({
      diceRolled,
      diceResults,
      total,
      modifier: rollModifier.value || 0,
      rollType: rollType.value,
      description: rollReason.value || 'Tirada de dados',
      details: [`${sum} ${rollModifier.value ? (rollModifier.value > 0 ? `+ ${rollModifier.value}` : `- ${Math.abs(rollModifier.value)}`) : ''}`],
      isCritical: d20Result === 20 || d20Result === 1,
      criticalType: d20Result === 20 ? 'success' : (d20Result === 1 ? 'failure' : undefined)
    })

    // Reset selection after rolling
    clearSelectedDice()
  } catch (err: any) {
    console.error('Error executing roll:', err)
  } finally {
    isRolling.value = false
  }
}

// Sidebars & character handlers
function selectCharacter(char: any) {
  activeCharacterId.value = char.id
}

async function refreshUserData() {
  isRefreshingUserData.value = true
  await loadUserCharacters()
  isRefreshingUserData.value = false
}

function resetStats() {
  playerStats.value = null
}

function handleRollStat(statName: string, modifier: number) {
  clearSelectedDice()
  selectedDice.value.d20 = 1
  rollModifier.value = modifier
  rollReason.value = `Prueba de ${statName}`
  handleExecuteRoll()
}

function handleRollSkill(skillName: string, modifier: number) {
  clearSelectedDice()
  selectedDice.value.d20 = 1
  rollModifier.value = modifier
  rollReason.value = `Habilidad: ${skillName}`
  handleExecuteRoll()
}

function handleRollSave(ability: string, modifier: number) {
  clearSelectedDice()
  selectedDice.value.d20 = 1
  rollModifier.value = modifier
  rollReason.value = `Salvación de ${ability}`
  handleExecuteRoll()
}

function handleRollAttack(attack: any) {
  clearSelectedDice()
  selectedDice.value.d20 = 1
  rollModifier.value = attack.attackBonus || 0
  rollReason.value = `Ataque: ${attack.name}`
  handleExecuteRoll()
}

// Room management handlers
async function handleCreateRoom() {
  if (!inputUserName.value.trim()) {
    toast.add({ title: 'Atención', description: 'Ingresá tu nombre para crear la sala', color: 'amber' })
    return
  }
  userName.value = inputUserName.value.trim()
  await createRoom()
}

async function handleJoinRoom() {
  if (!inputUserName.value.trim() || !joinRoomCode.value.trim()) {
    toast.add({ title: 'Atención', description: 'Ingresá tu nombre y el código de sala', color: 'amber' })
    return
  }
  userName.value = inputUserName.value.trim()
  await joinExistingRoom()
}

function copyRoomCode() {
  if (currentRoom.value?.code) {
    navigator.clipboard.writeText(currentRoom.value.code)
    toast.add({ title: 'Copiado', description: `Código ${currentRoom.value.code} copiado al portapapeles`, color: 'emerald' })
  }
}

// Modals handlers
function handleAddEnemy(enemy?: any) {
  if (enemy && enemy.name) {
    newEnemy.value = { ...enemy }
  }
  addEnemy()
  showAddEnemyModal.value = false
}

function handleSendDmImage(payload?: { imageUrl?: string; caption?: string }) {
  if (!payload?.imageUrl) return
  socketIO.emit('dm:show_image', payload)
  showDmImageModal.value = false
}

// Socket listening for DM image broadcasts
onMounted(async () => {
  await loadUserCharacters()

  socketIO.on('dm:show_image', (data: any) => {
    displayedImageUrl.value = data.imageUrl
    displayedImageCaption.value = data.caption || ''
    showImageDisplayModal.value = true
  })

  // Auto-join if roomCode provided via prop or route
  const targetCode = props.roomCode || (route.params.roomCode as string)
  if (targetCode && targetCode !== 'index') {
    await initializeFromRoute(targetCode)
  }
})

useHead({
  title: computed(() => currentRoom.value ? `Sala ${currentRoom.value.code} - D&D Tools` : 'Lobby de Dados - D&D Tools'),
  meta: [{ name: 'description', content: 'Mesa táctica de dados y combate en tiempo real para D&D 5e' }]
})
</script>
