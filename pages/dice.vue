<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <UButton to="/dashboard" color="gray" variant="ghost" icon="i-heroicons-arrow-left" size="sm">
              Back to Dashboard
            </UButton>

            <div class="h-6 border-l border-gray-300 dark:border-gray-600"></div>

            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                🎲 Collaborative Dice Room
              </h1>
              <div v-if="currentRoom" class="flex items-center space-x-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  Room: {{ currentRoom.name }} 
                </span>
                <div class="flex items-center space-x-1">
                  <span class="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {{ currentRoom.code }}
                  </span>
                  <UButton 
                    v-if="currentRoom.code !== 'default'" 
                    color="gray" 
                    variant="ghost" 
                    size="xs"
                    icon="i-heroicons-clipboard-document"
                    @click="copyRoomCode"
                  >
                    Copy
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <!-- Sidebar Toggle Buttons -->
            <div class="flex items-center space-x-2">
              <UButton color="blue" variant="outline" size="sm" @click="isLeftSidebarOpen = !isLeftSidebarOpen"
                :icon="isLeftSidebarOpen ? 'i-heroicons-eye-slash' : 'i-heroicons-user'">
                <span class="hidden sm:inline">{{ isLeftSidebarOpen ? 'Hide' : 'Show' }} Character</span>
                <span class="sm:hidden">Char</span>
              </UButton>
              <UButton color="green" variant="outline" size="sm" @click="isRightSidebarOpen = !isRightSidebarOpen"
                :icon="isRightSidebarOpen ? 'i-heroicons-eye-slash' : 'i-heroicons-chart-bar'">
                <span class="hidden sm:inline">{{ isRightSidebarOpen ? 'Hide' : 'Show' }} Abilities</span>
                <span class="sm:hidden">Stats</span>
              </UButton>
            </div>

            <!-- Room Actions -->
            <div v-if="currentRoom && currentRoom.code !== 'default'" class="flex items-center space-x-2">
              <UButton color="red" variant="outline" size="sm" icon="i-heroicons-arrow-right-on-rectangle"
                @click="leaveRoom">
                Leave Room
              </UButton>
            </div>

            <div class="flex items-center space-x-2">
              <div class="h-3 w-3 rounded-full"
                :class="isConnected ? 'bg-green-500' : isOfflineMode ? 'bg-yellow-500' : 'bg-red-500'"></div>
              <span class="text-sm text-gray-600 dark:text-gray-300">
                {{ isConnected ? 'Connected' : isOfflineMode ? 'Offline Mode' : 'Disconnected' }}
              </span>
              <UButton 
                v-if="!isConnected || isOfflineMode"
                color="yellow" 
                variant="ghost" 
                size="xs"
                :icon="isOfflineModePreference ? 'i-heroicons-wifi' : 'i-heroicons-wifi-slash'"
                @click="toggleOfflineMode"
              >
                {{ isOfflineModePreference ? 'Go Online' : 'Stay Offline' }}
              </UButton>
            </div>

            <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <UIcon name="i-heroicons-users" class="h-4 w-4" />
              <span>{{ connectedUsers }} {{ isOfflineMode ? '(offline)' : 'online' }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Sidebar toggle buttons for mobile -->
      <div class="lg:hidden mb-4 grid grid-cols-2 gap-2">
        <UButton color="blue" variant="outline" @click="isLeftSidebarOpen = !isLeftSidebarOpen" 
          :icon="isLeftSidebarOpen ? 'i-heroicons-eye-slash' : 'i-heroicons-user'">
          {{ isLeftSidebarOpen ? 'Hide' : 'Show' }} Character
        </UButton>
        <UButton color="green" variant="outline" @click="isRightSidebarOpen = !isRightSidebarOpen" 
          :icon="isRightSidebarOpen ? 'i-heroicons-eye-slash' : 'i-heroicons-chart-bar'">
          {{ isRightSidebarOpen ? 'Hide' : 'Show' }} Abilities
        </UButton>
      </div>

      <!-- Offline Mode Banner -->
      <div v-if="isOfflineMode"
        class="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Offline Mode Active
            </h3>
            <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              You're currently using the dice room in offline mode. Your rolls are saved locally and won't be shared
              with other players.
              This happens automatically in production environments where the WebSocket server isn't available.
            </p>
          </div>
        </div>
      </div>

      <!-- Room Selection/Creation Card -->
      <UCard v-if="!currentRoom || !isConnected || currentRoom.code === 'default'" class="mb-6">
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            🏠 Room Management
          </h3>
        </template>

        <div class="space-y-4">
          <div class="flex items-center space-x-4">
            <!-- Only show Create Room button for DMs -->
            <UButton v-if="userRole === 'DM'" color="primary" @click="showCreateRoom = true" icon="i-heroicons-plus">
              Create New Room
            </UButton>

            <div v-if="userRole === 'DM'" class="text-gray-400 dark:text-gray-500">or</div>

            <div class="flex items-center space-x-2 flex-1">
              <UInput v-model="joinRoomCode" placeholder="Enter room code..." class="flex-1"
                @keyup.enter="joinExistingRoom" />
              <UButton color="gray" @click="joinExistingRoom" :disabled="!joinRoomCode.trim()"
                icon="i-heroicons-arrow-right-on-rectangle">
                Join Room
              </UButton>
            </div>
          </div>

          <div v-if="userRole === 'Player'" class="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div class="flex items-start space-x-2">
              <UIcon name="i-heroicons-information-circle" class="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <span class="font-medium text-blue-900 dark:text-blue-100">Player Note:</span>
                <span class="text-blue-800 dark:text-blue-200">Only DMs can create new rooms. Ask your DM for the room code to join their session.</span>
              </div>
            </div>
          </div>

          <div v-if="!isConnected" class="text-sm text-gray-500 dark:text-gray-400">
            Connect to create or join rooms for multiplayer functionality.
          </div>
        </div>
      </UCard>

      <!-- Main content area with dual sidebars -->
      <div class="relative">
        <!-- Mobile Overlays -->
        <div v-if="isLeftSidebarOpen || isRightSidebarOpen" class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          @click="isLeftSidebarOpen = false; isRightSidebarOpen = false">
        </div>

        <!-- Left Sidebar - Character Info -->
        <div
          class="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 max-w-full bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out z-50 overflow-y-auto"
          :class="isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'">
          <!-- Left Sidebar Header -->
          <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                🧙‍♂️ Character Info
              </h3>
              <UButton color="gray" variant="ghost" size="sm" @click="isLeftSidebarOpen = false"
                icon="i-heroicons-x-mark" />
            </div>
          </div>

          <!-- Left Sidebar Content -->
          <div class="p-4 space-y-6">
            <!-- Character Info Card (only for Players) -->
            <div v-if="userRole === 'Player'">
              <div class="mb-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-gray-900 dark:text-white">Character Details</h4>
                  <UButton v-if="!isOfflineMode" color="gray" variant="outline" size="xs" @click="resetStats">
                    Reset Stats
                  </UButton>
                </div>
              </div>

              <div v-if="playerStats" class="space-y-4">
                <!-- Character Image Placeholder -->
                <div class="flex justify-center">
                  <div class="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span class="text-3xl">🧙‍♂️</span>
                  </div>
                </div>

                <!-- Character Name -->
                <div class="text-center">
                  <h5 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ userCharacters.find(c => c.id === activeCharacterId)?.characterName || 'Unknown Character' }}
                  </h5>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Level {{ playerStats.level }} {{ userCharacters.find(c => c.id === activeCharacterId)?.className || 'Class' }}
                  </p>
                </div>

                <!-- Health Section -->
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <h6 class="text-sm font-medium text-red-900 dark:text-red-100 mb-2">Health</h6>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-red-700 dark:text-red-300">Hit Points</span>
                      <span class="font-mono text-red-900 dark:text-red-100">
                        {{ playerStats.hitPoints.current }} / {{ playerStats.hitPoints.max }}
                      </span>
                    </div>
                    <div class="w-full bg-red-200 dark:bg-red-800 rounded-full h-2">
                      <div class="bg-red-500 h-2 rounded-full transition-all duration-300"
                        :style="{ width: `${(playerStats.hitPoints.current / playerStats.hitPoints.max) * 100}%` }">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Core Stats Grid -->
                <div class="grid grid-cols-2 gap-3">
                  <!-- Armor Class -->
                  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                    <div class="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">AC</div>
                    <div class="text-lg font-bold text-blue-900 dark:text-blue-100">{{ playerStats.armorClass }}</div>
                  </div>
                  
                  <!-- Level -->
                  <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                    <div class="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Level</div>
                    <div class="text-lg font-bold text-green-900 dark:text-green-100">{{ playerStats.level }}</div>
                  </div>
                  
                  <!-- Speed -->
                  <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
                    <div class="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">Speed</div>
                    <div class="text-lg font-bold text-yellow-900 dark:text-yellow-100">{{ playerStats.speed }} ft</div>
                  </div>
                  
                  <!-- Proficiency Bonus -->
                  <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-center">
                    <div class="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Prof. Bonus</div>
                    <div class="text-lg font-bold text-purple-900 dark:text-purple-100">+{{ playerStats.proficiencyBonus }}</div>
                  </div>
                </div>

                <!-- Initiative -->
                <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <h6 class="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">Initiative</h6>
                  <div class="text-center">
                    <div class="text-xl font-bold text-orange-900 dark:text-orange-100">
                      {{ playerStats.initiative >= 0 ? '+' : '' }}{{ playerStats.initiative }}
                    </div>
                    <div class="text-xs text-orange-700 dark:text-orange-300">DEX modifier</div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-8">
                <div class="text-4xl mb-4">🎭</div>
                <p class="text-gray-500 dark:text-gray-400">
                  Select a character to view stats
                </p>
              </div>
            </div>

            <!-- DM Character Info Placeholder -->
            <div v-else>
              <div class="text-center py-8">
                <div class="text-4xl mb-4">🎯</div>
                <h4 class="font-medium text-gray-900 dark:text-white mb-2">Dungeon Master</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Character info is available for players only.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Sidebar - Ability Scores -->
        <div
          class="fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 max-w-full bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out z-50 overflow-y-auto"
          :class="isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'">
          <!-- Right Sidebar Header -->
          <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                ⚡ Ability Scores
              </h3>
              <UButton color="gray" variant="ghost" size="sm" @click="isRightSidebarOpen = false"
                icon="i-heroicons-x-mark" />
            </div>
          </div>

          <!-- Right Sidebar Content -->
          <div class="p-4 space-y-6">
            <!-- Ability Scores (only for Players) -->
            <div v-if="userRole === 'Player'">
              <div v-if="playerStats" class="space-y-4">
                <!-- Ability Scores Grid -->
                <div class="space-y-3">
                  <!-- Strength -->
                  <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm font-medium text-red-900 dark:text-red-100">Strength (STR)</div>
                        <div class="text-xs text-red-700 dark:text-red-300">Physical power</div>
                      </div>
                      <div class="text-right">
                        <div class="text-lg font-bold text-red-900 dark:text-red-100">{{ playerStats.abilities.strength }}</div>
                        <div class="text-xs text-red-700 dark:text-red-300">
                          {{ Math.floor((playerStats.abilities.strength - 10) / 2) >= 0 ? '+' : '' }}{{ Math.floor((playerStats.abilities.strength - 10) / 2) }} mod
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Dexterity -->
                  <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm font-medium text-green-900 dark:text-green-100">Dexterity (DEX)</div>
                        <div class="text-xs text-green-700 dark:text-green-300">Agility & reflexes</div>
                      </div>
                      <div class="text-right">
                        <div class="text-lg font-bold text-green-900 dark:text-green-100">{{ playerStats.abilities.dexterity }}</div>
                        <div class="text-xs text-green-700 dark:text-green-300">
                          {{ Math.floor((playerStats.abilities.dexterity - 10) / 2) >= 0 ? '+' : '' }}{{ Math.floor((playerStats.abilities.dexterity - 10) / 2) }} mod
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Constitution -->
                  <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm font-medium text-orange-900 dark:text-orange-100">Constitution (CON)</div>
                        <div class="text-xs text-orange-700 dark:text-orange-300">Health & stamina</div>
                      </div>
                      <div class="text-right">
                        <div class="text-lg font-bold text-orange-900 dark:text-orange-100">{{ playerStats.abilities.constitution }}</div>
                        <div class="text-xs text-orange-700 dark:text-orange-300">
                          {{ Math.floor((playerStats.abilities.constitution - 10) / 2) >= 0 ? '+' : '' }}{{ Math.floor((playerStats.abilities.constitution - 10) / 2) }} mod
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Intelligence -->
                  <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm font-medium text-purple-900 dark:text-purple-100">Intelligence (INT)</div>
                        <div class="text-xs text-purple-700 dark:text-purple-300">Reasoning & memory</div>
                      </div>
                      <div class="text-right">
                        <div class="text-lg font-bold text-purple-900 dark:text-purple-100">{{ playerStats.abilities.intelligence }}</div>
                        <div class="text-xs text-purple-700 dark:text-purple-300">
                          {{ Math.floor((playerStats.abilities.intelligence - 10) / 2) >= 0 ? '+' : '' }}{{ Math.floor((playerStats.abilities.intelligence - 10) / 2) }} mod
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Wisdom -->
                  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm font-medium text-blue-900 dark:text-blue-100">Wisdom (WIS)</div>
                        <div class="text-xs text-blue-700 dark:text-blue-300">Awareness & insight</div>
                      </div>
                      <div class="text-right">
                        <div class="text-lg font-bold text-blue-900 dark:text-blue-100">{{ playerStats.abilities.wisdom }}</div>
                        <div class="text-xs text-blue-700 dark:text-blue-300">
                          {{ Math.floor((playerStats.abilities.wisdom - 10) / 2) >= 0 ? '+' : '' }}{{ Math.floor((playerStats.abilities.wisdom - 10) / 2) }} mod
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Charisma -->
                  <div class="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm font-medium text-pink-900 dark:text-pink-100">Charisma (CHA)</div>
                        <div class="text-xs text-pink-700 dark:text-pink-300">Force of personality</div>
                      </div>
                      <div class="text-right">
                        <div class="text-lg font-bold text-pink-900 dark:text-pink-100">{{ playerStats.abilities.charisma }}</div>
                        <div class="text-xs text-pink-700 dark:text-pink-300">
                          {{ Math.floor((playerStats.abilities.charisma - 10) / 2) >= 0 ? '+' : '' }}{{ Math.floor((playerStats.abilities.charisma - 10) / 2) }} mod
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-8">
                <div class="text-4xl mb-4">⚡</div>
                <p class="text-gray-500 dark:text-gray-400">
                  Select a character to view ability scores
                </p>
              </div>
            </div>

            <!-- DM Player Management (only for DMs) -->
            <div v-else>
              <div class="mb-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-gray-900 dark:text-white">Player Management</h4>
                  <UButton color="blue" variant="outline" size="xs" @click="loadAllPlayersStats(currentRoom?.code || 'default')"
                    icon="i-heroicons-arrow-path">
                    Refresh
                  </UButton>
                </div>
              </div>

              <div v-if="allPlayers.length > 0" class="space-y-3">
                <div v-for="player in allPlayers" :key="player.userId"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-2">
                      <span class="font-medium text-gray-900 dark:text-white">{{ player.name }}</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">({{ player.userId }})</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <UButton color="green" variant="outline" size="xs" @click="requestRollFromPlayer(player)"
                        icon="i-heroicons-cube">
                        Request Roll
                      </UButton>
                      <UButton color="blue" variant="outline" size="xs" @click="editPlayerStats(player)"
                        icon="i-heroicons-pencil">
                        Edit
                      </UButton>
                    </div>
                  </div>
                  
                  <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>STR: {{ player.stats.abilities.strength }} | DEX: {{ player.stats.abilities.dexterity }} | CON: {{ player.stats.abilities.constitution }}</div>
                    <div>INT: {{ player.stats.abilities.intelligence }} | WIS: {{ player.stats.abilities.wisdom }} | CHA: {{ player.stats.abilities.charisma }}</div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-8">
                <div class="text-4xl mb-4">👥</div>
                <p class="text-gray-500 dark:text-gray-400">
                  {{ isOfflineMode ? 'Player management not available in offline mode' : 'No players connected' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Main content area -->
        <div class="transition-all duration-300 min-h-screen">
          <div class="px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column - Dice Rolling -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Dice Selection Card -->
              <UCard>
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                      🎲 Select Dice
                    </h3>
                    <div v-if="totalDiceSelected > 0" class="text-sm text-gray-500 dark:text-gray-400">
                      {{ totalDiceSelected }} dice selected
                    </div>
                  </div>
                </template>

                <div class="space-y-6">
                  <!-- Dice Grid -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div v-for="dice in diceTypes" :key="dice.type" class="flex flex-col items-center space-y-2">
                      <div class="text-center">
                        <div class="text-2xl mb-1" :class="dice.color">{{ dice.symbol }}</div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">{{ dice.name }}</div>
                      </div>
                      <div class="flex items-center space-x-2">
                        <UButton color="gray" variant="outline" size="xs" @click="selectedDice[dice.type] = Math.max(0, selectedDice[dice.type] - 1)"
                          icon="i-heroicons-minus" :disabled="selectedDice[dice.type] <= 0" />
                        <span class="w-8 text-center text-sm font-mono">{{ selectedDice[dice.type] }}</span>
                        <UButton color="gray" variant="outline" size="xs" @click="selectedDice[dice.type]++"
                          icon="i-heroicons-plus" />
                      </div>
                    </div>
                  </div>

                  <!-- Quick Roll Buttons -->
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Quick Rolls</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <UButton v-for="roll in quickRolls" :key="roll.label" color="gray" variant="outline" size="sm"
                        @click="performQuickRoll(roll)" class="text-xs">
                        {{ roll.label }}
                      </UButton>
                    </div>
                  </div>

                  <!-- Modifier and Roll Type -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UFormGroup label="Modifier">
                      <UInput v-model.number="modifier" type="number" placeholder="0" />
                    </UFormGroup>
                    <UFormGroup label="Roll Type">
                      <USelect v-model="rollType" :options="rollTypeOptions" />
                    </UFormGroup>
                  </div>

                  <!-- Roll Button -->
                  <div class="text-center">
                    <UButton color="primary" size="lg" @click="rollDice" :disabled="totalDiceSelected === 0 || isRolling"
                      :loading="isRolling" icon="i-heroicons-play">
                      Roll {{ totalDiceSelected }} {{ totalDiceSelected === 1 ? 'Die' : 'Dice' }}
                    </UButton>
                  </div>

                  <!-- Clear Selection -->
                  <div class="text-center">
                    <UButton color="gray" variant="ghost" size="sm" @click="clearSelection" :disabled="totalDiceSelected === 0"
                      icon="i-heroicons-x-mark">
                      Clear Selection
                    </UButton>
                  </div>
                </div>
              </UCard>
            </div>

            <!-- Right Column - Roll History -->
            <div class="space-y-6">
                <!-- Battle Mode Panel (DM Only) -->
              <UCard v-if="userRole === 'DM' && currentRoom && currentRoom.code !== 'default'">
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                      ⚔️ Battle Mode
                    </h3>
                    <div class="flex items-center space-x-2">
                      <UBadge v-if="isInBattle" :color="getBattlePhaseColor(battleMode.phase)" variant="soft">
                        {{ getBattlePhaseLabel(battleMode.phase) }} 
                      </UBadge>
                      <UButton
                        v-if="!isInBattle"
                        color="red"
                        size="sm"
                        @click="startBattle"
                        :loading="isBattleLoading"
                        icon="i-heroicons-play"
                      >
                        Start Battle Setup
                      </UButton>
                      <UButton
                        v-else
                        color="gray"
                        size="sm"
                        @click="endBattle"
                        :loading="isBattleLoading"
                        icon="i-heroicons-stop"
                      >
                        End Battle
                      </UButton>
                    </div>
                  </div>
                </template>

                <div v-if="!isInBattle" class="text-center py-8">
                  <div class="text-4xl mb-4">⚔️</div>
                  <h4 class="font-medium text-gray-900 dark:text-white mb-2">Ready for Battle</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Click "Start Battle Setup" to begin preparing for combat. You'll be able to add enemies and then roll initiative when ready.
                  </p>
                </div>

                <!-- Battle Setup Phase -->
                <div v-else-if="battleMode.phase === 'setup'" class="space-y-4">
                  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div class="flex items-start space-x-3">
                      <UIcon name="i-heroicons-information-circle" class="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">Battle Setup Phase</h4>
                        <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Add all enemies that will participate in this battle, then click "Roll Initiative" to begin combat.
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Enemy Management -->
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="text-sm font-medium text-gray-900 dark:text-white">Enemy Setup</h4>
                      <UButton
                        color="green"
                        variant="outline"
                        size="xs"
                        @click="showAddEnemyModal = true"
                        icon="i-heroicons-plus"
                      >
                        Add Enemy
                      </UButton>
                    </div>
                    
                    <div v-if="battleMode.enemies && Object.keys(battleMode.enemies).length > 0" class="space-y-2">
                      <div v-for="enemy in Object.values(battleMode.enemies)" :key="enemy.id"
                        class="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                        <div class="flex-1">
                          <div class="font-medium text-red-900 dark:text-red-100">{{ enemy.name }}</div>
                          <div class="text-xs text-red-700 dark:text-red-300">
                            HP: {{ enemy.hitPoints.current }}/{{ enemy.hitPoints.max }} | AC: {{ enemy.armorClass }} | Init: {{ enemy.initiative >= 0 ? '+' : '' }}{{ enemy.initiative }}
                          </div>
                        </div>
                        <div class="flex items-center space-x-1">
                          <UButton
                            color="red"
                            variant="ghost"
                            size="xs"
                            @click="removeEnemy(enemy.id)"
                            icon="i-heroicons-trash"
                          >
                          </UButton>
                        </div>
                      </div>
                    </div>
                    
                    <div v-else class="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <div class="text-2xl mb-2">👹</div>
                      <p class="text-gray-500 dark:text-gray-400 text-sm mb-3">
                        No enemies added yet
                      </p>
                      <UButton
                        color="green"
                        variant="outline"
                        size="sm"
                        @click="showAddEnemyModal = true"
                        icon="i-heroicons-plus"
                      >
                        Add Your First Enemy
                      </UButton>
                    </div>
                  </div>

                  <!-- Ready to Roll Initiative -->
                  <div v-if="battleMode.enemies && Object.keys(battleMode.enemies).length > 0" 
                    class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div class="text-center">
                      <div class="text-green-900 dark:text-green-100 font-medium mb-2">
                        Ready to Start Combat!
                      </div>
                      <p class="text-sm text-green-700 dark:text-green-300 mb-3">
                        {{ Object.keys(battleMode.enemies).length }} enemies ready. Click below to roll initiative and begin combat.
                      </p>
                      <UButton
                        color="green"
                        size="sm"
                        @click="rollInitiative"
                        icon="i-heroicons-play"
                      >
                        Roll Initiative & Start Combat
                      </UButton>
                    </div>
                  </div>
                </div>

                <!-- Active Combat Phase -->
                <div v-else-if="battleMode.phase === 'combat'" class="space-y-4">
                  <!-- Enemy Management -->
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="text-sm font-medium text-gray-900 dark:text-white">Enemies</h4>
                      <UButton
                        color="green"
                        variant="outline"
                        size="xs"
                        @click="showAddEnemyModal = true"
                        icon="i-heroicons-plus"
                      >
                        Add Enemy
                      </UButton>
                    </div>
                    
                    <div v-if="battleMode.enemies && Object.keys(battleMode.enemies).length > 0" class="space-y-2">
                      <div v-for="enemy in Object.values(battleMode.enemies)" :key="enemy.id"
                        class="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                        <div class="flex-1">
                          <div class="font-medium text-red-900 dark:text-red-100">{{ enemy.name }}</div>
                          <div class="text-xs text-red-700 dark:text-red-300">
                            HP: {{ enemy.hitPoints.current }}/{{ enemy.hitPoints.max }} | AC: {{ enemy.armorClass }}
                          </div>
                        </div>
                        <div class="flex items-center space-x-1">
                          <UButton
                            color="red"
                            variant="ghost"
                            size="xs"
                            @click="dealDamageToEnemy(enemy)"
                            icon="i-heroicons-minus"
                          >
                          </UButton>
                          <UButton
                            color="red"
                            variant="ghost"
                            size="xs"
                            @click="removeEnemy(enemy.id)"
                            icon="i-heroicons-trash"
                          >
                          </UButton>
                        </div>
                      </div>
                    </div>
                    
                    <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                      No enemies in battle
                    </div>
                  </div>

                  <!-- Initiative Tracker -->
                  <div v-if="battleMode.initiativeOrder && battleMode.initiativeOrder.length > 0">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="text-sm font-medium text-gray-900 dark:text-white">Initiative Order</h4>
                      <div class="flex items-center space-x-2">
                        <UButton
                          v-if="battleMode.phase === 'setup'"
                          color="blue"
                          variant="outline"
                          size="xs"
                          @click="rollInitiative"
                          icon="i-heroicons-arrow-path"
                        >
                          Roll Initiative
                        </UButton>
                        <UButton
                          v-else-if="battleMode.phase === 'combat'"
                          color="green"
                          variant="outline"
                          size="xs"
                          @click="nextTurn"
                          icon="i-heroicons-arrow-right"
                        >
                          Next Turn
                        </UButton>
                      </div>
                    </div>
                    
                    <div class="space-y-1">
                      <div v-for="(participant, index) in battleMode.initiativeOrder" :key="participant.id"
                        class="flex items-center justify-between p-2 rounded"
                        :class="index === battleMode.currentTurnIndex ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'">
                        <div class="flex items-center space-x-2">
                          <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            :class="index === battleMode.currentTurnIndex ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'">
                            {{ index + 1 }}
                          </div>
                          <span class="font-medium" 
                            :class="index === battleMode.currentTurnIndex ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-white'">
                            {{ participant.name }}
                          </span>
                          <UBadge :color="participant.type === 'player' ? 'blue' : 'red'" variant="soft" size="xs">
                            {{ participant.type }}
                          </UBadge>
                        </div>
                        <div class="text-sm font-mono"
                          :class="index === battleMode.currentTurnIndex ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'">
                          {{ participant.initiativeRoll }} ({{ participant.initiative >= 0 ? '+' : '' }}{{ participant.initiative }})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </UCard>

              <!-- Battle Status (Player View) -->
              <UCard v-else-if="userRole === 'Player' && isInBattle">
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                      ⚔️ Battle in Progress
                    </h3>
                    <UBadge color="green" variant="soft">
                      {{ battleMode.phase }}
                    </UBadge>
                  </div>
                </template>

                <div class="space-y-4">
                  <!-- Current Turn Display -->
                  <div v-if="battleMode.phase === 'combat' && battleMode.initiativeOrder && battleMode.currentTurnIndex !== undefined" 
                    class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div class="text-center">
                      <div class="text-lg font-bold text-green-900 dark:text-green-100">
                        Current Turn
                      </div>
                      <div class="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                        {{ battleMode.initiativeOrder[battleMode.currentTurnIndex]?.name || 'Unknown' }}
                      </div>
                      <UBadge 
                        :color="battleMode.initiativeOrder[battleMode.currentTurnIndex]?.type === 'player' ? 'blue' : 'red'" 
                        variant="soft" 
                        class="mt-2"
                      >
                        {{ battleMode.initiativeOrder[battleMode.currentTurnIndex]?.type || 'unknown' }}
                      </UBadge>
                    </div>
                  </div>

                  <!-- Initiative Order (Player View) -->
                  <div v-if="battleMode.initiativeOrder && battleMode.initiativeOrder.length > 0">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Initiative Order</h4>
                    <div class="space-y-1">
                      <div v-for="(participant, index) in battleMode.initiativeOrder" :key="participant.id"
                        class="flex items-center justify-between p-2 rounded"
                        :class="index === battleMode.currentTurnIndex ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'">
                        <div class="flex items-center space-x-2">
                          <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            :class="index === battleMode.currentTurnIndex ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'">
                            {{ index + 1 }}
                          </div>
                          <span class="font-medium" 
                            :class="index === battleMode.currentTurnIndex ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-white'">
                            {{ participant.name }}
                          </span>
                          <UBadge :color="participant.type === 'player' ? 'blue' : 'red'" variant="soft" size="xs">
                            {{ participant.type }}
                          </UBadge>
                        </div>
                        <div class="text-sm font-mono"
                          :class="index === battleMode.currentTurnIndex ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'">
                          {{ participant.initiativeRoll }} ({{ participant.initiative >= 0 ? '+' : '' }}{{ participant.initiative }})
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Battle Phase Info -->
                  <div v-if="battleMode.phase === 'setup'" class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    <div class="text-2xl mb-2">⏳</div>
                    <p>Waiting for DM to roll initiative...</p>
                  </div>
                </div>
              </UCard>

               <!-- DJ Music Control Panel (DM Only) -->
               <UCard v-if="userRole === 'DM' && currentRoom && currentRoom.code !== 'default' && isConnected">
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                      🎵 DJ Music Control
                    </h3>
                    <div class="flex items-center space-x-2">
                      <UBadge v-if="musicState.isPlaying" color="green" variant="soft">
                        Playing
                      </UBadge>
                      <UBadge v-else-if="musicState.currentTrack" color="yellow" variant="soft">
                        Paused
                      </UBadge>
                      <UBadge v-else color="gray" variant="soft">
                        No Track
                      </UBadge>
                    </div>
                  </div>
                </template>

                <div class="space-y-4">
                  <!-- Add YouTube Track Section -->
                  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">Add YouTube Track</h4>
                    <div class="space-y-3">
                      <UInput
                        v-model="newTrackUrl"
                        placeholder="Paste YouTube URL here..."
                        icon="i-heroicons-musical-note"
                      />
                      <div class="flex space-x-2">
                        <UButton
                          color="blue"
                          size="sm"
                          @click="addTrackToPlaylist"
                          :disabled="!newTrackUrl || isAddingTrack"
                          :loading="isAddingTrack"
                          icon="i-heroicons-plus"
                        >
                          Add to Playlist
                        </UButton>
                        <UButton
                          color="green"
                          size="sm"
                          @click="addAndPlayTrack"
                          :disabled="!newTrackUrl || isAddingTrack"
                          :loading="isAddingTrack"
                          icon="i-heroicons-play"
                        >
                          Add & Play Now
                        </UButton>
                      </div>
                    </div>
                  </div>

                  <!-- Fade Transition Settings -->
                  <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <h4 class="text-sm font-medium text-purple-900 dark:text-purple-100 mb-3">🎚️ Audio Transitions</h4>
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <label class="text-sm text-purple-700 dark:text-purple-300">Enable Smooth Fades</label>
                        <UToggle v-model="fadeConfig.enabled" />
                      </div>
                      
                      <div v-if="fadeConfig.enabled" class="space-y-2 border-t border-purple-200 dark:border-purple-700 pt-3">
                        <div class="flex items-center justify-between">
                          <label class="text-xs text-purple-600 dark:text-purple-400">Track Switch (ms)</label>
                          <UInput 
                            v-model.number="fadeConfig.trackTransition" 
                            type="number" 
                            min="100" 
                            max="2000" 
                            size="xs"
                            class="w-20"
                          />
                        </div>
                        
                        <div class="flex items-center justify-between">
                          <label class="text-xs text-purple-600 dark:text-purple-400">Volume Change (ms)</label>
                          <UInput 
                            v-model.number="fadeConfig.volumeChange" 
                            type="number" 
                            min="100" 
                            max="1000" 
                            size="xs"
                            class="w-20"
                          />
                        </div>
                        
                        <div class="flex items-center justify-between">
                          <label class="text-xs text-purple-600 dark:text-purple-400">Play/Pause (ms)</label>
                          <UInput 
                            v-model.number="fadeConfig.playPause" 
                            type="number" 
                            min="100" 
                            max="1000" 
                            size="xs"
                            class="w-20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Current Track Display -->
                  <div v-if="musicState.currentTrack" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div class="flex items-start space-x-3">
                      <!-- Thumbnail -->
                      <div class="flex-shrink-0">
                        <img 
                          v-if="musicState.currentTrack.thumbnail" 
                          :src="musicState.currentTrack.thumbnail" 
                          :alt="musicState.currentTrack.title"
                          class="w-16 h-12 object-cover rounded-lg"
                        />
                        <div 
                          v-else 
                          class="w-16 h-12 bg-green-200 dark:bg-green-800 rounded-lg flex items-center justify-center"
                        >
                          <UIcon name="i-heroicons-musical-note" class="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      
                      <!-- Track info and controls -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between">
                          <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                              🎵 {{ musicState.currentTrack.title || 'Unknown Track' }}
                            </h4>
                            <p class="text-xs text-green-700 dark:text-green-300 truncate mt-1">
                              {{ musicState.currentTrack.artist || 'Unknown Artist' }}
                            </p>
                            <!-- Duration and metadata -->
                            <div class="flex items-center space-x-2 text-xs text-green-600 dark:text-green-400 mt-1">
                              <span v-if="musicState.currentTrack.duration">{{ formatDuration(musicState.currentTrack.duration) }}</span>
                              <span v-if="musicState.currentTrack.tags && musicState.currentTrack.tags.length > 0" class="truncate">
                                #{{ musicState.currentTrack.tags.slice(0, 1).join(', #') }}
                              </span>
                            </div>
                          </div>
                          
                          <!-- Control buttons -->
                          <div class="flex items-center space-x-1 ml-3">
                            <!-- Fade transition indicator -->
                            <div 
                              v-if="fadeTransition.isActive" 
                              class="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 mr-2"
                            >
                              <UIcon name="i-heroicons-arrows-right-left" class="w-3 h-3 animate-pulse" />
                              <span class="text-xs">Fading...</span>
                            </div>
                            
                            <UButton
                              v-if="musicState.isPlaying"
                              color="yellow"
                              variant="ghost"
                              size="xs"
                              @click="pauseMusic"
                              icon="i-heroicons-pause"
                            />
                            <UButton
                              v-else
                              color="green"
                              variant="ghost"
                              size="xs"
                              @click="resumeMusic"
                              icon="i-heroicons-play"
                            />
                            <UButton
                              color="red"
                              variant="ghost"
                              size="xs"
                              @click="stopMusic"
                              icon="i-heroicons-stop"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Volume Control -->
                  <div class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="text-sm font-medium text-gray-900 dark:text-white">Volume</h4>
                      <span class="text-sm text-gray-600 dark:text-gray-400">{{ musicState.volume }}%</span>
                    </div>
                    <div class="flex items-center space-x-3">
                      <UIcon name="i-heroicons-speaker-x-mark" class="h-4 w-4 text-gray-400" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        v-model="musicState.volume"
                        @input="setVolume"
                        class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <UIcon name="i-heroicons-speaker-wave" class="h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <!-- Playlist -->
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="text-sm font-medium text-gray-900 dark:text-white">Playlist</h4>
                      <UButton
                        v-if="musicState.playlist.length > 0"
                        color="gray"
                        variant="ghost"
                        size="xs"
                        @click="clearPlaylist"
                        icon="i-heroicons-trash"
                      >
                        Clear All
                      </UButton>
                    </div>
                    
                    <div v-if="musicState.playlist.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
                      <div
                        v-for="track in musicState.playlist"
                        :key="track.id"
                        class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                        :class="{ 'ring-2 ring-green-500': track.id === musicState.currentTrack?.id }"
                      >
                        <!-- Thumbnail and track info -->
                        <div class="flex items-center flex-1 min-w-0 space-x-3">
                          <!-- Video thumbnail -->
                          <div class="flex-shrink-0">
                            <img 
                              v-if="track.thumbnail" 
                              :src="track.thumbnail" 
                              :alt="track.title"
                              class="w-12 h-9 object-cover rounded"
                            />
                            <div 
                              v-else 
                              class="w-12 h-9 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center"
                            >
                              <UIcon name="i-heroicons-musical-note" class="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                          
                          <!-- Track details -->
                          <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {{ track.title || 'Unknown Track' }}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {{ track.artist || 'Unknown Artist' }}
                            </div>
                            <!-- Duration and additional metadata -->
                            <div class="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500 mt-1">
                              <span v-if="track.duration">{{ formatDuration(track.duration) }}</span>
                              <span v-if="track.tags && track.tags.length > 0" class="truncate">
                                {{ track.tags.slice(0, 2).join(', ') }}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Control buttons -->
                        <div class="flex items-center space-x-1 ml-2">
                          <UButton
                            color="green"
                            variant="ghost"
                            size="xs"
                            @click="playTrackFromPlaylist(track)"
                            icon="i-heroicons-play"
                            :disabled="track.id === musicState.currentTrack?.id && musicState.isPlaying"
                          />
                          <UButton
                            color="red"
                            variant="ghost"
                            size="xs"
                            @click="removeTrackFromPlaylist(track.id)"
                            icon="i-heroicons-trash"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div v-else class="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <div class="text-2xl mb-2">🎵</div>
                      <p class="text-gray-500 dark:text-gray-400 text-sm mb-3">
                        No tracks in playlist
                      </p>
                      <p class="text-gray-400 dark:text-gray-500 text-xs">
                        Add YouTube tracks to create atmosphere for your session
                      </p>
                    </div>
                  </div>

                  <!-- Music Sync Info for Participants -->
                  <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                    <div class="flex items-start space-x-2">
                      <UIcon name="i-heroicons-information-circle" class="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div>
                        <h4 class="text-xs font-medium text-purple-900 dark:text-purple-100">Music Sync</h4>
                        <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">
                          All participants will hear the music you play in real-time. Volume is controlled individually by each player.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </UCard>

               <!-- YouTube Music Player (All Users) -->
               <UCard v-if="currentRoom && currentRoom.code !== 'default' && isConnected">
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                      🎵 Music Player
                    </h3>
                    <UBadge v-if="musicState.currentTrack && musicState.isPlaying" color="green" variant="soft">
                      Live
                    </UBadge>
                    <UBadge v-else-if="musicState.currentTrack" color="yellow" variant="soft">
                      Paused
                    </UBadge>
                    <UBadge v-else color="gray" variant="soft">
                      Ready
                    </UBadge>
                  </div>
                </template>

                <div class="space-y-4">
                  <!-- YouTube Player Container - Always Present -->
                  <div class="aspect-video bg-black rounded-lg overflow-hidden">
                    <div 
                      id="youtube-player" 
                      class="w-full h-full"
                    ></div>
                  </div>
                  
                  <!-- Track Info - Only when track exists -->
                  <div v-if="musicState.currentTrack" class="text-center">
                    <h4 class="font-medium text-gray-900 dark:text-white">
                      {{ musicState.currentTrack.title }}
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ musicState.currentTrack.artist }}
                    </p>
                  </div>
                  
                  <!-- No Track Message -->
                  <div v-else class="text-center py-4">
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      No music playing. {{ userRole === 'DM' ? 'Add a YouTube link to start.' : 'Waiting for DM to start music.' }}
                    </p>
                  </div>
                  
                  <!-- Non-DM Notice -->
                  <div v-if="userRole !== 'DM'" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div class="flex items-start space-x-2">
                      <UIcon name="i-heroicons-information-circle" class="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 class="text-xs font-medium text-blue-900 dark:text-blue-100">Music Player</h4>
                        <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          Music is controlled by the DM. You can adjust the volume using your browser controls.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </UCard>

              <!-- Roll History -->
              <UCard>
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                      🎯 Roll History
                    </h3>
                    <UButton v-if="rollHistory.length > 0" color="gray" variant="ghost" size="xs" @click="clearHistory"
                      icon="i-heroicons-trash">
                      Clear
                    </UButton>
                  </div>
                </template>

                <div v-if="rollHistory.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
                  <div v-for="roll in rollHistory.slice().reverse()" :key="roll.id"
                    class="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                    :class="{ 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20': roll.isOwn }">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                          <span class="text-sm font-medium" :class="roll.isOwn ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'">
                            {{ roll.userName }}
                          </span>
                          <span class="text-xs text-gray-500 dark:text-gray-400">
                            {{ formatTime(roll.timestamp) }}
                          </span>
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">{{ roll.description }}</div>
                        <div class="flex items-center space-x-2">
                          <span class="text-lg font-bold" :class="roll.isCritical ? (roll.criticalType === 'success' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400') : 'text-gray-900 dark:text-white'">
                            {{ roll.total }}
                          </span>
                          <div v-if="roll.details.length > 1" class="text-xs text-gray-500 dark:text-gray-400">
                            ({{ roll.details.join(' + ') }})
                          </div>
                        </div>

                        <div v-if="roll.isCritical" class="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                          {{ roll.criticalType === 'success' ? '🎯 Critical Hit!' : '💥 Critical Fail!' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-8">
                  <div class="text-4xl mb-4">🎲</div>
                  <p class="text-gray-500 dark:text-gray-400">
                    No rolls yet. Start rolling some dice!
                  </p>
                </div>
              </UCard>

              <!-- Room Stats -->
              <UCard>
                <template #header>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Room Statistics
                  </h3>
                </template>

                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600 dark:text-gray-300">Total Rolls</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ rollHistory.length }}</span>
                  </div>

                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600 dark:text-gray-300">Your Rolls</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ userRollCount }}</span>
                  </div>

                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600 dark:text-gray-300">Connected Users</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ connectedUsers }}</span>
                  </div>

                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600 dark:text-gray-300">Critical Hits</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ criticalHits }}</span>
                  </div>
                </div>
              </UCard>
            </div>
           </div>
         </div>
       </div>
     </div>
     </main>
    <!-- Room Creation Modal -->
    <UModal v-model="showCreateRoom" :ui="{ width: 'max-w-md' }">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            🏠 Create New Room
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showCreateRoom = false" />
        </div>

        <div class="space-y-4">
          <div class="text-center py-4">
            <div class="text-6xl mb-4">🎲</div>
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Create a new private room for your D&D session
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              You'll get a unique room code that others can use to join
            </p>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-8">
          <UButton color="gray" variant="outline" @click="showCreateRoom = false">
            Cancel
          </UButton>
          <UButton color="primary" @click="createRoom" icon="i-heroicons-plus">
            Create Room
          </UButton>
        </div>
      </div>
    </UModal>

    <!-- DM Roll Request Modal -->
    <UModal v-model="showRollRequestModal" :ui="{ width: 'max-w-md' }">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            🎲 Request Roll from {{ selectedPlayerForRequest?.name }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="closeRollRequestModal" />
        </div>

        <div class="space-y-4">
          <!-- Dice Type Selection -->
          <div>
            <UFormGroup label="Select Dice Type">
              <div class="grid grid-cols-2 gap-3">
                <UButton
                  v-for="diceType in diceTypes"
                  :key="diceType.type"
                  :color="requestedDiceType === diceType.type ? 'primary' : 'gray'"
                  :variant="requestedDiceType === diceType.type ? 'solid' : 'outline'"
                  class="flex flex-col items-center p-4 h-20"
                  @click="requestedDiceType = diceType.type"
                >
                  <div class="text-2xl mb-1">🎲</div>
                  <div class="text-xs">{{ diceType.name }}</div>
                </UButton>
              </div>
            </UFormGroup>
          </div>

          <!-- Optional Message -->
          <div>
            <UFormGroup label="Optional Message">
              <UTextarea
                v-model="rollRequestMessage"
                placeholder="e.g., Make a Dexterity saving throw..."
                rows="3"
              />
            </UFormGroup>
          </div>

          <!-- Modifier (optional) -->
          <div>
            <UFormGroup label="Modifier (optional)">
              <UInput
                v-model.number="rollRequestModifier"
                type="number"
                placeholder="0"
              />
            </UFormGroup>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-8">
          <UButton color="gray" variant="outline" @click="closeRollRequestModal">
            Cancel
          </UButton>
          <UButton
            color="primary"
            @click="sendRollRequest"
            :disabled="!requestedDiceType"
            icon="i-heroicons-paper-airplane"
          >
            Send Request
          </UButton>
        </div>
      </div>
    </UModal>

    <!-- DM Player Stats Editing Modal -->
    <UModal v-model="isEditingPlayer" :ui="{ width: 'max-w-2xl' }">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Stats for {{ editingPlayer?.name }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="closeEditModal" />
        </div>

        <div v-if="editingPlayerStats" class="space-y-6">
          <!-- Hit Points -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Health</h4>
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Current HP">
                <UInput v-model.number="editingPlayerStats.hitPoints.current" type="number" min="0"
                  :max="editingPlayerStats.hitPoints.max" />
              </UFormGroup>
              <UFormGroup label="Max HP">
                <UInput v-model.number="editingPlayerStats.hitPoints.max" type="number" min="1" />
              </UFormGroup>
            </div>
          </div>

          <!-- Core Stats -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Core Stats</h4>
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Armor Class">
                <UInput v-model.number="editingPlayerStats.armorClass" type="number" min="1" />
              </UFormGroup>
              <UFormGroup label="Level">
                <UInput v-model.number="editingPlayerStats.level" type="number" min="1" max="20" />
              </UFormGroup>
              <UFormGroup label="Proficiency Bonus">
                <UInput v-model.number="editingPlayerStats.proficiencyBonus" type="number" min="1" />
              </UFormGroup>
              <UFormGroup label="Speed">
                <UInput v-model.number="editingPlayerStats.speed" type="number" min="0" />
              </UFormGroup>
            </div>
          </div>

          <!-- Abilities -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Ability Scores</h4>
            <div class="grid grid-cols-3 gap-4">
              <UFormGroup label="Strength (STR)">
                <UInput v-model.number="editingPlayerStats.abilities.strength" type="number" min="1" max="30" />
              </UFormGroup>
              <UFormGroup label="Dexterity (DEX)">
                <UInput v-model.number="editingPlayerStats.abilities.dexterity" type="number" min="1" max="30" />
              </UFormGroup>
              <UFormGroup label="Constitution (CON)">
                <UInput v-model.number="editingPlayerStats.abilities.constitution" type="number" min="1" max="30" />
              </UFormGroup>
              <UFormGroup label="Intelligence (INT)">
                <UInput v-model.number="editingPlayerStats.abilities.intelligence" type="number" min="1" max="30" />
              </UFormGroup>
              <UFormGroup label="Wisdom (WIS)">
                <UInput v-model.number="editingPlayerStats.abilities.wisdom" type="number" min="1" max="30" />
              </UFormGroup>
              <UFormGroup label="Charisma (CHA)">
                <UInput v-model.number="editingPlayerStats.abilities.charisma" type="number" min="1" max="30" />
              </UFormGroup>
            </div>
          </div>

          <!-- Initiative -->
          <div>
            <UFormGroup label="Initiative Modifier">
              <UInput v-model.number="editingPlayerStats.initiative" type="number" />
            </UFormGroup>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-8">
          <UButton color="gray" variant="outline" @click="closeEditModal">
            Cancel
          </UButton>
          <UButton color="primary" @click="savePlayerStats" :disabled="!editingPlayerStats">
            Save Changes
          </UButton>
        </div>
      </div>
    </UModal>

    <!-- Player Roll Request Notification Modal -->
    <UModal v-model="showRollRequestNotification" :ui="{ width: 'max-w-md' }" :prevent-close="true">
      <div class="p-6">
        <div class="text-center">
          <div class="text-6xl mb-4">🎲</div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Roll Request from DM
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            The DM is requesting you to roll: <strong>{{ pendingRollRequest?.diceType }}</strong>
          </p>
          
          <div v-if="pendingRollRequest?.message" class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
            <p class="text-sm text-blue-900 dark:text-blue-100">
              "{{ pendingRollRequest.message }}"
            </p>
          </div>

          <div v-if="pendingRollRequest?.modifier && pendingRollRequest.modifier !== 0" class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Modifier: {{ pendingRollRequest.modifier > 0 ? '+' : '' }}{{ pendingRollRequest.modifier }}
          </div>

          <div class="flex justify-center space-x-3">
            <UButton color="gray" variant="outline" @click="declineRollRequest">
              Decline
            </UButton>
            <UButton color="primary" @click="acceptRollRequest" icon="i-heroicons-cube">
              Roll {{ pendingRollRequest?.diceType }}
            </UButton>
          </div>
        </div>
      </div>
    </UModal>

    <!-- Add Enemy Modal -->
    <UModal v-model="showAddEnemyModal" :ui="{ width: 'max-w-md' }">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          👹 Add Enemy
        </h3>
        
        <div class="space-y-4">
          <UFormGroup label="Enemy Name" required>
            <UInput v-model="newEnemy.name" placeholder="Goblin, Orc, Dragon..." />
          </UFormGroup>
          
          <UFormGroup label="Hit Points" required>
            <UInput v-model.number="newEnemy.hitPoints" type="number" min="1" placeholder="10" />
          </UFormGroup>
          
          <UFormGroup label="Armor Class">
            <UInput v-model.number="newEnemy.armorClass" type="number" min="1" placeholder="10" />
          </UFormGroup>
          
          <UFormGroup label="Initiative Modifier">
            <UInput v-model.number="newEnemy.initiative" type="number" placeholder="0" />
          </UFormGroup>
          
          <div class="flex justify-end space-x-3 mt-6">
            <UButton color="gray" variant="outline" @click="showAddEnemyModal = false">
              Cancel
            </UButton>
            <UButton color="green" @click="addEnemy" :disabled="!newEnemy.name || !newEnemy.hitPoints">
              Add Enemy
            </UButton>
          </div>
        </div>
      </div>
    </UModal>

    <!-- Special Abilities Modal -->
    <SpecialAbilitiesModal
      v-model="showSpecialAbilitiesModal"
      :character-name="currentPlayerName"
      :special-abilities="currentPlayerAbilities"
      @roll-ability="handleRollAbility"
      @use-ability="handleUseAbility"
    />
  </div>
</template>

<script setup lang="ts">
// SSE-based dice room implementation (replaces Socket.IO)

interface DiceType {
  type: string
  name: string
  sides: number
  color: string
  bgColor: string
  symbol: string
}

interface DiceRoll {
  id: string
  userName: string
  userId: string
  timestamp: Date
  description: string
  total: number
  details: (string | number)[]
  diceRolled: { type: string; count: number; results: number[] }[]
  modifier: number
  rollType: string
  isCritical: boolean
  criticalType?: 'success' | 'failure'
  isOwn: boolean
}

interface PlayerStats {
  hitPoints: { current: number; max: number }
  armorClass: number
  abilities: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  level: number
  proficiencyBonus: number
  initiative: number
  speed: number
}

interface Player {
  userId: string
  name: string
  stats: PlayerStats
}

interface QuickRoll {
  label: string
  dice: Record<string, number>
  modifier?: number
}

// Get authenticated user
const user = useState<any>('user')

// Reactive state
const userRole = ref<'Player' | 'DM'>('Player')
const isConnected = ref(false)
const isOfflineMode = ref(false)
const isOfflineModePreference = ref(false) // Persistent offline mode preference
const connectedUsers = ref(1)
const isRolling = ref(false)
const eventSource = ref<EventSource | null>(null)
const animatingDice = ref<Set<string>>(new Set())

// Sidebar state
const isLeftSidebarOpen = ref(false)
const isRightSidebarOpen = ref(false)

// Legacy compatibility - for existing sidebar references
const isSidebarOpen = computed(() => isLeftSidebarOpen.value || isRightSidebarOpen.value)

// User character data and role detection
const userCharacters = ref<any[]>([])
const activeCharacterId = ref<string | null>(null)
const isRefreshingUserData = ref(false)

// Room management state
const currentRoom = ref<{ name: string; code: string; isOwner: boolean } | null>(null)
const showCreateRoom = ref(false)
const joinRoomCode = ref('')

// Player stats (for current user if they're a player)
const playerStats = ref<PlayerStats | null>(null)

// All players stats (for DMs)
const allPlayers = ref<Player[]>([])

// DM editing modal state
const isEditingPlayer = ref(false)
const editingPlayer = ref<Player | null>(null)
const editingPlayerStats = ref<PlayerStats | null>(null)

// Battle mode state
const battleMode = ref<any>(null)
const isInBattle = computed(() => battleMode.value?.phase !== undefined)
const showBattleUI = ref(false)
const showAddEnemyModal = ref(false)
const newEnemy = ref({ name: '', hitPoints: 10, armorClass: 10, initiative: 0 })
const isBattleLoading = ref(false)
const showSpecialAbilitiesModal = ref(false)
const currentPlayerAbilities = ref<any[]>([])
const currentPlayerName = ref('')

// Music system state
const musicState = ref({
  isPlaying: false,
  currentTrack: null as any,
  volume: 50,
  playlist: [] as any[]
})
const newTrackUrl = ref('')
const isAddingTrack = ref(false)

// YouTube Player state
const youtubePlayer = ref<any>(null)
const isYouTubeAPIReady = ref(false)
const currentVideoId = ref<string | null>(null)

// Fade transition configuration
const fadeConfig = ref({
  trackTransition: 500,  // ms for track switching fade
  volumeChange: 300,     // ms for volume change fade
  playPause: 400,        // ms for play/pause fade
  enabled: true          // global fade enable/disable
})

// Dice selection
const selectedDice = ref<Record<string, number>>({
  d4: 0,
  d6: 0,
  d8: 0,
  d10: 0,
  d12: 0,
  d20: 0,
  d36: 0,
  d100: 0
})

const modifier = ref(0)
const rollType = ref('normal')

// Roll history
const rollHistory = ref<DiceRoll[]>([])

// Roll request system
const showRollRequestModal = ref(false)
const selectedPlayerForRequest = ref<Player | null>(null)
const requestedDiceType = ref<string>('')
const rollRequestMessage = ref('')
const rollRequestModifier = ref(0)

// Player roll request notification
const showRollRequestNotification = ref(false)
const pendingRollRequest = ref<{
  fromDM: string
  diceType: string
  message?: string
  modifier?: number
  requestId: string
} | null>(null)

// Constants
const diceTypes: DiceType[] = [
  { type: 'd4', name: 'D4', sides: 4, color: 'text-blue-600', bgColor: 'bg-blue-100 border-blue-300 hover:bg-blue-200', symbol: '◆' },
  { type: 'd6', name: 'D6', sides: 6, color: 'text-green-600', bgColor: 'bg-green-100 border-green-300 hover:bg-green-200', symbol: '⬛' },
  { type: 'd8', name: 'D8', sides: 8, color: 'text-purple-600', bgColor: 'bg-purple-100 border-purple-300 hover:bg-purple-200', symbol: '♦' },
  { type: 'd10', name: 'D10', sides: 10, color: 'text-pink-600', bgColor: 'bg-pink-100 border-pink-300 hover:bg-pink-200', symbol: '🔟' },
  { type: 'd12', name: 'D12', sides: 12, color: 'text-red-600', bgColor: 'bg-red-100 border-red-300 hover:bg-red-200', symbol: '◇' },
  { type: 'd20', name: 'D20', sides: 20, color: 'text-orange-600', bgColor: 'bg-orange-100 border-orange-300 hover:bg-orange-200', symbol: '●' },
  { type: 'd36', name: 'D36', sides: 36, color: 'text-cyan-600', bgColor: 'bg-cyan-100 border-cyan-300 hover:bg-cyan-200', symbol: '◯' },
  { type: 'd100', name: 'D100', sides: 100, color: 'text-green-600', bgColor: 'bg-green-100 border-green-300 hover:bg-green-200', symbol: '💯' }
]

const rollTypeOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Advantage', value: 'advantage' },
  { label: 'Disadvantage', value: 'disadvantage' }
]

const quickRolls: QuickRoll[] = [
  { label: 'Attack', dice: { d20: 1 } },
  { label: 'Damage', dice: { d8: 1 } },
  { label: 'Initiative', dice: { d20: 1 } },
  { label: 'Skill Check', dice: { d20: 1 } },
  { label: 'Saving Throw', dice: { d20: 1 } },
  { label: '2d6', dice: { d6: 2 } },
  { label: '3d6', dice: { d6: 3 } },
  { label: '4d6', dice: { d6: 4 } },
  { label: 'd36 Roll', dice: { d36: 1 } }
]

// Computed properties
const totalDiceSelected = computed(() => {
  return Object.values(selectedDice.value).reduce((sum, count) => sum + count, 0)
})

const userRollCount = computed(() => {
  return rollHistory.value.filter(roll => roll.isOwn).length
})

const highestRoll = computed(() => {
  const totals = rollHistory.value.map(roll => roll.total)
  return totals.length > 0 ? Math.max(...totals) : null
})

const criticalHits = computed(() => {
  return rollHistory.value.filter(roll => roll.isCritical && roll.criticalType === 'success').length
})

// Computed properties for user info
const userName = computed(() => user.value?.username || 'Anonymous')
const userId = computed(() => user.value?.id || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`)
const userInitials = computed(() => user.value?.username?.charAt(0)?.toUpperCase() || 'A')
const userEmail = computed(() => user.value?.email || '')

// User role and character management functions
async function loadUserCharacters() {
  if (!user.value?.id) {
    userCharacters.value = []
    userRole.value = 'DM'
    return
  }

  try {
    const response = await $fetch<{ success: boolean, data: any[] }>(`/api/characters?player=${user.value.id}`)
    if (response.success && Array.isArray(response.data)) {
      userCharacters.value = response.data
      // Auto-detect role based on characters
      if (userCharacters.value.length > 0) {
        userRole.value = 'Player'
        // If no active character is selected, select the first one
        if (!activeCharacterId.value && userCharacters.value.length > 0) {
          activeCharacterId.value = userCharacters.value[0].id
          await loadCharacterStats()
        }
      } else {
        userRole.value = 'DM'
        playerStats.value = null
        activeCharacterId.value = null
      }

      console.log(`🎭 Auto-detected role: ${userRole.value} (${userCharacters.value.length} characters found)`)
    } else {
      console.warn('Invalid response format from characters API:', response)
      userCharacters.value = []
      userRole.value = 'DM'
    }
  } catch (error) {
    console.error('Failed to load user characters:', error)
    userCharacters.value = []
    userRole.value = 'DM' // Default to DM if we can't load characters

    // User-friendly error message if this is not just a 404 (no characters found)
    if (error.statusCode !== 404) {
      console.warn('Character loading failed - defaulting to DM role due to connection issue')
    }
  }


}

async function loadCharacterStats() {
  if (!activeCharacterId.value || userRole.value !== 'Player') {
    playerStats.value = null
    return
  }

  try {
    const character = userCharacters.value.find(c => c.id === activeCharacterId.value)
    if (character) {
      // Convert character data to player stats format using REAL character data
      const realStats = {
        hitPoints: {
          current: character.currentHp || character.maxHp || 10,
          max: character.maxHp || 10
        },
        armorClass: character.armorClass || 10,
        abilities: {
          // Use raw ability scores from the character data
          strength: character.strength || 10,
          dexterity: character.dexterity || 10,
          constitution: character.constitution || 10,
          intelligence: character.intelligence || 10,
          wisdom: character.wisdom || 10,
          charisma: character.charisma || 10
        },
        level: character.classLevel || 1,
        proficiencyBonus: character.proficiencyBonus || Math.ceil(character.classLevel / 4) + 1,
        initiative: Math.floor((character.dexterity - 10) / 2) || 0, // Calculate DEX modifier
        speed: character.speed || 30
      }

      playerStats.value = realStats
      console.log('📊 Loaded REAL character stats for:', character.characterName, realStats)
      
      // Update the dice room store with the real character stats
      if (!isOfflineMode.value) {
        await updateStats()
      }
    } else {
      console.warn('Character not found in user characters list:', activeCharacterId.value)
      playerStats.value = createDefaultStats()
    }
  } catch (error) {
    console.error('Failed to load character stats:', error)
    playerStats.value = createDefaultStats()
  }
}

async function refreshUserData() {
  isRefreshingUserData.value = true
  try {
    await loadUserCharacters()

    // Update rond stats based on new data
    if (userRole.value === 'Player') {
      await loadPlayerStats(currentRoom.value?.code || 'default')
    } else {
      await loadAllPlayersStats(currentRoom.value?.code || 'default')
    }

    // Re-join room  updated role
    if (isConnected.value && !isOfflineMode.value) {
      await joinRoom(currentRoom.value?.code || 'default')
    }
  } catch (error) {
    console.error('Failed to refresh user data:', error)
  } finally {
    isRefreshingUserData.value = false
  }
}

async function onActiveCharacterChange() {
  if (activeCharacterId.value) {
    await loadCharacterStats()
    if (!isOfflineMode.value) {
      await updateStats()
    }
  }
}

function getBadgeColor(diceType: string): string {
  const colorMap: Record<string, string> = {
    'd4': 'bg-blue-600',
    'd6': 'bg-green-600', 
    'd8': 'bg-purple-600',
    'd10': 'bg-pink-600',
    'd12': 'bg-red-600',
    'd20': 'bg-orange-600',
    'd36': 'bg-cyan-600',
    'd100': 'bg-green-600'
  }
  return colorMap[diceType] || 'bg-gray-600'
}

function getBattlePhaseColor(phase: string): string {
  const colorMap: Record<string, string> = {
    'setup': 'blue',
    'rolling_initiative': 'yellow', 
    'combat': 'red',
    'ended': 'gray'
  }
  return colorMap[phase] || 'gray'
}

function getBattlePhaseLabel(phase: string): string {
  const labelMap: Record<string, string> = {
    'setup': 'Setup Phase',
    'rolling_initiative': 'Rolling Initiative',
    'combat': 'Active Combat',
    'ended': 'Battle Ended'
  }
  return labelMap[phase] || 'Unknown Phase'
}

function toggleDice(diceType: string) {
  // Add animation
  animatingDice.value.add(diceType)
  setTimeout(() => {
    animatingDice.value.delete(diceType)
  }, 500)

  // Update dice count
  if (selectedDice.value[diceType] < 10) {
    selectedDice.value[diceType]++
  } else {
    selectedDice.value[diceType] = 0
  }
}

function clearSelection() {
  Object.keys(selectedDice.value).forEach(key => {
    selectedDice.value[key] = 0
  })
  modifier.value = 0
  rollType.value = 'normal'
}

function rollSingleDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

async function rollDice() {
  if (totalDiceSelected.value === 0) return

  isRolling.value = true

// Add dramatic animation  all selected dice
  Object.entries(selectedDice.value).forEach(([diceType, count]) => {
    if (count > 0) {
      animatingDice.value.add(diceType)
    }
  })

  // Simulate rolling animation delay with staggered effects
  setTimeout(async () => {
    const diceRolled: { type: string; count: number; results: number[] }[] = []
    let total = 0
    const details: (string | number)[] = []

    // Roll each type of dice
    for (const [diceType, count] of Object.entries(selectedDice.value)) {
      if (count > 0) {
        const dice = diceTypes.find(d => d.type === diceType)!
        const results: number[] = []

        for (let i = 0; i < count; i++) {
          let roll = rollSingleDie(dice.sides)

          // Handle advantage/disadvantage for d20s
          if (diceType === 'd20' && rollType.value !== 'normal') {
            const secondRoll = rollSingleDie(dice.sides)
            if (rollType.value === 'advantage') {
              roll = Math.max(roll, secondRoll)
            } else {
              roll = Math.min(roll, secondRoll)
            }
          }

          results.push(roll)
          total += roll
        }

        diceRolled.push({
          type: diceType,
          count,
          results
        })

        details.push(`${count}${diceType}=${results.join(',')}`)
      }
    }

    // Add modifier
    if (modifier.value !== 0) {
      total += modifier.value
      details.push(modifier.value)
    }

    // Check for criticals (only on single d20 rolls)
    let isCritical = false
    let criticalType: 'success' | 'failure' | undefined

    const d20Results = diceRolled.find(d => d.type === 'd20')
    if (d20Results && d20Results.count === 1) {
      const roll = d20Results.results[0]
      if (roll === 20) {
        isCritical = true
        criticalType = 'success'
      } else if (roll === 1) {
        isCritical = true
        criticalType = 'failure'
      }
    }

    // Check for d36 special values
    const d36Results = diceRolled.find(d => d.type === 'd36')
    if (d36Results && d36Results.count === 1) {
      const roll = d36Results.results[0]
      if (roll === 36) {
        isCritical = true
        criticalType = 'success'
      } else if (roll === 1) {
        isCritical = true
        criticalType = 'failure'
      }
    }

    // Create roll description
    const diceDesc = Object.entries(selectedDice.value)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => `${count}${type}`)
      .join(' + ')

    let description = diceDesc
    if (modifier.value !== 0) {
      description += ` ${modifier.value > 0 ? '+' : ''}${modifier.value}`
    }
    if (rollType.value !== 'normal') {
      description += ` (${rollType.value})`
    }

    const roll: DiceRoll = {
      id: Date.now().toString(),
      userName: userName.value || 'Anonymous',
      userId: 'local-user',
      timestamp: new Date(),
      description,
      total,
      details,
      diceRolled,
      modifier: modifier.value,
      rollType: rollType.value,
      isCritical,
      criticalType,
      isOwn: true
    }

    // Add to history (newest first)
    rollHistory.value.unshift(roll)

    // Submit to server for other s (only if connected and not in offline mode)
    if (isConnected.value && !isOfflineMode.value) {
      try {
        await submitDiceRoll({
          userName: roll.userName,
          userId: roll.userId,
          description: roll.description,
          total: roll.total,
          details: roll.details,
          diceRolled: roll.diceRolled,
          modifier: roll.modifier,
          rollType: roll.rollType,
          isCritical: roll.isCritical,
          criticalType: roll.criticalType
        })
      } catch (error) {
        console.error('🎲 Failed to submit roll to server:', error)
        // Roll still works locally even if server submission fails
      }
    }

    // Clear animations
    animatingDice.value.clear()
    isRolling.value = false
  }, 1500) // Longer animation framatic effect
}

function performQuickRoll(quickRoll: QuickRoll) {
  // Clear current selection
  clearSelection()

  // Set dice for quick roll
  Object.assign(selectedDice.value, quickRoll.dice)
  if (quickRoll.modifier) {
    modifier.value = quickRoll.modifier
  }

  // Roll immediately
  rollDice()
}

async function updateUserName() {
  if (userName.value.trim()) {
    // Load characters for the new user name and auto-detect role
    await loadUserCharacters()

    if (isConnected.value && !isOfflineMode.value) {
      try {
        await joinRoom(currentRoom.value?.code || 'default') // Re-join with updated name and role
        console.log('Updated user name to:', userName.value)
      } catch (error) {
        console.error('Failed to update user name:', error)
        console.log('Updated user name to:', userName.value, '(locally only)')
      }
    } else {
      console.log('Updated user name to:', userName.value, '(offline mode)')
    }
  }
}



function createDefaultStats(): PlayerStats {
  return {
    hitPoints: { current: 10, max: 10 },
    armorClass: 10,
    abilities: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    level: 1,
    proficiencyBonus: 2,
    initiative: 0,
    speed: 30
  }
}

async function updateStats() {
  if (isOfflineMode.value || !playerStats.value) return

  try {
    await $fetch(`/api/dice/stats/${userId.value}`, {
      method: 'POST',
      body: {
        modifierUserId: userId.value,
        stats: playerStats.value,
        roomCode: currentRoom.value?.code || 'default'
      }
    })
    console.log('Stats updated successfully')
  } catch (error) {
    console.error('Failed to update stats:', error)
  }
}

async function loadPlayerStats(roomCode: string = 'default') {
  if (isOfflineMode.value) {
    // In offline mode, load character stats directly from the character data
    await loadCharacterStats()
    return
  }

  // First try to load the character stats directly if we have an active character
  if (activeCharacterId.value && userRole.value === 'Player') {
    await loadCharacterStats()
    return
  }

  // Fallback to dice room store stats (this was the old behavior)
  try {
    const response = await $fetch(`/api/dice/stats/${userId.value}?viewerUserId=${userId.value}&roomCode=${roomCode}`)
    if (response.success) {
      playerStats.value = response.stats
    }
  } catch (error) {
    console.error('Failed to load player stats from store:', error)
    // Create default stats if none exist
    playerStats.value = createDefaultStats()
  }
}

async function loadAllPlayersStats(roomCode: string = 'default') {
  if (isOfflineMode.value || userRole.value !== 'DM') return

  try {
    const response = await $fetch(`/api/dice/stats?viewerUserId=${userId.value}&roomCode=${roomCode}`)
    if (response.success) {
      allPlayers.value = response.players
    }
  } catch (error) {
    console.error('Failed to load all player stats:', error)
    allPlayers.value = []
  }
}

function resetStats() {
  if (userRole.value === 'Player') {
    playerStats.value = createDefaultStats()
    updateStats()
  }
}

function editPlayerStats(player: Player) {
  editingPlayer.value = player
  // Create a deep copy for editing
  editingPlayerStats.value = JSON.parse(JSON.stringify(player.stats))
  isEditingPlayer.value = true
}

async function savePlayerStats() {
  if (!editingPlayer.value || !editingPlayerStats.value) return

  try {
    await $fetch(`/api/dice/stats/${editingPlayer.value.userId}`, {
      method: 'POST',
      body: {
        modifierUserId: userId.value,
        stats: editingPlayerStats.value,
        roomCode: currentRoom.value?.code || 'default'
      }
    })

    // Update local state
    const playerIndex = allPlayers.value.findIndex(p => p.userId === editingPlayer.value!.userId)
    if (playerIndex !== -1) {
      allPlayers.value[playerIndex].stats = editingPlayerStats.value
    }

    console.log('Player stats updated successfully')
    closeEditModal()
  } catch (error) {
    console.error('Failed to update player stats:', error)
  }
}

function closeEditModal() {
  isEditingPlayer.value = false
  editingPlayer.value = null
  editingPlayerStats.value = null
}

function clearHistory() {
  rollHistory.value = []
}

// Roll request functions (DM side)
function requestRollFromPlayer(player: Player) {
  selectedPlayerForRequest.value = player
  requestedDiceType.value = ''
  rollRequestMessage.value = ''
  rollRequestModifier.value = 0
  showRollRequestModal.value = true
}

function closeRollRequestModal() {
  showRollRequestModal.value = false
  selectedPlayerForRequest.value = null
  requestedDiceType.value = ''
  rollRequestMessage.value = ''
  rollRequestModifier.value = 0
}

async function sendRollRequest() {
  if (!selectedPlayerForRequest.value || !requestedDiceType.value) return

  try {
    const response = await $fetch('/api/dice/request-roll', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value?.code || 'default',
        targetUserId: selectedPlayerForRequest.value.userId,
        diceType: requestedDiceType.value,
        message: rollRequestMessage.value || undefined,
        modifier: rollRequestModifier.value || undefined
      }
    })

    if (response.success) {
      closeRollRequestModal()
      // Show success message
      showToast(`Roll request sent to ${selectedPlayerForRequest.value.name}`, 'success')
    }
  } catch (error) {
    console.error('Error sending roll request:', error)
    showToast('Failed to send roll request', 'error')
  }
}

// Roll request functions (Player side)
function acceptRollRequest() {
  if (!pendingRollRequest.value) return

  const diceType = pendingRollRequest.value.diceType
  const requestModifier = pendingRollRequest.value.modifier || 0

  // Close the notification
  showRollRequestNotification.value = false
  
  // Set up the dice selection
  selectedDice.value = { [diceType]: 1 }
  modifier.value = requestModifier

  // Automatically roll the dice
  rollDice()

  // Clear the pending request
  pendingRollRequest.value = null
}

function declineRollRequest() {
  showRollRequestNotification.value = false
  pendingRollRequest.value = null
}

// Helper function for showing toast notifications
function showToast(message: string, type: 'success' | 'error' = 'success') {
  // You can implement this with your preferred toast library
  // For now, we'll use a simple alert
  console.log(`${type.toUpperCase()}: ${message}`)
}

function formatTime(timestamp: Date): string {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  }).format(timestamp)
}

function getCriticalClass(roll: DiceRoll): string {
  if (roll.isCritical) {
    return roll.criticalType === 'success'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'
  }
  return 'text-gray-900 dark:text-white'
}

// Room Maagement Functions
async function createRoom(){
  if (!userName.value.trim()) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Please enter your name before creating a room.',
      color: 'red'
    })
    return
  }

  try {
    const response = await $fetch('/api/dice/rooms/create', {
      method: 'POST',
      body: {
        userId: userId.value,
        userName: userName.value,
        roomName: `${userName.value || 'Anonymous'}'s Room`
      }
    })

    if (response.success) {
      currentRoom.value = {
        name: response.room.name,
        code: response.room.code,
        isOwner: true
      }
      console.log('🏠 Created room:', response.room.code)
      showCreateRoom.value = false

      // Show success notification
      const toast = useToast()
      toast.add({
        title: 'Room Created',
        description: `Room ${response.room.code} created successfully`,
        color: 'green'
      })

      // Reconnect SSE with room code
      await reconnectWithRoom(response.room.code)
    }
  } catch (error) {
    console.error('🏠 Failed to create room:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to create room. Please try again.',
      color: 'red'
    })
  }
}

async function joinExistingRoom() {
  if (!joinRoomCode.value.trim()) return

  try {
    const response = await $fetch('/api/dice/rooms/join', {
      method: 'POST',
      body: {
        userId: userId.value,
        userName: userName.value,
        roomCode: joinRoomCode.value.trim().toUpperCase()
      }
    })

    if (response.success) {
      currentRoom.value = {
        name: response.room.name,
        code: response.room.code,
        isOwner: false
      }
      console.log('🏠 Joined room:', response.room.code)
      joinRoomCode.value = ''

      // Show success notification
      const toast = useToast()
      toast.add({
        title: 'Joined Room',
        description: `Successfully joined room ${response.room.code}`,
        color: 'green'
      })

      // Reconnect SSE with room code
      await reconnectWithRoom(response.room.code)
    }
  } catch (error) {
    console.error('🏠 Failed to join room:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to join room. Please check the room code and try again.',
      color: 'red'
    })
  }
}

async function leaveRoom() {
  if (!currentRoom.value) return

  try {
    await $fetch('/api/dice/leave', {
      method: 'POST',
      body: {
        userId: userId.value,
        roomCode: currentRoom.value.code
      }
    })
    console.log('🏠 Left room:', currentRoom.value.code)
    currentRoom.value = null

    // Show success notification
    const toast = useToast()
    toast.add({
      title: 'Left Room',
      description: 'You have successfully left the room',
      color: 'green'
    })

    // Reconnect to default room
    await reconnectWithRoom('default')
  } catch (error) {
    console.error('🏠 Failed to leave room:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to leave room. Please try again.',
      color: 'red'
    })
  }
}

async function copyRoomCode() {
  if (!currentRoom.value || currentRoom.value.code === 'default') return

  try {
    await navigator.clipboard.writeText(currentRoom.value.code)
    const toast = useToast()
    toast.add({
      title: 'Room Code Copied',
      description: `Room code ${currentRoom.value.code} copied to clipboard`,
      color: 'green'
    })
  } catch (error) {
    console.error('Failed to copy room code:', error)
    // Fallback for older browsers or when clipboard API fails
    try {
      const textArea = document.createElement('textarea')
      textArea.value = currentRoom.value.code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      const toast = useToast()
      toast.add({
        title: 'Room Code Copied',
        description: `Room code ${currentRoom.value.code} copied to clipboard`,
        color: 'green'
      })
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError)
      const toast = useToast()
      toast.add({
        title: 'Copy Failed',
        description: 'Failed to copy room code. Please copy manually.',
        color: 'red'
      })
    }
  }
}

async function kickPlayer(player: Player) {
  if (!currentRoom.value || userRole.value !== 'DM') return

  try {
    await $fetch('/api/dice/kick', {
      method: 'POST',
      body: {
        dmUserId: userId.value,
        targetUserId: player.userId,
        roomCode: currentRoom.value.code
      }
    })

    console.log('🏠 Kicked player:', player.name)

    // Remove from local list
    allPlayers.value = allPlayers.value.filter(p => p.userId !== player.userId)
  } catch (error) { 
    console.error('🏠 Failed to kick player:', error)
  }
}

async function reconnectWithRoom(roomCode: string) {
  // Close existing SSE connection
  disconnectSSE()

  // Clear state
  rollHistory.value = []
  allPlayers.value = []

  // Reinitialize with room code
  setTimeout(() => {
    initializeSSE(roomCode)
  }, 100)
}

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' || typeof window !== 'undefined' && window.location.hostname !== 'localhost'

// SSE Functions - Server-Sent Events for real-time updates
function initializeSSE(roomCode: string = 'default') {
  // Check if user has explicitly chosen offline mode
  if (isOfflineModePreference.value) {
    console.log('🎲 Staying in offline mode per user preference')
    isConnected.value = false
    isOfflineMode.value = true
    connectedUsers.value = 1
    return
  }

  // Always try SSE first (works in all environments)
  console.log('🎲 Initializing SSE connection for real-time dice room, room:', roomCode)

  try {
    // Create SSE connection with room code
    const sseUrl = `/api/dice/events?userId=${encodeURIComponent(userId.value)}&userName=${encodeURIComponent(userName.value)}&role=${encodeURIComponent(userRole.value)}&roomCode=${encodeURIComponent(roomCode)}`
    eventSource.value = new EventSource(sseUrl)

    // Connection events
    eventSource.value.onopen = () => {
      console.log('🎲 SSE connection established')
      isConnected.value = true
      isOfflineMode.value = false

      // Send join request via HTTP
      joinRoom(roomCode)
    }

    eventSource.value.onerror = (error) => {
      console.error('🎲 SSE connection error:', error)
      console.log('🎲 Fallback to offline mode')
      isConnected.value = false
      isOfflineMode.value = true
      connectedUsers.value = 1
    }

    // Handle specific events
    eventSource.value.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data)
      console.log('🎲 SSE connected with ID:', data.connectionId)
    })

    eventSource.value.addEventListener('users:count', (event) => {
      const data = JSON.parse(event.data)
      connectedUsers.value = data.count
    })

    eventSource.value.addEventListener('dice:history', (event) => {
      const data = JSON.parse(event.data)
      // Merge with existing history, avoiding duplicates
      const existingIds = new Set(rollHistory.value.map(r => r.id))
      const newRolls = data.history
        .filter((r: DiceRoll) => !existingIds.has(r.id))
        .map((r: DiceRoll) => ({
          ...r,
          timestamp: new Date(r.timestamp),
          isOwn: r.userId === userId.value
        }))

      rollHistory.value = [...rollHistory.value, ...newRolls]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    })

    eventSource.value.addEventListener('dice:roll', (event) => {
      const data = JSON.parse(event.data)
      const roll = data as DiceRoll

      // Only add rolls from other users
      if (roll.userId !== userId.value) {
        const processedRoll = {
          ...roll,
          timestamp: new Date(roll.timestamp),
          isOwn: false
        }

        rollHistory.value.unshift(processedRoll)
      }
    })

    eventSource.value.addEventListener('heartbeat', (event) => {
      const data = JSON.parse(event.data)
      // Optional: Update user count from heartbeat
      if (data.userCount) {
        connectedUsers.value = data.userCount
      }
    })

    // Handle role and stats events
    eventSource.value.addEventListener('user:role', (event) => {
      const data = JSON.parse(event.data)
      console.log('🎲 Received role:', data.role)
    })

    eventSource.value.addEventListener('user:stats', (event) => {
      const data = JSON.parse(event.data)
      if (userRole.value === 'Player') {
        playerStats.value = data.stats
        console.log('🎲 Received player stats')
      }
    })

    eventSource.value.addEventListener('players:stats', (event) => {
      const data = JSON.parse(event.data)
      if (userRole.value === 'DM') {
        allPlayers.value = data.players
        console.log('🎲 Received all player stats')
      }
    })

    eventSource.value.addEventListener('stats:updated', (event) => {
      const data = JSON.parse(event.data)
      // Update stats for specific player
      if (userRole.value === 'DM') {
        const playerIndex = allPlayers.value.findIndex(p => p.userId === data.userId)
        if (playerIndex !== -1) {
          allPlayers.value[playerIndex].stats = data.stats
        }
      } else if (data.userId === userId.value) {
        playerStats.value = data.stats
      }
      console.log('🎲 Stats updated for user:', data.userId)
    })

    eventSource.value.addEventListener('dice:request', (event) => {
      const data = JSON.parse(event.data)
      // Only show notification to the target player
      if (data.targetUserId === userId.value) {
        pendingRollRequest.value = {
          fromDM: data.fromDM,
          diceType: data.diceType,
          message: data.message,
          modifier: data.modifier,
          requestId: data.requestId
        }
        showRollRequestNotification.value = true
        console.log('🎲 Received roll request from DM:', data)
      }
    })

    // Battle Mode Events
    eventSource.value.addEventListener('battle:started', (event) => {
      const data = JSON.parse(event.data)
      battleMode.value = data.battleState
      console.log('⚔️ Battle mode started by DM:', data)
      
      const toast = useToast()
      toast.add({
        title: 'Battle Started',
        description: 'The DM has started battle mode',
        color: 'green'
      })
    })

    eventSource.value.addEventListener('battle:ended', (event) => {
      const data = JSON.parse(event.data)
      battleMode.value = null
      console.log('⚔️ Battle mode ended by DM:', data)
      
      const toast = useToast()
      toast.add({
        title: 'Battle Ended',
        description: 'The DM has ended battle mode',
        color: 'blue'
      })
    })

    eventSource.value.addEventListener('battle:enemy_added', (event) => {
      const data = JSON.parse(event.data)
      if (battleMode.value && battleMode.value.enemies) {
        battleMode.value.enemies[data.enemy.id] = data.enemy
      }
      console.log('👹 Enemy added to battle:', data.enemy)
      
      if (userRole.value === 'Player') {
        const toast = useToast()
        toast.add({
          title: 'Enemy Added',
          description: `${data.enemy.name} has entered the battle`,
          color: 'orange'
        })
      }
    })

    eventSource.value.addEventListener('battle:enemy_removed', (event) => {
      const data = JSON.parse(event.data)
      if (battleMode.value && battleMode.value.enemies) {
        delete battleMode.value.enemies[data.enemyId]
      }
      console.log('👹 Enemy removed from battle:', data.enemyId)
      
      if (userRole.value === 'Player') {
        const toast = useToast()
        toast.add({
          title: 'Enemy Defeated',
          description: 'An enemy has been removed from battle',
          color: 'green'
        })
      }
    })

    eventSource.value.addEventListener('battle:initiative_rolled', (event) => {
      const data = JSON.parse(event.data)
      if (battleMode.value) {
        battleMode.value.initiativeOrder = data.participants
        battleMode.value.phase = 'combat'
        battleMode.value.currentTurnIndex = 0
      }
      console.log('🎲 Initiative rolled:', data.participants)
      
      const toast = useToast()
      toast.add({
        title: 'Initiative Rolled',
        description: 'Initiative has been rolled for all participants',
        color: 'blue'
      })
    })

    eventSource.value.addEventListener('battle:turn_changed', (event) => {
      const data = JSON.parse(event.data)
      if (battleMode.value) {
        battleMode.value.currentTurnIndex = data.currentTurnIndex
      }
      console.log('🔄 Turn changed:', data)
      
      const currentParticipant = battleMode.value?.initiativeOrder?.[data.currentTurnIndex]
      if (currentParticipant) {
        const toast = useToast()
        toast.add({
          title: 'Next Turn',
          description: `It's now ${currentParticipant.name}'s turn`,
          color: 'green'
        })

        // Check if it's the current user's turn and they're a player
        if (currentParticipant.type === 'player' && currentParticipant.userId === userId.value) {
          // Load special abilities for this character and show modal
          loadPlayerSpecialAbilities(currentParticipant)
        }
      }
    })

    eventSource.value.addEventListener('battle:damage_dealt', (event) => {
      const data = JSON.parse(event.data)
      console.log('💥 Damage dealt:', data)
      
      // Update local battle state if target is an enemy
      if (battleMode.value && battleMode.value.enemies && data.targetId in battleMode.value.enemies) {
        const enemy = battleMode.value.enemies[data.targetId]
        enemy.hitPoints.current = data.newHitPoints
        if (data.isDefeated) {
          enemy.isDefeated = true
        }
      }
      
      const toast = useToast()
      toast.add({
        title: 'Damage Dealt',
        description: `${data.damage} damage dealt to ${data.targetName || 'target'}`,
        color: 'red'
      })
    })

    // Music event listeners for real-time synchronization
    eventSource.value.addEventListener('music:state_changed', (event) => {
      console.log('🎵 SSE: Received music:state_changed event:', event.data)
      const data = JSON.parse(event.data)

      musicState.value.isPlaying = data.isPlaying
      musicState.value.isPaused = data.isPaused
      musicState.value.currentTrack = data.currentTrack
      musicState.value.volume = data.volume

      console.log('🎵 Music state changed:', data)
      console.log('🎵 Updated local music state:', musicState.value)

      // Ensure YouTube player is initialized if we have music state
      if (data.currentTrack && !isYouTubePlayerReady()) {
        console.log('🎵 SSE: Initializing YouTube player for music sync')
        initializeYouTubePlayer()
      }

      // Sync player with new state
      if (isYouTubePlayerReady()) {
        console.log('🎵 SSE: Syncing YouTube player with new state')
        syncPlayerWithMusicState()
      } else {
        console.log('🎵 SSE: YouTube player not ready, cannot sync')
      }
      
      const toast = useToast()
      if (data.isPlaying && data.currentTrack) {
        toast.add({
          title: 'Now Playing',
          description: `🎵 ${data.currentTrack.title}`,
          color: 'green'
        })
      } else if (data.isPaused) {
        toast.add({
          title: 'Music Paused',
          description: '⏸️ Playback paused',
          color: 'yellow'
        })
      }
    })

    eventSource.value.addEventListener('music:playlist_updated', (event) => {
      const data = JSON.parse(event.data)
      musicState.value.playlist = data.playlist
      console.log('🎵 Playlist updated:', data.playlist)
      
      const toast = useToast()
      toast.add({
        title: 'Playlist Updated',
        description: `📋 Playlist now has ${data.playlist.length} tracks`,
        color: 'blue'
      })
    })

    eventSource.value.addEventListener('music:track_added', (event) => {
      console.log('🎵 SSE: Received music:track_added event:', event.data)
      const data = JSON.parse(event.data)

      musicState.value.playlist.push(data.track)
      console.log('🎵 Track added to playlist:', data.track)
      console.log('🎵 Updated playlist:', musicState.value.playlist)

      // Ensure YouTube player is initialized if this is the first track
      if (musicState.value.playlist.length === 1 && !isYouTubePlayerReady()) {
        console.log('🎵 SSE: Initializing YouTube player for first track')
        initializeYouTubePlayer()
      }

      const toast = useToast()
      toast.add({
        title: 'Track Added',
        description: `🎵 ${data.track.title} added to playlist`,
        color: 'green'
      })
    })

    eventSource.value.addEventListener('music:playback_changed', (event) => {
      console.log('🎵 SSE: Received music:playback_changed event:', event.data)
      const data = JSON.parse(event.data)

      musicState.value.currentTrack = data.currentTrack
      musicState.value.isPlaying = data.isPlaying
      musicState.value.position = data.position
      musicState.value.volume = data.volume
      fadeTransition.value.isActive = data.fadeTransition || false

      console.log('🎵 Playback changed:', data)

      // Ensure YouTube player is initialized if we have a track
      if (data.currentTrack && !isYouTubePlayerReady()) {
        console.log('🎵 SSE: Initializing YouTube player for playback')
        initializeYouTubePlayer()
      }

      // Sync player with new state
      if (isYouTubePlayerReady()) {
        console.log('🎵 SSE: Syncing YouTube player with playback change')
        syncPlayerWithMusicState()
      } else {
        console.log('🎵 SSE: YouTube player not ready for playback sync')
      }

      const toast = useToast()
      if (data.isPlaying && data.currentTrack) {
        toast.add({
          title: 'Now Playing',
          description: `🎵 ${data.currentTrack.title}`,
          color: 'green'
        })
      } else if (!data.isPlaying && data.currentTrack) {
        toast.add({
          title: 'Music Paused',
          description: '⏸️ Playback paused',
          color: 'yellow'
        })
      }
    })

    eventSource.value.addEventListener('music:track_removed', (event) => {
      const data = JSON.parse(event.data)
      musicState.value.playlist = musicState.value.playlist.filter(track => track.id !== data.trackId)
      console.log('🎵 Track removed from playlist:', data.trackId)
      
      const toast = useToast()
      toast.add({
        title: 'Track Removed',
        description: '➖ Track removed from playlist',
        color: 'orange'
      })
    })

    eventSource.value.addEventListener('music:volume_changed', (event) => {
      const data = JSON.parse(event.data)
      musicState.value.volume = data.volume
      console.log('🎵 Volume changed:', data.volume)
    })

    eventSource.value.addEventListener('music:playlist_cleared', (event) => {
      musicState.value.playlist = []
      console.log('🎵 Playlist cleared')
      
      const toast = useToast()
      toast.add({
        title: 'Playlist Cleared',
        description: '🗑️ All tracks removed from playlist',
        color: 'red'
      })
    })

  } catch (error) {
    console.error('🎲 Failed to initialize SSE:', error)
    console.log('🎲 Using offline mode')
    isOfflineMode.value = true
    isConnected.value = false
    connectedUsers.value = 1
  }
}

async function joinRoom(roomCode: string = 'default') {
  try {
    const response = await $fetch('/api/dice/join', {
      method: 'POST',
      body: {
        userId: userId.value,
        userName: userName.value,
        role: userRole.value,
        roomCode: roomCode
      }
    })

    if (response.success) {
      console.log('🎲 Successfully joined room', roomCode, 'as', userRole.value)

      // Load stats based on role
      if (userRole.value === 'Player') {
        await loadPlayerStats(roomCode)
      } else {
        await loadAllPlayersStats(roomCode)
      }
    }
  } catch (error) {
    console.error('Failed to join room:', error)
  }
}

async function submitDiceRoll(roll: Omit<DiceRoll, 'id' | 'timestamp' | 'isOwn'>) {
  try {
    const response = await $fetch('/api/dice/roll', {
      method: 'POST',
      body: {
        ...roll,
        userId: userId.value,
        userName: userName.value,
        roomCode: currentRoom.value?.code || 'default'
      }
    })

    if (response.success) {
      console.log('🎲 Roll submitted successfully')
      return response.roll
    }
  } catch (error) {
    console.error('🎲 Failed to submit roll:', error)
    throw error
  }
}

function disconnectSSE() {
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
    console.log('🎲 SSE connection closed')
  }
}

function toggleOfflineMode() {
  isOfflineModePreference.value = !isOfflineModePreference.value
  
  if (isOfflineModePreference.value) {
    // Switch to offline mode
    disconnectSSE()
    isConnected.value = false
    isOfflineMode.value = true
    connectedUsers.value = 1
    console.log('🎲 Switched to persistent offline mode')
    
    const toast = useToast()
    toast.add({
      title: 'Offline Mode',
      description: 'Switched to offline mode. Your rolls will only be stored locally.',
      color: 'yellow'
    })
  } else {
    // Switch back to online mode
    isOfflineMode.value = false
    console.log('🎲 Switching back to online mode')
    
    const toast = useToast()
    toast.add({
      title: 'Online Mode',
      description: 'Attempting to reconnect to the server...',
      color: 'blue'
    })
    
    // Reconnect with current room
    const roomCode = currentRoom.value?.code || 'default'
    initializeSSE(roomCode)
  }
}

// Battle Mode Functions
async function startBattle() {
  if (!currentRoom.value || currentRoom.value.code === 'default') return
  
  isBattleLoading.value = true
  try {
    const response = await $fetch('/api/battle/start', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code
      }
    })
    
    if (response.success) {
      battleMode.value = response.battleState
      console.log('⚔️ Battle mode started:', response.battleState)
      
      const toast = useToast()
      toast.add({
        title: 'Battle Started',
        description: 'Battle mode is now active',
        color: 'green'
      })
    }
  } catch (error) {
    console.error('Failed to start battle:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to start battle mode',
      color: 'red'
    })
  } finally {
    isBattleLoading.value = false
  }
}

async function endBattle() {
  if (!currentRoom.value || currentRoom.value.code === 'default') return
  
  isBattleLoading.value = true
  try {
    const response = await $fetch('/api/battle/end', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code
      }
    })
    
    if (response.success) {
      battleMode.value = null
      console.log('⚔️ Battle mode ended')
      
      const toast = useToast()
      toast.add({
        title: 'Battle Ended',
        description: 'Battle mode has been deactivated',
        color: 'blue'
      })
    }
  } catch (error) {
    console.error('Failed to end battle:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to end battle mode',
      color: 'red'
    })
  } finally {
    isBattleLoading.value = false
  }
}

async function addEnemy() {
  if (!newEnemy.value.name || !newEnemy.value.hitPoints || !currentRoom.value) return
  
  try {
    const response = await $fetch('/api/battle/enemy/add', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        name: newEnemy.value.name,
        hitPoints: newEnemy.value.hitPoints,
        armorClass: newEnemy.value.armorClass,
        initiative: newEnemy.value.initiative
      }
    })
    
    if (response.success) {
      console.log('👹 Enemy added:', response.enemy)
      
      // Update local state immediately for instant UI feedback
      if (battleMode.value && battleMode.value.enemies) {
        battleMode.value.enemies[response.enemy.id] = response.enemy
      }
      
      // Reset form
      newEnemy.value = { name: '', hitPoints: 10, armorClass: 10, initiative: 0 }
      showAddEnemyModal.value = false
      
      const toast = useToast()
      toast.add({
        title: 'Enemy Added',
        description: `${response.enemy.name} has been added to the battle`,
        color: 'green'
      })
    }
  } catch (error) {
    console.error('Failed to add enemy:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to add enemy to battle',
      color: 'red'
    })
  }
}

async function removeEnemy(enemyId: string) {
  if (!currentRoom.value) return
  
  try {
    const response = await $fetch('/api/battle/enemy/remove', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        enemyId: enemyId
      }
    })
    
    if (response.success) {
      console.log('👹 Enemy removed:', enemyId)
      
      // Update local state immediately for instant UI feedback
      if (battleMode.value && battleMode.value.enemies) {
        delete battleMode.value.enemies[enemyId]
      }
      
      const toast = useToast()
      toast.add({
        title: 'Enemy Removed',
        description: 'Enemy has been removed from battle',
        color: 'blue'
      })
    }
  } catch (error) {
    console.error('Failed to remove enemy:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to remove enemy from battle',
      color: 'red'
    })
  }
}

async function rollInitiative() {
  if (!currentRoom.value) return
  
  try {
    const response = await $fetch('/api/battle/initiative', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code
      }
    })
    
    if (response.success) {
      console.log('🎲 Initiative rolled:', response.initiativeOrder)
      
      const toast = useToast()
      toast.add({
        title: 'Initiative Rolled',
        description: 'All participants have rolled initiative',
        color: 'blue'
      })
    }
  } catch (error) {
    console.error('Failed to roll initiative:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to roll initiative',
      color: 'red'
    })
  }
}

async function nextTurn() {
  if (!currentRoom.value) return
  
  try {
    const response = await $fetch('/api/battle/next-turn', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code
      }
    })
    
    if (response.success) {
      console.log('🔄 Next turn:', response.currentTurn)
      
      const toast = useToast()
      toast.add({
        title: 'Next Turn',
        description: `It's now ${response.currentTurn?.name || 'the next participant'}'s turn`,
        color: 'green'
      })
    }
  } catch (error) {
    console.error('Failed to advance turn:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to advance to next turn',
      color: 'red'
    })
  }
}

async function loadPlayerSpecialAbilities(participant: any) {
  try {
    // For now, we'll use mock data since we need to first implement the API to load special abilities
    // TODO: Replace with actual API call to load character's special abilities
    const mockAbilities = [
      {
        id: '1',
        name: 'Sword Strike',
        diceFormula: '1d8+3',
        description: 'A powerful sword attack that deals slashing damage.',
        abilityType: 'ACTION' as const,
        usesPerRest: undefined,
        usesRemaining: undefined
      },
      {
        id: '2',
        name: 'Shield Bash',
        diceFormula: '1d4+2',
        description: 'Bash an enemy with your shield, potentially stunning them.',
        abilityType: 'BONUS_ACTION' as const,
        usesPerRest: 3,
        usesRemaining: 2
      },
      {
        id: '3',
        name: 'Second Wind',
        diceFormula: '1d10+1',
        description: 'Regain hit points equal to the roll result.',
        abilityType: 'ACTION' as const,
        usesPerRest: 1,
        usesRemaining: 1
      }
    ]
    
    currentPlayerAbilities.value = mockAbilities
    currentPlayerName.value = participant.name
    showSpecialAbilitiesModal.value = true
  } catch (error) {
    console.error('Failed to load special abilities:', error)
  }
}

function handleRollAbility(ability: any) {
  // Trigger a dice roll with the ability's dice formula
  console.log('Rolling ability:', ability.name, ability.diceFormula)
  
  // Parse dice formula and trigger roll
  // TODO: Implement dice formula parsing and rolling
  const toast = useToast()
  toast.add({
    title: 'Ability Used',
    description: `Rolling ${ability.diceFormula} for ${ability.name}`,
    color: 'blue'
  })
  
  // Close the modal after using ability
  showSpecialAbilitiesModal.value = false
}

function handleUseAbility(ability: any) {
  // Handle using an ability (might reduce uses, apply effects, etc.)
  console.log('Using ability:', ability.name)
  
  // For abilities with limited uses, decrease the remaining count
  if (ability.usesPerRest && ability.usesRemaining > 0) {
    ability.usesRemaining--
  }
  
  // Trigger the roll automatically when using an ability
  handleRollAbility(ability)
}

async function dealDamageToEnemy(enemy: any) {
  const damage = prompt(`How much damage to deal to ${enemy.name}?`)
  if (!damage || isNaN(parseInt(damage)) || !currentRoom.value) return
  
  try {
    const response = await $fetch('/api/battle/damage', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        targetId: enemy.id,
        damage: parseInt(damage)
      }
    })
    
    if (response.success) {
      console.log('💥 Damage dealt:', response.result)
      
      const toast = useToast()
      toast.add({
        title: 'Damage Dealt',
        description: `${damage} damage dealt to ${enemy.name}`,
        color: 'red'
      })
    }
  } catch (error) {
    console.error('Failed to deal damage:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to deal damage',
      color: 'red'
    })
  }
}

// Music System Functions
async function addTrackToPlaylist() {
  console.log('🎵 addTrackToPlaylist called with URL:', newTrackUrl.value, 'currentRoom:', currentRoom.value)

  if (!newTrackUrl.value.trim()) {
    console.log('🎵 No URL provided')
    return
  }

  if (!currentRoom.value) {
    console.log('🎵 No current room')
    return
  }

  if (currentRoom.value.code === 'default') {
    console.log('🎵 Cannot add tracks to default room')
    return
  }

  const startTime = Date.now()
  isAddingTrack.value = true

  // Check SSE connection status
  const sseStatus = eventSource.value?.readyState
  const sseStatusText = sseStatus === 0 ? 'CONNECTING' : sseStatus === 1 ? 'OPEN' : sseStatus === 2 ? 'CLOSED' : 'UNKNOWN'
  console.log('🎵 Starting to add track:', newTrackUrl.value.trim(), `(timestamp: ${startTime}) SSE Status: ${sseStatusText} (${sseStatus}) Room: ${currentRoom.value.code}`)
  
  // Add a fallback timeout to reset isAddingTrack in case something goes wrong
  const fallbackTimeout = setTimeout(() => {
    if (isAddingTrack.value) {
      console.warn('🎵 ⚠️ Fallback timeout: Resetting isAddingTrack after 10 seconds')
      isAddingTrack.value = false
    }
  }, 10000) // 10 second fallback
  
  try {
    const response = await $fetch('/api/music/add-track', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        url: newTrackUrl.value.trim()
      }
    })
    
    const apiResponseTime = Date.now()
    console.log('🎵 API Response:', response, `(response time: ${apiResponseTime - startTime}ms)`)
    
    if (response && response.success) {
      console.log('🎵 Track added to playlist:', response.track, `(api completed in ${apiResponseTime - startTime}ms)`)
      
      // Don't update local state manually - let SSE handle it
      // This prevents conflicts between local updates and server events
      newTrackUrl.value = ''
      
      const toast = useToast()
      toast.add({
        title: 'Track Added',
        description: `Added "${response.track.title}" to playlist`,
        color: 'green'
      })
    } else {
      console.error('🎵 API returned unsuccessful response:', response)
      throw new Error(response?.message || 'API returned unsuccessful response')
    }
  } catch (error: any) {
    console.error('🎵 Failed to add track:', error)
    
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error.data?.statusMessage || error.message || 'Failed to add track to playlist',
      color: 'red'
    })
  } finally {
    clearTimeout(fallbackTimeout) // Clear the fallback timeout
    const finalTime = Date.now()
    console.log('🎵 Setting isAddingTrack to false', `(total time: ${finalTime - startTime}ms)`)
    isAddingTrack.value = false
  }
}

async function addAndPlayTrack() {
  if (!newTrackUrl.value.trim() || !currentRoom.value) return
  
  isAddingTrack.value = true
  try {
    const response = await $fetch('/api/music/add-track', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        url: newTrackUrl.value.trim(),
        playImmediately: true
      }
    })
    
    if (response.success) {
      console.log('🎵 Track added and playing:', response.track)
      
      // Update local state
      musicState.value.playlist.push(response.track)
      musicState.value.currentTrack = response.track
      musicState.value.isPlaying = true
      newTrackUrl.value = ''
      
      const toast = useToast()
      toast.add({
        title: 'Now Playing',
        description: `Playing "${response.track.title}"`,
        color: 'green'
      })
    }
  } catch (error) {
    console.error('Failed to add and play track:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to add and play track',
      color: 'red'
    })
  } finally {
    isAddingTrack.value = false
  }
}

async function pauseMusic() {
  if (!currentRoom.value) return
  
  try {
    const response = await $fetch('/api/music/pause', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code
      }
    })
    
    if (response.success) {
      musicState.value.isPlaying = false
      console.log('🎵 Music paused')
      
      const toast = useToast()
      toast.add({
        title: 'Music Paused',
        description: 'Music has been paused for all participants',
        color: 'yellow'
      })
    }
  } catch (error) {
    console.error('Failed to pause music:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to pause music',
      color: 'red'
    })
  }
}

async function resumeMusic() {
  if (!currentRoom.value) return
  
  try {
    const response = await $fetch('/api/music/resume', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code
      }
    })
    
    if (response.success) {
      musicState.value.isPlaying = true
      console.log('🎵 Music resumed')
      
      const toast = useToast()
      toast.add({
        title: 'Music Resumed',
        description: 'Music has been resumed for all participants',
        color: 'green'
      })
    }
  } catch (error) {
    console.error('Failed to resume music:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to resume music',
      color: 'red'
    })
  }
}

async function stopMusic() {
  if (!currentRoom.value) return
  
  try {
    const response = await $fetch('/api/music/stop', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code
      }
    })
    
    if (response.success) {
      musicState.value.isPlaying = false
      musicState.value.currentTrack = null
      console.log('🎵 Music stopped')
      
      const toast = useToast()
      toast.add({
        title: 'Music Stopped',
        description: 'Music has been stopped for all participants',
        color: 'blue'
      })
    }
  } catch (error) {
    console.error('Failed to stop music:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to stop music',
      color: 'red'
    })
  }
}

async function setVolume() {
  if (!currentRoom.value) return
  
  try {
    const response = await $fetch('/api/music/volume', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        volume: musicState.value.volume
      }
    })
    
    if (response.success) {
      console.log('🎵 Volume set to:', musicState.value.volume)
    }
  } catch (error) {
    console.error('Failed to set volume:', error)
    // Don't show toast for volume changes as they happen frequently
  }
}

async function clearPlaylist() {
  if (!currentRoom.value) return
  
  try {
    const response = await $fetch('/api/music/clear', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code
      }
    })
    
    if (response.success) {
      musicState.value.playlist = []
      musicState.value.currentTrack = null
      musicState.value.isPlaying = false
      console.log('🎵 Playlist cleared')
      
      const toast = useToast()
      toast.add({
        title: 'Playlist Cleared',
        description: 'All tracks have been removed from the playlist',
        color: 'blue'
      })
    }
  } catch (error) {
    console.error('Failed to clear playlist:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to clear playlist',
      color: 'red'
    })
  }
}

async function playTrackFromPlaylist(track: any) {
  if (!currentRoom.value) return
  
  try {
    const response = await $fetch('/api/music/play', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        trackId: track.id
      }
    })
    
    if (response.success) {
      musicState.value.currentTrack = track
      musicState.value.isPlaying = true
      console.log('🎵 Playing track from playlist:', track.title)
      
      const toast = useToast()
      toast.add({
        title: 'Now Playing',
        description: `Playing "${track.title}"`,
        color: 'green'
      })
    }
  } catch (error) {
    console.error('Failed to play track:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to play track',
      color: 'red'
    })
  }
}

async function removeTrackFromPlaylist(trackId: string) {
  if (!currentRoom.value) return
  
  try {
    const response = await $fetch('/api/music/remove-track', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        trackId: trackId
      }
    })
    
    if (response.success) {
      // Update local state
      musicState.value.playlist = musicState.value.playlist.filter(t => t.id !== trackId)
      
      // If the removed track was currently playing, stop playback
      if (musicState.value.currentTrack?.id === trackId) {
        musicState.value.currentTrack = null
        musicState.value.isPlaying = false
      }
      
      console.log('🎵 Track removed from playlist:', trackId)
      
      const toast = useToast()
      toast.add({
        title: 'Track Removed',
        description: 'Track has been removed from the playlist',
        color: 'blue'
      })
    }
  } catch (error) {
    console.error('Failed to remove track:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to remove track',
      color: 'red'
    })
  }
}

// Utility function to format duration in seconds to MM:SS format
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// YouTube Player API Integration
function loadYouTubeAPI() {
  // Check if YouTube API is already loaded
  if (typeof window !== 'undefined' && window.YT && window.YT.Player) {
    console.log('🎵 YouTube API already available')
    isYouTubeAPIReady.value = true
    return Promise.resolve(true)
  }

  if (isYouTubeAPIReady.value) {
    console.log('🎵 YouTube API marked as ready')
    return Promise.resolve(true)
  }

  const existingScript = document.querySelector('#youtube-api-script')
  if (existingScript) {
    console.log('🎵 YouTube API script already in DOM, waiting...')
    // Script exists but API not ready, wait a bit
    return new Promise((resolve) => {
      setTimeout(() => {
        if (window.YT && window.YT.Player) {
          isYouTubeAPIReady.value = true
          console.log('🎵 YouTube API loaded after waiting')
          resolve(true)
        } else {
          console.error('🎵 YouTube API script present but API not ready')
          resolve(false)
        }
      }, 2000)
    })
  }

  return new Promise((resolve) => {
    console.log('🎵 Loading YouTube API script...')
    const script = document.createElement('script')
    script.id = 'youtube-api-script'
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true

    // Store previous callback if it exists
    const previousCallback = window.onYouTubeIframeAPIReady

    // YouTube API calls this global function when ready
    window.onYouTubeIframeAPIReady = () => {
      isYouTubeAPIReady.value = true
      console.log('🎵 YouTube API loaded successfully')

      // Call previous callback if it existed
      if (previousCallback && typeof previousCallback === 'function') {
        previousCallback()
      }

      resolve(true)
    }

    script.onload = () => {
      console.log('🎵 YouTube API script loaded, waiting for API ready...')
    }

    script.onerror = () => {
      console.error('🎵 Failed to load YouTube API script - check network connection, CSP, or firewall')
      resolve(false)
    }

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!isYouTubeAPIReady.value) {
        console.error('🎵 YouTube API loading timed out')
        resolve(false)
      }
    }, 10000)

    document.head.appendChild(script)
  })
}

function getYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    console.warn('🎵 Invalid URL provided to getYouTubeVideoId:', url)
    return null
  }
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      const videoId = match[1]
      // Validate video ID format
      const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/
      if (videoIdPattern.test(videoId)) {
        return videoId
      } else {
        console.warn('🎵 Extracted video ID has invalid format:', videoId)
      }
    }
  }
  
  console.warn('🎵 Could not extract valid video ID from URL:', url)
  return null
}

async function initializeYouTubePlayer() {
  try {
    console.log('🎵 Starting YouTube player initialization...')
    
    const apiLoaded = await loadYouTubeAPI()
    if (!apiLoaded) {
      console.error('🎵 Failed to load YouTube API')
      return
    }
    
    if (!isYouTubeAPIReady.value) {
      console.error('🎵 YouTube API not ready after loading')
      return
    }

    // Wait for the DOM element to be available with retries
    let retries = 0
    const maxRetries = 10
    let playerElement = null
    
    while (retries < maxRetries && !playerElement) {
      await nextTick()
      playerElement = document.getElementById('youtube-player')
      if (!playerElement) {
        console.log(`🎵 Waiting for player element... (attempt ${retries + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 500))
        retries++
      }
    }
    
    if (!playerElement) {
      console.error('🎵 YouTube player element not found in DOM after retries')
      return
    }

    console.log('🎵 Creating YouTube player instance...')
    youtubePlayer.value = new window.YT.Player('youtube-player', {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 0,
        controls: userRole.value === 'DM' ? 1 : 0, // Only DMs get controls
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        disablekb: userRole.value !== 'DM' ? 1 : 0, // Disable keyboard for non-DMs
        fs: 0, // Disable fullscreen for embedded player
        cc_load_policy: 0,
        enablejsapi: 1,
        playsinline: 1,
        origin: window.location.origin,
        // Reduce tracking and ads
        widget_referrer: window.location.origin,
        host: 'https://www.youtube-nocookie.com'
      },
      events: {
        onReady: (event: any) => {
          console.log('🎵 YouTube player ready, setting initial volume to:', musicState.value.volume)
          
          // Set initial volume
          try {
            event.target.setVolume(musicState.value.volume)
            console.log('🎵 Initial volume set successfully')
            
            // If there's already a current track, sync it
            if (musicState.value.currentTrack) {
              console.log('🎵 Syncing existing track:', musicState.value.currentTrack.title)
              syncPlayerWithMusicState()
            }
          } catch (error) {
            console.error('🎵 Error setting initial volume:', error)
          }
        },
        onStateChange: (event: any) => {
          handlePlayerStateChange(event)
        },
        onError: (event: any) => {
          console.error('🎵 YouTube player error:', event.data)
          console.error('🎵 Current video ID:', currentVideoId.value)
          console.error('🎵 Music state:', musicState.value)
          
          // Filter out CORS-related tracking errors which are safe to ignore
          if (event.data && typeof event.data === 'object' && 
              (event.data.toString().includes('doubleclick') || 
               event.data.toString().includes('googleads'))) {
            console.log('🎵 Ignoring YouTube tracking/ads error (safe):', event.data)
            return
          }
          
          let errorMessage = 'There was an error playing the video'
          
          // More specific error messages
          switch (event.data) {
            case 2:
              errorMessage = `Invalid video ID: ${currentVideoId.value}`
              break
            case 5:
              errorMessage = 'Video cannot be played in HTML5 player'
              break
            case 100:
              errorMessage = 'Video not found or private'
              break
            case 101:
            case 150:
              errorMessage = 'Video cannot be embedded'
              break
          }
          
          const toast = useToast()
          toast.add({
            title: 'Playback Error',
            description: errorMessage,
            color: 'red'
          })
        }
      }
    })
    
    console.log('🎵 YouTube player initialization completed')
  } catch (error) {
    console.error('🎵 Failed to initialize YouTube player:', error)
    const toast = useToast()
    toast.add({
      title: 'Player Error',
      description: 'Failed to initialize music player',
      color: 'red'
    })
  }
}

function handlePlayerStateChange(event: any) {
  const YT = window.YT
  if (!YT) return
  
  const state = event.data
  const isPlaying = state === YT.PlayerState.PLAYING
  const isPaused = state === YT.PlayerState.PAUSED
  const isEnded = state === YT.PlayerState.ENDED
  
  // Only DMs can control music state via the player
  if (userRole.value === 'DM') {
    if (isPlaying && !musicState.value.isPlaying) {
      // Player started, update backend
      resumeMusic()
    } else if (isPaused && musicState.value.isPlaying) {
      // Player paused, update backend
      pauseMusic()
    } else if (isEnded) {
      // Track ended, stop playback
      stopMusic()
    }
  }
}

// Fade transition variables
const fadeTransition = ref({
  isActive: false,
  targetVolume: 100,
  currentVolume: 100,
  duration: 1000, // 1 second fade
  intervalId: null
})

// Smooth volume fade function
function fadeVolume(fromVolume: number, toVolume: number, duration: number = 1000): Promise<void> {
  return new Promise((resolve) => {
    if (!isYouTubePlayerReady()) {
      resolve()
      return
    }
    
    const startTime = Date.now()
    const volumeRange = toVolume - fromVolume
    
    fadeTransition.value.isActive = true
    fadeTransition.value.currentVolume = fromVolume
    fadeTransition.value.targetVolume = toVolume
    
    const fadeStep = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Use easeInOut curve for smoother transition
      const easedProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      const currentVolume = Math.round(fromVolume + (volumeRange * easedProgress))
      fadeTransition.value.currentVolume = currentVolume
      
      if (isYouTubePlayerReady()) {
        youtubePlayer.value.setVolume(currentVolume)
      }
      
      if (progress >= 1) {
        fadeTransition.value.isActive = false
        fadeTransition.value.currentVolume = toVolume
        resolve()
      } else {
        requestAnimationFrame(fadeStep)
      }
    }
    
    fadeStep()
  })
}

// Helper function to check if YouTube player is ready and has required methods
function isYouTubePlayerReady(): boolean {
  const isReady = !!(youtubePlayer.value && 
           typeof youtubePlayer.value.setVolume === 'function' &&
           typeof youtubePlayer.value.playVideo === 'function' &&
           typeof youtubePlayer.value.pauseVideo === 'function' &&
           typeof youtubePlayer.value.loadVideoById === 'function')
  
  if (!isReady) {
    console.log('🎵 YouTube player readiness check failed:', {
      playerExists: !!youtubePlayer.value,
      hasSetVolume: youtubePlayer.value && typeof youtubePlayer.value.setVolume === 'function',
      hasPlayVideo: youtubePlayer.value && typeof youtubePlayer.value.playVideo === 'function',
      hasPauseVideo: youtubePlayer.value && typeof youtubePlayer.value.pauseVideo === 'function',
      hasLoadVideoById: youtubePlayer.value && typeof youtubePlayer.value.loadVideoById === 'function'
    })
  }
  
  return isReady
}

// Diagnostic function for troubleshooting
function diagnoseMusicSystem() {
  const playerElement = document.getElementById('youtube-player')
  
  console.log('🎵 Music System Diagnostic:', {
    isYouTubeAPIReady: isYouTubeAPIReady.value,
    isPlayerReady: isYouTubePlayerReady(),
    musicState: musicState.value,
    currentVideoId: currentVideoId.value,
    fadeTransition: fadeTransition.value,
    userRole: userRole.value,
    currentRoom: currentRoom.value,
    hasPlayerElement: !!playerElement,
    playerElementHTML: playerElement ? playerElement.outerHTML : null,
    windowYT: !!window.YT,
    windowYTLoaded: window.YT ? !!window.YT.Player : false,
    isConnected: isConnected.value,
    youtubePlayerValue: youtubePlayer.value,
    fadeConfig: fadeConfig.value
  })
  
  // Try to get player state if available
  if (youtubePlayer.value && typeof youtubePlayer.value.getPlayerState === 'function') {
    try {
      console.log('🎵 YouTube Player State:', youtubePlayer.value.getPlayerState())
      console.log('🎵 YouTube Player Volume:', youtubePlayer.value.getVolume())
    } catch (error) {
      console.log('🎵 Error getting player state:', error)
    }
  }
  
  return {
    isReady: isYouTubePlayerReady(),
    hasAPI: isYouTubeAPIReady.value,
    hasElement: !!playerElement,
    hasPlayer: !!youtubePlayer.value,
    musicState: musicState.value
  }
}

// Force reinitialize YouTube player
async function forceReinitializePlayer() {
  console.log('🎵 Force reinitializing YouTube player...')
  
  // Reset state
  youtubePlayer.value = null
  isYouTubeAPIReady.value = false
  currentVideoId.value = ''
  
  // Remove existing script
  const existingScript = document.getElementById('youtube-api-script')
  if (existingScript) {
    existingScript.remove()
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Reinitialize
  await initializeYouTubePlayer()
  
  console.log('🎵 Force reinitialization complete')
}

async function switchTrackWithFade(newVideoId: string) {
  console.log('🎵 Switching to track:', newVideoId)
  
  // Validate video ID format
  if (!newVideoId || typeof newVideoId !== 'string' || newVideoId.length < 10) {
    console.error('🎵 Invalid video ID:', newVideoId)
    return
  }
  
  // YouTube video IDs are 11 characters long and contain only alphanumeric characters, hyphens, and underscores
  const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/
  if (!videoIdPattern.test(newVideoId)) {
    console.error('🎵 Video ID format invalid:', newVideoId)
    return
  }
  
  if (!isYouTubePlayerReady()) {
    console.log('🎵 Player not ready, using instant switch')
    currentVideoId.value = newVideoId
    if (isYouTubePlayerReady()) {
      try {
        youtubePlayer.value.loadVideoById(newVideoId)
        console.log('🎵 Video loaded successfully')
      } catch (error) {
        console.error('🎵 Error loading video:', error)
      }
    }
    return
  }
  
  const currentVolume = musicState.value.volume
  console.log('🎵 Starting smooth track transition with volume:', currentVolume)
  
  try {
    // Store current player state
    const wasPlaying = youtubePlayer.value.getPlayerState() === 1 // PLAYING = 1
    
    // Create a temporary second player for crossfading
    const tempPlayerDiv = document.createElement('div')
    tempPlayerDiv.id = 'youtube-player-temp'
    tempPlayerDiv.style.display = 'none'
    document.body.appendChild(tempPlayerDiv)
    
    const tempPlayer = new window.YT.Player('youtube-player-temp', {
      height: '1',
      width: '1',
      videoId: newVideoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0
      },
      events: {
        onReady: async (event) => {
          console.log('🎵 Temp player ready for crossfade')
          
          // Start new track at 0 volume
          event.target.setVolume(0)
          if (wasPlaying) {
            event.target.playVideo()
          }
          
          // Crossfade: fade out current, fade in new simultaneously
          const fadeDuration = fadeConfig.value.trackTransition
          const promises = []
          
          // Fade out current track
          if (currentVideoId.value) {
            promises.push(fadeVolume(currentVolume, 0, fadeDuration))
          }
          
          // Fade in new track on temp player
          promises.push(new Promise(async (resolve) => {
            await new Promise(r => setTimeout(r, 50)) // Slight delay for smoother transition
            await fadeVolumeForPlayer(event.target, 0, currentVolume, fadeDuration)
            resolve(true)
          }))
          
          // Wait for both fades to complete
          await Promise.all(promises)
          
          // Switch to new player
          currentVideoId.value = newVideoId
          youtubePlayer.value.stopVideo()
          
          // Replace main player with new video
          youtubePlayer.value.loadVideoById(newVideoId)
          youtubePlayer.value.setVolume(currentVolume)
          
          if (wasPlaying) {
            // Small delay to ensure video is loaded
            setTimeout(() => {
              if (isYouTubePlayerReady()) {
                youtubePlayer.value.playVideo()
              }
            }, 100)
          }
          
          // Cleanup temp player
          setTimeout(() => {
            event.target.destroy()
            if (tempPlayerDiv.parentNode) {
              tempPlayerDiv.parentNode.removeChild(tempPlayerDiv)
            }
          }, 500)
          
          console.log('🎵 Crossfade transition completed')
        },
        onError: (event) => {
          console.error('🎵 Temp player error:', event.data)
          // Fallback to instant switch
          currentVideoId.value = newVideoId
          youtubePlayer.value.loadVideoById(newVideoId)
          youtubePlayer.value.setVolume(currentVolume)
          
          // Cleanup
          if (tempPlayerDiv.parentNode) {
            tempPlayerDiv.parentNode.removeChild(tempPlayerDiv)
          }
        }
      }
    })
    
  } catch (error) {
    console.error('🎵 Error during crossfade transition:', error)
    // Fallback to instant switch
    currentVideoId.value = newVideoId
    youtubePlayer.value.loadVideoById(newVideoId)
    youtubePlayer.value.setVolume(currentVolume)
  }
}

// Helper function for fading volume on a specific player
function fadeVolumeForPlayer(player: any, fromVolume: number, toVolume: number, duration: number = 1000): Promise<void> {
  return new Promise((resolve) => {
    if (!player || typeof player.setVolume !== 'function') {
      resolve()
      return
    }
    
    const startTime = Date.now()
    const volumeRange = toVolume - fromVolume
    
    const fadeStep = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Use easeInOut curve for smoother transition
      const easedProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      const currentVolume = Math.round(fromVolume + (volumeRange * easedProgress))
      
      try {
        player.setVolume(currentVolume)
      } catch (e) {
        console.error('🎵 Error setting volume during fade:', e)
      }
      
      if (progress >= 1) {
        resolve()
      } else {
        requestAnimationFrame(fadeStep)
      }
    }
    
    fadeStep()
  })
}

function syncPlayerWithMusicState() {
  if (!isYouTubePlayerReady() || !musicState.value.currentTrack) {
    console.log('🎵 Skipping sync - player not ready or no current track')
    return
  }
  
  console.log('🎵 Syncing player with music state:', {
    track: musicState.value.currentTrack.title,
    isPlaying: musicState.value.isPlaying,
    volume: musicState.value.volume,
    url: musicState.value.currentTrack.url
  })
  
  const videoId = getYouTubeVideoId(musicState.value.currentTrack.url)
  if (!videoId) {
    console.error('🎵 Invalid YouTube URL:', musicState.value.currentTrack.url)
    console.error('🎵 Current track data:', musicState.value.currentTrack)
    return
  }
  
  console.log('🎵 Extracted video ID:', videoId)
  
  // Load video with fade transition if different from current
  if (currentVideoId.value !== videoId) {
    console.log('🎵 Loading new video:', videoId)
    switchTrackWithFade(videoId)
  }
  
  // Sync play/pause state
  try {
    if (musicState.value.isPlaying) {
      console.log('🎵 Starting playback')
      youtubePlayer.value.playVideo()
    } else {
      console.log('🎵 Pausing playback')
      youtubePlayer.value.pauseVideo()
    }
    
    // Sync volume with smooth transition if not already fading
    if (!fadeTransition.value.isActive) {
      console.log('🎵 Setting volume to:', musicState.value.volume)
      youtubePlayer.value.setVolume(musicState.value.volume)
    }
  } catch (error) {
    console.error('🎵 Error syncing player state:', error)
  }
}

// Watch for changes in music state to sync with player
watch(() => musicState.value.currentTrack, (newTrack) => {
  if (newTrack && isYouTubePlayerReady()) {
    syncPlayerWithMusicState()
  } else if (!newTrack && isYouTubePlayerReady()) {
    youtubePlayer.value.stopVideo()
    currentVideoId.value = null
  }
}, { deep: true })

watch(() => musicState.value.isPlaying, async (isPlaying, wasPlaying) => {
  if (!isYouTubePlayerReady()) return
  
  if (fadeConfig.value.enabled) {
    if (isPlaying && !wasPlaying) {
      // Starting playback - fade in
      youtubePlayer.value.playVideo()
      
      // Add small fade in effect
      const currentVolume = musicState.value.volume
      await fadeVolume(Math.max(0, currentVolume - 20), currentVolume, fadeConfig.value.playPause)
    } else if (!isPlaying && wasPlaying) {
      // Pausing playback - fade out then pause
      const currentVolume = musicState.value.volume
      await fadeVolume(currentVolume, Math.max(0, currentVolume - 15), fadeConfig.value.playPause * 0.75)
      youtubePlayer.value.pauseVideo()
      
      // Restore volume for when playback resumes
      setTimeout(() => {
        if (isYouTubePlayerReady()) {
          youtubePlayer.value.setVolume(currentVolume)
        }
      }, 100)
    }
  } else {
    // No fade effects - direct play/pause
    if (isPlaying) {
      youtubePlayer.value.playVideo()
    } else {
      youtubePlayer.value.pauseVideo()
    }
  }
})

watch(() => musicState.value.volume, (newVolume, oldVolume) => {
  if (isYouTubePlayerReady() && !fadeTransition.value.isActive && fadeConfig.value.enabled) {
    // Use smooth transition for volume changes if the change is significant
    const volumeDifference = Math.abs(newVolume - (oldVolume || 0))
    
    if (volumeDifference > 10) {
      // Large volume change - use fade transition
      fadeVolume(oldVolume || 0, newVolume, fadeConfig.value.volumeChange)
    } else {
      // Small volume change - set directly
      youtubePlayer.value.setVolume(newVolume)
    }
  } else if (isYouTubePlayerReady() && !fadeTransition.value.isActive) {
    // Fades disabled - set volume directly
    youtubePlayer.value.setVolume(newVolume)
  }
})

// Initialize with SSE connection
onMounted(async () => {
  console.log('🎲 Dice room component mounted')
  
  // Add global error handler to filter out YouTube CORS tracking errors
  const originalConsoleError = console.error
  console.error = (...args) => {
    const errorStr = args.join(' ')
    if (errorStr.includes('doubleclick.net') || 
        errorStr.includes('googleads.g.doubleclick.net') ||
        errorStr.includes('CORS policy') && errorStr.includes('youtube')) {
      // Silently ignore YouTube tracking/ads CORS errors
      return
    }
    // Log all other errors normally
    originalConsoleError.apply(console, args)
  }
  
  // Set initial room state (default room)
  currentRoom.value = {
    name: 'Default Room',
    code: 'default',
    isOwner: false
  }

  // Load user characters and auto-detect role
  await loadUserCharacters()

  // Initialize YouTube player if there's music content
  console.log('🎵 Initializing YouTube player...')
  await initializeYouTubePlayer()

  // Add global diagnostic function for debugging
  window.diagnoseMusicSystem = diagnoseMusicSystem
  window.forceReinitializePlayer = forceReinitializePlayer

  initializeSSE('default')
})

onUnmounted(() => {
  // Clean up fade transition
  if (fadeTransition.value.intervalId) {
    cancelAnimationFrame(fadeTransition.value.intervalId)
    fadeTransition.value.intervalId = null
    fadeTransition.value.isActive = false
  }
  
  disconnectSSE()
})

// SEO
useHead({
  title: 'Collaborative Dice Room',
  meta: [
    { name: 'description', content: 'Roll dice together with your D&D party' }
  ]
})
</script>
