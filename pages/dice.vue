<template>
  <div class="min-h-screen bg-zinc-950 bg-zinc-950">
    <!-- Header -->
    <header class="bg-zinc-900 bg-zinc-900 shadow-sm border-b border-zinc-800 border-zinc-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <UButton :to="(user?.role === 'DM' || user?.role === 'ADMIN') ? '/dashboard' : '/'" color="gray"
              variant="ghost" icon="i-heroicons-arrow-left" size="sm">
              {{ t('backToDashboard') }}
            </UButton>

            <div class="h-6 border-l border-gray-300 dark:border-gray-600"></div>

            <div>
              <h1 class="text-2xl font-bold text-white flex items-center">
                <UIcon name="i-heroicons-cube" class="w-8 h-8 text-red-500 mr-2" />
                {{ t('collaborativeDiceRoom') }}
              </h1>
              <div v-if="currentRoom" class="flex items-center space-x-2">
                <span class="text-sm text-zinc-400 text-zinc-400">
                  {{ t('room') }}: {{ currentRoom.name }}
                </span>
                <div class="flex items-center space-x-1">
                  <span class="text-sm font-mono bg-gray-100 bg-zinc-900 px-2 py-1 rounded">
                    {{ currentRoom.code }}
                  </span>
                  <UButton v-if="currentRoom.code !== 'default'" color="gray" variant="ghost" size="xs"
                    icon="i-heroicons-clipboard-document" @click="copyRoomCode">
                    {{ t('copy') }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <UButton color="primary" variant="solid" size="xs" icon="i-heroicons-language" @click="toggleLanguage">
              {{ language === 'en' ? 'ES' : 'EN' }}
            </UButton>

            <div class="flex items-center space-x-2">
              <div class="h-3 w-3 rounded-full" :class="{
                'bg-green-500': isConnected,
                'bg-yellow-500': isOfflineMode,
                'bg-orange-500 animate-pulse': isReconnecting,
                'bg-red-500': !isConnected && !isOfflineMode && !isReconnecting
              }"></div>
              <span class="text-sm text-gray-600 dark:text-gray-300">
                <template v-if="isReconnecting">
                  {{ t('reconnecting') }} ({{ reconnectAttempts }}/{{ maxReconnectAttempts }})
                </template>
                <template v-else>
                  {{ isConnected ? t('connected') : isOfflineMode ? t('offlineMode') : t('disconnected') }}
                </template>
              </span>
              <UButton v-if="!isConnected || isOfflineMode" color="yellow" variant="ghost" size="xs"
                :icon="isOfflineModePreference ? 'i-heroicons-wifi' : 'i-heroicons-wifi-slash'"
                @click="toggleOfflineMode">
                {{ isOfflineModePreference ? t('goOnline') : t('stayOffline') }}
              </UButton>
            </div>

            <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <UIcon name="i-heroicons-users" class="h-4 w-4" />
              <span>{{ connectedUsers }} {{ isOfflineMode ? `(${t('offline')})` : t('online') }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Toolbar (Sidebar Toggles & Room Actions) -->
      <div
        class="mb-6 flex flex-wrap items-center justify-between gap-4 bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <!-- Sidebar Toggles -->
        <div class="flex items-center space-x-2">
          <UButton color="blue" variant="outline" @click="isLeftSidebarOpen = !isLeftSidebarOpen"
            :icon="isLeftSidebarOpen ? 'i-heroicons-eye-slash' : 'i-heroicons-user'">
            {{ isLeftSidebarOpen ? t('hide') : t('show') }} {{ userRole === 'DM' ? t('playersInfo') : t('character') }}
          </UButton>
          <UButton color="green" variant="outline" @click="isRightSidebarOpen = !isRightSidebarOpen"
            :icon="isRightSidebarOpen ? 'i-heroicons-eye-slash' : 'i-heroicons-chart-bar'">
            {{ isRightSidebarOpen ? t('hide') : t('show') }} {{ userRole === 'DM' ? t('requestDices') : t('abilities')
            }}
          </UButton>
          <UButton v-if="userRole === 'DM'" color="purple" variant="outline" icon="i-heroicons-photo"
            @click="showDmImageModal = true">
            {{ t('showImage') }}
          </UButton>
        </div>

        <!-- Room Actions -->
        <div v-if="currentRoom && currentRoom.code !== 'default'" class="flex items-center space-x-2">
          <UButton color="red" variant="outline" icon="i-heroicons-arrow-right-on-rectangle" @click="leaveRoom">
            {{ t('leaveRoom') }}
          </UButton>
        </div>
      </div>

      <!-- Offline Mode Banner -->
      <div v-if="isOfflineMode"
        class="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {{ t('offlineModeActive') }}
            </h3>
            <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {{ t('offlineModeDesc') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Room Selection/Creation Card -->
      <UCard v-if="!currentRoom || !isConnected || currentRoom.code === 'default'" class="mb-6">
        <template #header>
          <h3 class="text-lg font-semibold text-white flex items-center">
            <UIcon name="i-heroicons-home" class="w-5 h-5 text-red-500 mr-2" />
            {{ t('roomManagement') }}
          </h3>
        </template>

        <div class="space-y-4">
          <div class="flex items-center space-x-4">
            <!-- Only show Create Room button for DMs -->
            <UButton v-if="userRole === 'DM'" color="primary" @click="showCreateRoom = true" icon="i-heroicons-plus">
              {{ t('createNewRoom') }}
            </UButton>

            <div v-if="userRole === 'DM'" class="text-gray-400 dark:text-zinc-400">{{ t('or') }}</div>

            <div class="flex items-center space-x-2 flex-1">
              <UInput v-model="joinRoomCode" :placeholder="t('enterRoomCode')" class="flex-1"
                @keyup.enter="joinExistingRoom" />
              <UButton color="gray" @click="joinExistingRoom" :disabled="!joinRoomCode.trim()"
                icon="i-heroicons-arrow-right-on-rectangle">
                {{ t('joinRoom') }}
              </UButton>
            </div>
          </div>

          <div v-if="userRole === 'Player'"
            class="text-sm text-gray-600 text-zinc-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div class="flex items-start space-x-2">
              <UIcon name="i-heroicons-information-circle" class="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <span class="font-medium text-blue-900 dark:text-blue-100">{{ t('playerNote') }}</span>
                <span class="text-blue-800 dark:text-blue-200">{{ t('playerNoteDesc') }}</span>
              </div>
            </div>
          </div>

          <div v-if="!isConnected" class="text-sm text-zinc-400 text-zinc-400">
            {{ t('connectToCreateJoin') }}
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
          class="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 max-w-full bg-zinc-900 bg-zinc-900 shadow-lg border-r border-zinc-800 border-zinc-800 transform transition-all duration-300 ease-in-out z-50 overflow-y-auto"
          :class="isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'">
          <!-- Left Sidebar Header -->
          <div class="sticky top-0 bg-zinc-900 bg-zinc-900 border-b border-zinc-800 border-zinc-800 p-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                <UIcon :name="userRole === 'DM' ? 'i-heroicons-users' : 'i-heroicons-user'"
                  class="w-5 h-5 text-red-500" />
                {{ userRole === 'DM' ? t('playersInfo') : t('characterInfo') }}
              </h3>
              <UButton color="gray" variant="ghost" size="sm" @click="isLeftSidebarOpen = false"
                icon="i-heroicons-x-mark" />
            </div>
          </div>

          <!-- Left Sidebar Content -->
          <div class="p-4 space-y-6">
            <!-- Character Info Card (only for Players) -->
            <div v-if="userRole === 'Player'">
              <!-- Character Portrait -->
              <div v-if="activeCharacter" class="space-y-4">
                <!-- Character Image -->
                <div class="text-center">
                  <div class="relative h-24 w-24 mx-auto mb-3">
                    <img v-if="activeCharacter.avatar" :src="activeCharacter.avatar"
                      :alt="activeCharacter.characterName || 'Character'"
                      class="h-24 w-24 rounded-full object-cover border-4 border-zinc-800 dark:border-gray-600"
                      @error="$event.target.style.display = 'none'" />
                    <div v-if="!activeCharacter.avatar"
                      class="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-zinc-800 dark:border-gray-600">
                      {{ activeCharacter.characterName?.charAt(0)?.toUpperCase() || '?' }}
                    </div>
                  </div>

                  <h5 class="text-lg font-semibold text-white text-white">
                    {{ activeCharacter.characterName || t('unknownCharacter') }}
                  </h5>
                  <p class="text-sm text-zinc-400 text-zinc-400">
                    {{ t('level') }} {{ activeCharacter.classLevel || 1 }} {{ activeCharacter.className || t('class') }}
                  </p>
                  <p class="text-xs text-zinc-400 text-zinc-400">
                    {{ (activeCharacter.race || t('unknown')) }}
                  </p>
                </div>

                <!-- Currency -->
                <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
                  <h6 class="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <UIcon name="i-heroicons-currency-dollar" class="w-4 h-4 text-yellow-500" />
                    {{ t('currency') }}
                  </h6>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="flex justify-between">
                      <span class="text-orange-600">{{ t('copper') }}:</span>
                      <span class="font-mono">{{ activeCharacter.copperCoins || 0 }} cp</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">{{ t('silver') }}:</span>
                      <span class="font-mono">{{ activeCharacter.silverCoins || 0 }} sp</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-blue-400">{{ t('electrum') }}:</span>
                      <span class="font-mono">{{ activeCharacter.electrumCoins || 0 }} ep</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-yellow-500">{{ t('gold') }}:</span>
                      <span class="font-mono">{{ activeCharacter.goldCoins || 0 }} gp</span>
                    </div>
                    <div class="flex justify-between col-span-2">
                      <span class="text-gray-300">{{ t('platinum') }}:</span>
                      <span class="font-mono">{{ activeCharacter.platinumCoins || 0 }} pp</span>
                    </div>
                  </div>
                  <div class="mt-2 pt-2 border-t border-zinc-800 border-zinc-800">
                    <div class="flex justify-between items-center text-sm">
                      <span class="font-medium text-gray-700 dark:text-gray-300">{{ t('totalValue') }}:</span>
                      <span class="font-bold text-white text-white">
                        {{ calculateTotalWealth(activeCharacter) }} gp
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Inventory -->
                <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
                  <h6 class="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <UIcon name="i-heroicons-briefcase" class="w-4 h-4 text-zinc-400" />
                    {{ t('inventory') }}
                  </h6>
                  <div v-if="activeCharacter.inventory && activeCharacter.inventory.length > 0"
                    class="space-y-2 max-h-32 overflow-y-auto">
                    <div v-for="item in activeCharacter.inventory" :key="item.id"
                      class="border border-zinc-800 border-zinc-800 rounded p-2">
                      <div class="flex justify-between items-start">
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-white text-white truncate">{{ item.name }}</p>
                          <div class="flex items-center space-x-2 text-xs text-zinc-400 text-zinc-400">
                            <span>{{ t('quantity') }}: {{ item.quantity || 1 }}</span>
                            <span v-if="item.weight">• {{ item.weight }} lbs</span>
                          </div>
                        </div>
                      </div>
                      <p v-if="item.notes" class="text-xs text-zinc-400 text-zinc-400 mt-1 truncate">{{ item.notes
                      }}</p>
                    </div>
                  </div>
                  <div v-else class="text-center py-4 text-zinc-400 text-zinc-400 text-sm">
                    {{ t('noItems') }}
                  </div>
                </div>

                <!-- Notes -->
                <div v-if="activeCharacter.notes" class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
                  <h6 class="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-zinc-400" />
                    {{ t('notes') }}
                  </h6>
                  <p class="text-sm text-gray-700 dark:text-gray-300 max-h-24 overflow-y-auto">{{ activeCharacter.notes
                  }}</p>
                </div>

                <!-- Reset Stats Button -->
                <div v-if="!isOfflineMode" class="pt-2">
                  <UButton color="gray" variant="outline" size="sm" @click="resetStats" class="w-full">
                    <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
                    {{ t('resetStats') }}
                  </UButton>
                </div>
              </div>

              <div v-else class="text-center py-8">
                <UIcon name="i-heroicons-face-smile" class="text-4xl mb-4 text-zinc-600" />
                <p class="text-zinc-500">
                  {{ t('selectCharacter') }}
                </p>
              </div>
            </div>

            <!-- DM Players Health Display -->
            <div v-else>
              <div class="mb-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-white text-white">{{ t('playersHealth') }}</h4>
                  <UButton v-if="!isOfflineMode && currentRoom && currentRoom.code !== 'default'" color="gray"
                    variant="outline" size="xs" @click="loadAllPlayersStats(currentRoom.code)"
                    icon="i-heroicons-arrow-path">
                    {{ t('refresh') }}
                  </UButton>
                </div>
              </div>

              <div v-if="allPlayers.length > 0" class="space-y-4">
                <div v-for="player in allPlayers" :key="player.userId"
                  class="bg-zinc-950 bg-zinc-900 border border-zinc-800 border-zinc-800 rounded-lg p-4">
                  <!-- Player Name and Level -->
                  <div class="flex items-center justify-between mb-3">
                    <div>
                      <h5 class="text-sm font-medium text-white text-white">{{ player.name }}</h5>
                      <p class="text-xs text-zinc-400 text-zinc-400">{{ t('level') }} {{ player.stats.level }}</p>
                    </div>
                    <div class="flex items-center space-x-1">
                      <UButton color="blue" variant="outline" size="xs" icon="i-heroicons-eye"
                        @click="showPlayerDetails(player)" :title="t('viewCharacterDetails')" />
                      <span
                        class="text-xs font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {{ t('ac') }} {{ player.stats.armorClass }}
                      </span>
                    </div>
                  </div>

                  <!-- Health Bar -->
                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-red-700 dark:text-red-300">{{ t('healthPoints') }}</span>
                      <span class="font-mono text-red-900 dark:text-red-100">
                        {{ player.stats.hitPoints.current }} / {{ player.stats.hitPoints.max }}
                      </span>
                    </div>
                    <div class="w-full bg-red-200 dark:bg-red-800 rounded-full h-3">
                      <div class="bg-red-500 h-3 rounded-full transition-all duration-300"
                        :style="{ width: `${(player.stats.hitPoints.current / player.stats.hitPoints.max) * 100}%` }"
                        :class="{
                          'bg-red-600': player.stats.hitPoints.current <= player.stats.hitPoints.max * 0.25,
                          'bg-yellow-500': player.stats.hitPoints.current > player.stats.hitPoints.max * 0.25 && player.stats.hitPoints.current <= player.stats.hitPoints.max * 0.5,
                          'bg-green-500': player.stats.hitPoints.current > player.stats.hitPoints.max * 0.5
                        }">
                      </div>
                    </div>

                    <!-- Health Status Indicator -->
                    <div class="text-xs font-medium" :class="{
                      'text-red-600 dark:text-red-400': player.stats.hitPoints.current <= player.stats.hitPoints.max * 0.25,
                      'text-yellow-600 dark:text-yellow-400': player.stats.hitPoints.current > player.stats.hitPoints.max * 0.25 && player.stats.hitPoints.current <= player.stats.hitPoints.max * 0.5,
                      'text-green-600 dark:text-green-400': player.stats.hitPoints.current > player.stats.hitPoints.max * 0.5
                    }">
                      {{ player.stats.hitPoints.current === 0 ? t('unconscious') :
                        player.stats.hitPoints.current <= player.stats.hitPoints.max * 0.25 ? t('critical') :
                          player.stats.hitPoints.current <= player.stats.hitPoints.max * 0.5 ? t('wounded') : t('healthy')
                      }} </div>
                    </div>

                    <!-- Quick Stats Grid -->
                    <div class="grid grid-cols-3 gap-2 mt-3">
                      <div class="text-center">
                        <div class="text-xs text-zinc-400 text-zinc-400">{{ t('init') }}</div>
                        <div class="text-sm font-mono text-white text-white">
                          {{ player.stats.initiative >= 0 ? '+' : '' }}{{ player.stats.initiative }}
                        </div>
                      </div>
                      <div class="text-center">
                        <div class="text-xs text-zinc-400 text-zinc-400">{{ t('speed') }}</div>
                        <div class="text-sm font-mono text-white text-white">{{ player.stats.speed }} ft</div>
                      </div>
                      <div class="text-center">
                        <div class="text-xs text-zinc-400 text-zinc-400">{{ t('prof') }}</div>
                        <div class="text-sm font-mono text-white text-white">+{{ player.stats.proficiencyBonus
                        }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-8">
                  <div class="text-4xl mb-4">👥</div>
                  <h4 class="font-medium text-white text-white mb-2">{{ t('noPlayersConnected') }}</h4>
                  <p class="text-sm text-zinc-400 text-zinc-400">
                    {{ isOfflineMode ? t('playerHealthOffline') : t('playersWillAppear') }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Sidebar - Ability Scores -->
          <div
            class="fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 max-w-full bg-zinc-900 bg-zinc-900 shadow-lg border-l border-zinc-800 border-zinc-800 transform transition-all duration-300 ease-in-out z-50 overflow-y-auto"
            :class="isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'">
            <!-- Right Sidebar Header -->
            <div class="sticky top-0 bg-zinc-900 bg-zinc-900 border-b border-zinc-800 border-zinc-800 p-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-white text-white">
                  {{ userRole === 'DM' ? t('requestDices') : t('abilityScores') }}
                </h3>
                <UButton color="gray" variant="ghost" size="sm" @click="isRightSidebarOpen = false"
                  icon="i-heroicons-x-mark" />
              </div>
            </div>

            <!-- Right Sidebar Content -->
            <div class="p-4 space-y-6">
              <!-- Ability Scores & Skills (only for Players) -->
              <div v-if="userRole === 'Player'">
                <div v-if="activeCharacter" class="space-y-6">
                  <!-- Ability Scores - Compact Version -->
                  <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
                    <h6 class="text-sm font-medium text-white text-white mb-3">{{ t('abilityScores') }}</h6>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div class="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <span class="text-red-700 dark:text-red-300 font-medium">{{ t('str') }}</span>
                        <span class="font-mono text-red-900 dark:text-red-100">
                          {{ activeCharacter.strength || 10 }} ({{
                            formatModifier(calculateModifier(activeCharacter.strength
                              || 10)) }})
                        </span>
                      </div>
                      <div class="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <span class="text-green-700 dark:text-green-300 font-medium">{{ t('dex') }}</span>
                        <span class="font-mono text-green-900 dark:text-green-100">
                          {{ activeCharacter.dexterity || 10 }} ({{
                            formatModifier(calculateModifier(activeCharacter.dexterity
                              || 10)) }})
                        </span>
                      </div>
                      <div class="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                        <span class="text-orange-700 dark:text-orange-300 font-medium">{{ t('con') }}</span>
                        <span class="font-mono text-orange-900 dark:text-orange-100">
                          {{ activeCharacter.constitution || 10 }} ({{
                            formatModifier(calculateModifier(activeCharacter.constitution || 10)) }})
                        </span>
                      </div>
                      <div class="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                        <span class="text-purple-700 dark:text-purple-300 font-medium">{{ t('int') }}</span>
                        <span class="font-mono text-purple-900 dark:text-purple-100">
                          {{ activeCharacter.intelligence || 10 }} ({{
                            formatModifier(calculateModifier(activeCharacter.intelligence || 10)) }})
                        </span>
                      </div>
                      <div class="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <span class="text-blue-700 dark:text-blue-300 font-medium">{{ t('wis') }}</span>
                        <span class="font-mono text-blue-900 dark:text-blue-100">
                          {{ activeCharacter.wisdom || 10 }} ({{ formatModifier(calculateModifier(activeCharacter.wisdom
                            ||
                            10)) }})
                        </span>
                      </div>
                      <div class="flex justify-between items-center p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                        <span class="text-pink-700 dark:text-pink-300 font-medium">{{ t('cha') }}</span>
                        <span class="font-mono text-pink-900 dark:text-pink-100">
                          {{ activeCharacter.charisma || 10 }} ({{
                            formatModifier(calculateModifier(activeCharacter.charisma
                              || 10)) }})
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Health Bar -->
                  <div class="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <div class="flex justify-between items-center text-sm mb-1">
                      <span class="text-red-700 dark:text-red-300 font-medium">{{ t('hitPoints') }}</span>
                      <span class="font-mono text-red-900 dark:text-red-100">
                        {{ activeCharacter.currentHp || 0 }} / {{ activeCharacter.maxHp || 0 }}
                      </span>
                    </div>
                    <div class="w-full bg-red-200 dark:bg-red-800 rounded-full h-2">
                      <div class="bg-red-500 h-2 rounded-full transition-all duration-300"
                        :style="{ width: `${calculateHealthPercentage(activeCharacter)}%` }">
                      </div>
                    </div>
                  </div>

                  <!-- Combat Stats -->
                  <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
                    <h6 class="text-sm font-medium text-white text-white mb-3">{{ t('combatStats') }}</h6>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div class="flex justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <span class="text-blue-700 dark:text-blue-300">{{ t('ac') }}</span>
                        <span class="font-mono text-blue-900 dark:text-blue-100">{{ activeCharacter.armorClass || 10
                        }}</span>
                      </div>
                      <div class="flex justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                        <span class="text-orange-700 dark:text-orange-300">{{ t('initiative') }}</span>
                        <span class="font-mono text-orange-900 dark:text-orange-100">{{
                          formatModifier(activeCharacter.initiative || 0) }}</span>
                      </div>
                      <div class="flex justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <span class="text-yellow-700 dark:text-yellow-300">{{ t('speed') }}</span>
                        <span class="font-mono text-yellow-900 dark:text-yellow-100">{{ activeCharacter.speed || 30 }}
                          ft</span>
                      </div>
                      <div class="flex justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                        <span class="text-purple-700 dark:text-purple-300">{{ t('prof') }}</span>
                        <span class="font-mono text-purple-900 dark:text-purple-100">+{{
                          activeCharacter.proficiencyBonus || 2
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Saving Throws -->
                  <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
                    <h6 class="text-sm font-medium text-white text-white mb-3">{{ t('savingThrows') }}</h6>
                    <div class="space-y-2">
                      <!-- Always show all 6 saving throws -->
                      <div
                        v-for="ability in ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']"
                        :key="ability"
                        class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded p-2">
                        <div class="flex items-center space-x-2">
                          <span class="text-sm font-medium text-white text-white capitalize">{{
                            getAbilityAbbr(ability)
                            }}</span>
                          <span v-if="getSavingThrowProficiency(ability, activeCharacter)"
                            class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">{{
                              t('prof') }}</span>
                        </div>
                        <span class="text-sm font-mono text-gray-600 text-zinc-400">
                          {{ formatModifier(calculateSavingThrowModifierByAbility(ability, activeCharacter)) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Skills -->
                  <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h6 class="text-sm font-medium text-white text-white">{{ t('skills') }}</h6>
                    </div>
                    <div class="mb-3">
                      <UInput v-model="skillSearchQuery" icon="i-heroicons-magnifying-glass"
                        :placeholder="t('searchSkills')" size="xs" color="gray" variant="outline" />
                    </div>
                    <div class="space-y-1 max-h-64 overflow-y-auto">
                      <!-- Always show all standard D&D skills -->
                      <div v-for="skill in filteredSkills" :key="skill.name"
                        class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded p-2">
                        <div class="flex items-center space-x-2 flex-1 min-w-0">
                          <span class="text-sm font-medium text-white text-white truncate">{{ skill.name
                          }}</span>
                          <span v-if="skill.proficient"
                            class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded flex-shrink-0">{{
                              t('prof') }}</span>
                          <span v-if="skill.expertise"
                            class="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1 py-0.5 rounded flex-shrink-0">{{
                              t('exp') }}</span>
                        </div>
                        <span class="text-xs font-mono text-gray-600 text-zinc-400 ml-2">
                          {{ formatModifier(calculateSkillModifierForSkill(skill, activeCharacter)) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Attacks -->
                  <div class="bg-zinc-950 bg-zinc-900 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h6 class="text-sm font-medium text-white text-white flex items-center gap-2">
                        <UIcon name="i-heroicons-bolt" class="w-4 h-4 text-red-500" />
                        {{ t('attacks') }}
                      </h6>
                    </div>

                    <div v-if="activeCharacter.attacks && activeCharacter.attacks.length > 0" class="space-y-2">
                      <div v-for="attack in activeCharacter.attacks" :key="attack.id || attack.name"
                        class="bg-gray-100 dark:bg-gray-700 rounded p-3">
                        <div class="flex items-center justify-between mb-2">
                          <h5 class="font-medium text-white text-white text-sm">
                            {{ attack.name || t('unnamedAttack') }}
                          </h5>
                          <div class="flex items-center space-x-1">
                            <UButton color="blue" size="xs" @click="rollAttack(attack)" :loading="isRollingAttack"
                              icon="i-heroicons-cube">
                              {{ t('attack') }}
                            </UButton>
                            <UButton v-if="attack.damage" color="red" size="xs" @click="rollDamage(attack)"
                              :loading="isRollingAttack" icon="i-heroicons-fire">
                              {{ t('damage') }}
                            </UButton>
                          </div>
                        </div>
                        <div class="text-xs text-gray-600 text-zinc-400 space-y-1">
                          <div v-if="attack.attackBonus !== undefined" class="flex justify-between">
                            <span class="font-medium">{{ t('attackBonus') }}:</span>
                            <span class="font-mono">{{ attack.attackBonus >= 0 ? '+' : '' }}{{ attack.attackBonus
                            }}</span>
                          </div>
                          <div v-if="attack.damage" class="flex justify-between">
                            <span class="font-medium">{{ t('damage') }}:</span>
                            <span class="font-mono">{{ attack.damage }}</span>
                          </div>
                          <div v-if="attack.damageType" class="flex justify-between">
                            <span class="font-medium">{{ t('damageType') }}:</span>
                            <span>{{ attack.damageType }}</span>
                          </div>
                          <div v-if="attack.rangeText" class="flex justify-between">
                            <span class="font-medium">{{ t('range') }}:</span>
                            <span>{{ attack.rangeText }}</span>
                          </div>
                          <div v-if="attack.properties" class="flex justify-between">
                            <span class="font-medium">{{ t('properties') }}:</span>
                            <span>{{ attack.properties }}</span>
                          </div>
                          <div v-if="attack.notes" class="text-xs mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            {{ attack.notes }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-else class="text-center py-4 text-zinc-400 text-zinc-400 text-sm">
                      <UIcon name="i-heroicons-bolt-slash" class="w-6 h-6 mx-auto mb-2 text-zinc-600" />
                      {{ t('noAttacksConfigured') }}
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-8">
                  <div class="text-4xl mb-4 flex justify-center">
                    <UIcon name="i-heroicons-user" class="w-12 h-12 text-zinc-600" />
                  </div>
                  <p class="text-zinc-400 text-zinc-400">
                    {{ t('selectCharacter') }}
                  </p>
                </div>
              </div>

              <!-- DM Player Management (only for DMs) -->
              <div v-else>
                <div class="mb-4">
                  <div class="flex items-center justify-between">
                    <h4 class="font-medium text-white text-white">{{ t('playerManagement') }}</h4>
                    <UButton v-if="currentRoom && currentRoom.code !== 'default'" color="blue" variant="outline"
                      size="xs" @click="loadAllPlayersStats(currentRoom.code)" icon="i-heroicons-arrow-path">
                      {{ t('refresh') }}
                    </UButton>
                  </div>
                </div>

                <div v-if="allPlayers.length > 0" class="space-y-3">
                  <div v-for="player in allPlayers" :key="player.userId"
                    class="border border-zinc-800 border-zinc-800 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center space-x-2">
                        <span class="font-medium text-white text-white">{{ player.name }}</span>
                        <span class="text-xs text-zinc-400 text-zinc-400">({{ player.userId }})</span>
                      </div>
                      <div class="flex items-center space-x-2">
                        <UButton color="green" variant="outline" size="xs" @click="requestRollFromPlayer(player)"
                          icon="i-heroicons-cube">
                          {{ t('requestRoll') }}
                        </UButton>
                        <UButton color="blue" variant="outline" size="xs" @click="editPlayerStats(player)"
                          icon="i-heroicons-pencil">
                          {{ t('edit') }}
                        </UButton>
                      </div>
                    </div>

                    <div class="text-xs text-zinc-400 text-zinc-400 space-y-1">
                      <div>{{ t('str') }}: {{ player.stats.abilities.strength }} | {{ t('dex') }}: {{
                        player.stats.abilities.dexterity }} |
                        {{ t('con') }}: {{
                          player.stats.abilities.constitution }}</div>
                      <div>{{ t('int') }}: {{ player.stats.abilities.intelligence }} | {{ t('wis') }}: {{
                        player.stats.abilities.wisdom }} |
                        {{ t('cha') }}: {{
                          player.stats.abilities.charisma }}</div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-8">
                  <div class="text-4xl mb-4">👥</div>
                  <p class="text-zinc-400 text-zinc-400">
                    {{ isOfflineMode ? t('playerManagementOffline') : t('noPlayersConnected') }}
                  </p>
                </div>

              </div>
            </div>
          </div>

          <!-- Main content area -->
          <div class="transition-all duration-300 min-h-screen">
            <div class="px-4 sm:px-6 lg:px-8">

              <!-- Roll History - Top Section (only for DM) -->
              <UCard v-if="userRole === 'DM'" class="mb-8">
                <template #header>
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-white text-white">
                      🎯 {{ t('history') }}
                    </h3>
                    <UButton v-if="rollHistory.length > 0" color="gray" variant="ghost" size="xs" @click="clearHistory"
                      icon="i-heroicons-trash">
                      {{ t('clear') }}
                    </UButton>
                  </div>
                </template>

                <div v-if="rollHistory.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
                  <div v-for="roll in rollHistory" :key="roll.id"
                    class="border border-zinc-800 border-zinc-800 rounded-lg p-3"
                    :class="{ 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20': roll.isOwn }">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                          <span class="text-sm font-medium"
                            :class="roll.isOwn ? 'text-blue-900 dark:text-blue-100' : 'text-white text-white'">
                            {{ roll.userName }}
                          </span>
                          <span class="text-xs text-zinc-400 text-zinc-400">
                            {{ formatTime(roll.timestamp) }}
                          </span>
                        </div>
                        <!-- Dice Visual Display -->
                        <div class="flex flex-wrap gap-1 mb-2">
                          <div v-for="(diceResult, index) in roll.diceResults" :key="index"
                            class="relative inline-block">
                            <img :src="`/assets/dices/${diceResult.type.toUpperCase()}.svg`" :alt="diceResult.type"
                              class="w-8 h-8" />
                            <span
                              class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                              {{ diceResult.result }}
                            </span>
                          </div>
                        </div>

                        <div v-if="roll.details.length > 1" class="text-xs text-zinc-400 text-zinc-400 mb-1">
                          ({{ roll.details.join(' + ') }})
                        </div>

                        <div v-if="roll.isCritical" class="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                          {{ roll.criticalType === 'success' ? `🎯 ${t('criticalSuccess')}` : `💥
                          ${t('criticalFailure')}`
                          }}
                        </div>
                      </div>
                      <!-- Sumatoria a la derecha -->
                      <div class="ml-4">
                        <span class="text-lg font-bold"
                          :class="roll.isCritical ? (roll.criticalType === 'success' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400') : 'text-white text-white'">
                          {{ roll.total }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-8">
                  <div class="text-4xl mb-4">🎲</div>
                  <p class="text-zinc-400 text-zinc-400">
                    {{ t('noRolls') }}
                  </p>
                </div>
              </UCard>

              <!-- Layout condicional: 2 columnas para players, 3 para DM -->
              <!-- Solo mostrar dados si hay una sesión válida -->
              <div v-if="shouldShowDiceInterface"
                :class="userRole === 'DM' ? 'grid grid-cols-1 lg:grid-cols-3 gap-8' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'">
                <!-- Dice Selection - Left column for both -->
                <div :class="userRole === 'DM' ? 'lg:col-span-2 space-y-6' : 'space-y-6'" class="order-1">
                  <!-- Dice Selection Card -->
                  <UCard>
                    <template #header>
                      <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-white text-white">
                          🎲 {{ t('selectDice') }}
                        </h3>
                        <div v-if="totalDiceSelected > 0" class="text-sm text-zinc-400 text-zinc-400">
                          {{ totalDiceSelected }} {{ t('diceSelected') }}
                        </div>
                      </div>
                    </template>

                    <div class="space-y-6">
                      <!-- Dice Grid -->
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div v-for="dice in diceTypes" :key="dice.type" class="flex flex-col items-center space-y-2">
                          <div class="text-center">
                            <div
                              class="relative inline-block cursor-pointer hover:scale-110 transition-transform duration-200"
                              @click="rollSingleDiceType(dice.type)">
                              <img :src="`/assets/dices/${dice.name}.svg`" :alt="dice.name" class="w-12 h-12" />
                              <span
                                class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                                {{ dice.sides }}
                              </span>
                            </div>
                          </div>
                          <div class="flex items-center space-x-2">
                            <UButton color="gray" variant="outline" size="xs"
                              @click="selectedDice[dice.type] = Math.max(0, selectedDice[dice.type] - 1)"
                              icon="i-heroicons-minus" :disabled="selectedDice[dice.type] <= 0" />
                            <span class="w-8 text-center text-sm font-mono">{{ selectedDice[dice.type] }}</span>
                            <UButton color="gray" variant="outline" size="xs" @click="selectedDice[dice.type]++"
                              icon="i-heroicons-plus" />
                          </div>
                        </div>
                      </div>

                      <!-- Quick Roll Buttons -->
                      <div>
                        <h4 class="text-sm font-medium text-white text-white mb-3">{{ t('quickRolls') }}</h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <UButton v-for="roll in quickRolls" :key="roll.label" color="gray" variant="outline" size="sm"
                            @click="performQuickRoll(roll)" class="text-xs">
                            {{ roll.label }}
                          </UButton>
                        </div>
                      </div>

                      <!-- Modifier and Roll Type -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <UFormGroup :label="t('modifier')">
                          <UInput v-model.number="modifier" type="number" placeholder="0" />
                        </UFormGroup>
                        <UFormGroup :label="t('rollType')">
                          <USelect v-model="rollType" :options="rollTypeOptions" />
                        </UFormGroup>
                      </div>

                      <!-- Roll Button -->
                      <div class="text-center">
                        <UButton color="primary" size="lg" @click="rollDice"
                          :disabled="totalDiceSelected === 0 || isRolling" :loading="isRolling" icon="i-heroicons-play">
                          {{ t('roll') }} {{ totalDiceSelected }} {{ totalDiceSelected === 1 ? t('die') : t('dice') }}
                        </UButton>
                      </div>

                      <!-- Clear Selection -->
                      <div class="text-center">
                        <UButton color="gray" variant="ghost" size="sm" @click="clearSelection"
                          :disabled="totalDiceSelected === 0" icon="i-heroicons-x-mark">
                          {{ t('clearSelection') }}
                        </UButton>
                      </div>
                    </div>
                  </UCard>
                </div>

                <!-- Right Column - Roll History (Players) -->
                <div v-if="userRole !== 'DM'" class="space-y-6 order-2">
                  <UCard>
                    <template #header>
                      <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-white text-white">
                          🎯 {{ t('history') }}
                        </h3>
                        <UButton v-if="rollHistory.length > 0" color="gray" variant="ghost" size="xs"
                          @click="clearHistory" icon="i-heroicons-trash">
                          {{ t('clear') }}
                        </UButton>
                      </div>
                    </template>

                    <div v-if="rollHistory.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
                      <div v-for="roll in rollHistory" :key="roll.id"
                        class="border border-zinc-800 border-zinc-800 rounded-lg p-3"
                        :class="{ 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20': roll.isOwn }">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-1">
                              <span class="text-sm font-medium"
                                :class="roll.isOwn ? 'text-blue-900 dark:text-blue-100' : 'text-white text-white'">
                                {{ roll.userName }}
                              </span>
                              <span class="text-xs text-zinc-400 text-zinc-400">
                                {{ formatTime(roll.timestamp) }}
                              </span>
                            </div>
                            <!-- Dice Visual Display -->
                            <div class="flex flex-wrap gap-1 mb-2">
                              <div v-for="(diceResult, index) in roll.diceResults" :key="index"
                                class="relative inline-block">
                                <img :src="`/assets/dices/${diceResult.type.toUpperCase()}.svg`" :alt="diceResult.type"
                                  class="w-8 h-8" />
                                <span
                                  class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                                  {{ diceResult.result }}
                                </span>
                              </div>
                            </div>

                            <div v-if="roll.details.length > 1" class="text-xs text-zinc-400 text-zinc-400 mb-1">
                              ({{ roll.details.join(' + ') }})
                            </div>

                            <div v-if="roll.isCritical"
                              class="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                              {{ roll.criticalType === 'success' ? `🎯 ${t('criticalSuccess')}` : `💥
                              ${t('criticalFailure')}` }}
                            </div>
                          </div>
                          <!-- Sumatoria a la derecha -->
                          <div class="ml-4">
                            <span class="text-lg font-bold"
                              :class="roll.isCritical ? (roll.criticalType === 'success' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400') : 'text-white text-white'">
                              {{ roll.total }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-else class="text-center py-8">
                      <div class="text-4xl mb-4">🎲</div>
                      <p class="text-zinc-400 text-zinc-400">
                        {{ t('noRolls') }}
                      </p>
                    </div>
                  </UCard>
                </div>

                <!-- Right Column - DM Panel -->
                <div v-if="userRole === 'DM'" class="space-y-6">
                  <!-- Battle Mode Panel (DM Only) -->
                  <UCard v-if="userRole === 'DM' && currentRoom && currentRoom.code !== 'default'">
                    <template #header>
                      <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-white text-white">
                          ⚔️ {{ t('battleMode') }}
                        </h3>
                        <div class="flex items-center space-x-2">
                          <UBadge v-if="isInBattle" :color="getBattlePhaseColor(battleMode.phase)" variant="soft">
                            {{ getBattlePhaseLabel(battleMode.phase) }}
                          </UBadge>
                          <UButton v-if="!isInBattle" color="red" size="sm" @click="startBattle"
                            :loading="isBattleLoading" icon="i-heroicons-play">
                            {{ t('startBattleSetup') }}
                          </UButton>
                          <UButton v-else color="gray" size="sm" @click="endBattle" :loading="isBattleLoading"
                            icon="i-heroicons-stop">
                            {{ t('endBattle') }}
                          </UButton>
                        </div>
                      </div>
                    </template>

                    <div v-if="!isInBattle" class="text-center py-8">
                      <div class="text-4xl mb-4">⚔️</div>
                      <h4 class="font-medium text-white text-white mb-2">{{ t('readyForBattle') }}</h4>
                      <p class="text-sm text-zinc-400 text-zinc-400 mb-4">
                        {{ t('readyForBattleDesc') }}
                      </p>
                    </div>

                    <!-- Battle Setup Phase -->
                    <div v-else-if="battleMode.phase === 'setup'" class="space-y-4">
                      <div
                        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div class="flex items-start space-x-3">
                          <UIcon name="i-heroicons-information-circle"
                            class="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div>
                            <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">{{ t('battleSetupPhase') }}
                            </h4>
                            <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              {{ t('battleSetupDesc') }}
                            </p>
                          </div>
                        </div>
                      </div>

                      <!-- Player Management -->
                      <div>
                        <div class="flex items-center justify-between mb-3">
                          <h4 class="text-sm font-medium text-white text-white">{{ t('playerSelection') }}</h4>
                          <UButton color="gray" variant="outline" size="xs" @click="loadBattlePlayers"
                            :loading="isBattlePlayersLoading" icon="i-heroicons-arrow-path">
                            {{ t('refresh') }}
                          </UButton>
                        </div>

                        <!-- Selected Players -->
                        <div v-if="selectedPlayers.length > 0" class="mb-3">
                          <h5 class="text-xs font-medium text-green-900 dark:text-green-100 mb-2">{{
                            t('selectedPlayers') }}
                          </h5>
                          <div class="space-y-1">
                            <div v-for="player in selectedPlayers" :key="player.userId"
                              class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                              <div class="flex-1">
                                <div class="font-medium text-green-900 dark:text-green-100">{{ player.name }}</div>
                                <div class="text-xs text-green-700 dark:text-green-300">{{ t('readyForBattleStatus') }}
                                </div>
                              </div>
                              <UButton color="red" variant="ghost" size="xs"
                                @click="removePlayerFromBattle(player.userId)" icon="i-heroicons-minus">
                              </UButton>
                            </div>
                          </div>
                        </div>

                        <!-- Available Players -->
                        <div v-if="unselectedPlayers.length > 0" class="mb-3">
                          <h5 class="text-xs font-medium text-gray-600 text-zinc-400 mb-2">{{ t('availablePlayers') }}
                          </h5>
                          <div class="space-y-1">
                            <div v-for="player in unselectedPlayers" :key="player.userId"
                              class="flex items-center justify-between p-2 bg-zinc-950 bg-zinc-900 border border-zinc-800 border-zinc-800 rounded">
                              <div class="flex-1">
                                <div class="font-medium text-white dark:text-gray-100">{{ player.name }}</div>
                                <div class="text-xs text-zinc-400 text-zinc-400">{{ t('clickToAdd') }}</div>
                              </div>
                              <UButton color="green" variant="ghost" size="xs" @click="addPlayerToBattle(player.userId)"
                                icon="i-heroicons-plus">
                              </UButton>
                            </div>
                          </div>
                        </div>

                        <!-- No Players State -->
                        <div
                          v-if="selectedPlayers.length === 0 && unselectedPlayers.length === 0 && !isBattlePlayersLoading"
                          class="text-center py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                          <div class="text-2xl mb-2">👥</div>
                          <p class="text-zinc-400 text-zinc-400 text-sm mb-3">
                            {{ t('noPlayersConnected') }}
                          </p>
                          <p class="text-xs text-gray-400 dark:text-zinc-400">
                            {{ t('playersNeedToJoin') }}
                          </p>
                        </div>
                      </div>

                      <!-- Enemy Management -->
                      <div>
                        <div class="flex items-center justify-between mb-3">
                          <h4 class="text-sm font-medium text-white text-white">{{ t('enemySetup') }}</h4>
                          <UButton color="green" variant="outline" size="xs" @click="showAddEnemyModal = true"
                            icon="i-heroicons-plus">
                            {{ t('addEnemy') }}
                          </UButton>
                        </div>

                        <div v-if="battleMode.enemies && Object.keys(battleMode.enemies).length > 0" class="space-y-2">
                          <div v-for="enemy in Object.values(battleMode.enemies) as Enemy[]" :key="enemy.id"
                            class="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                            <div class="flex-1">
                              <div class="font-medium text-red-900 dark:text-red-100">{{ enemy.name }}</div>
                              <div class="text-xs text-red-700 dark:text-red-300">
                                HP: {{ enemy.hitPoints.current }}/{{ enemy.hitPoints.max }} | AC: {{ enemy.armorClass }}
                                |
                                Init: {{ enemy.initiative >= 0 ? '+' : '' }}{{ enemy.initiative }}
                              </div>
                            </div>
                            <div class="flex items-center space-x-1">
                              <UButton color="red" variant="ghost" size="xs" @click="removeEnemy(enemy.id)"
                                icon="i-heroicons-trash">
                              </UButton>
                            </div>
                          </div>
                        </div>

                        <div v-else
                          class="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                          <div class="text-2xl mb-2">👹</div>
                          <p class="text-zinc-400 text-zinc-400 text-sm mb-3">
                            {{ t('noEnemiesAdded') }}
                          </p>
                          <UButton color="green" variant="outline" size="sm" @click="showAddEnemyModal = true"
                            icon="i-heroicons-plus">
                            {{ t('addFirstEnemy') }}
                          </UButton>
                        </div>
                      </div>

                      <!-- Ready to Roll Initiative -->
                      <div
                        v-if="battleMode.enemies && Object.keys(battleMode.enemies).length > 0 && selectedPlayers.length > 0"
                        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div class="text-center">
                          <div class="text-green-900 dark:text-green-100 font-medium mb-2">
                            {{ t('readyToStartCombat') }}
                          </div>
                          <p class="text-sm text-green-700 dark:text-green-300 mb-3">
                            {{ selectedPlayers.length }} {{ t('combatReadyDesc') }}
                          </p>
                          <UButton color="green" size="sm" @click="rollInitiative" icon="i-heroicons-play">
                            {{ t('rollInitiativeAndStart') }}
                          </UButton>
                        </div>
                      </div>

                      <!-- Missing Players or Enemies Warning -->
                      <div
                        v-else-if="battleMode.enemies && Object.keys(battleMode.enemies).length > 0 && selectedPlayers.length === 0"
                        class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div class="text-center">
                          <div class="text-yellow-900 dark:text-yellow-100 font-medium mb-2">
                            {{ t('playersNeeded') }}
                          </div>
                          <p class="text-sm text-yellow-700 dark:text-yellow-300">
                            {{ t('addPlayerWarning') }}
                          </p>
                        </div>
                      </div>

                      <div
                        v-else-if="selectedPlayers.length > 0 && (!battleMode.enemies || Object.keys(battleMode.enemies).length === 0)"
                        class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div class="text-center">
                          <div class="text-yellow-900 dark:text-yellow-100 font-medium mb-2">
                            {{ t('enemiesNeeded') }}
                          </div>
                          <p class="text-sm text-yellow-700 dark:text-yellow-300">
                            {{ t('addEnemyWarning') }}
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Active Combat Phase -->
                    <div v-else-if="battleMode.phase === 'combat'" class="space-y-4">
                      <!-- Enemy Management -->
                      <div>
                        <div class="flex items-center justify-between mb-3">
                          <h4 class="text-sm font-medium text-white text-white">{{ t('enemies') }}</h4>
                          <UButton color="green" variant="outline" size="xs" @click="showAddEnemyModal = true"
                            icon="i-heroicons-plus">
                            {{ t('addEnemy') }}
                          </UButton>
                        </div>

                        <div v-if="battleMode.enemies && Object.keys(battleMode.enemies).length > 0" class="space-y-2">
                          <div v-for="enemy in Object.values(battleMode.enemies) as Enemy[]" :key="enemy.id"
                            class="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                            <div class="flex-1">
                              <div class="font-medium text-red-900 dark:text-red-100">{{ enemy.name }}</div>
                              <div class="text-xs text-red-700 dark:text-red-300">
                                HP: {{ enemy.hitPoints.current }}/{{ enemy.hitPoints.max }} | AC: {{ enemy.armorClass }}
                              </div>
                            </div>
                            <div class="flex items-center space-x-1">
                              <UButton color="red" variant="ghost" size="xs" @click="dealDamageToEnemy(enemy)"
                                icon="i-heroicons-minus">
                              </UButton>
                              <UButton color="red" variant="ghost" size="xs" @click="removeEnemy(enemy.id)"
                                icon="i-heroicons-trash">
                              </UButton>
                            </div>
                          </div>
                        </div>

                        <div v-else class="text-center py-4 text-zinc-400 text-zinc-400 text-sm">
                          {{ t('noEnemiesInBattle') }}
                        </div>
                      </div>

                      <!-- Initiative Tracker -->
                      <div v-if="battleMode.initiativeOrder && battleMode.initiativeOrder.length > 0">
                        <div class="flex items-center justify-between mb-3">
                          <h4 class="text-sm font-medium text-white text-white">{{ t('initiativeOrder') }}</h4>
                          <div class="flex items-center space-x-2">
                            <UButton v-if="battleMode.phase === 'setup'" color="blue" variant="outline" size="xs"
                              @click="rollInitiative" icon="i-heroicons-arrow-path">
                              {{ t('rollInitiative') }}
                            </UButton>
                            <UButton v-else-if="battleMode.phase === 'combat'" color="green" variant="outline" size="xs"
                              @click="nextTurn" icon="i-heroicons-arrow-right">
                              {{ t('nextTurn') }}
                            </UButton>
                          </div>
                        </div>

                        <div class="space-y-1">
                          <div v-for="(participant, index) in battleMode.initiativeOrder" :key="participant.id"
                            class="flex items-center justify-between p-2 rounded"
                            :class="index === battleMode.currentTurnIndex ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-zinc-950 bg-zinc-900 border border-zinc-800 border-zinc-800'">
                            <div class="flex items-center space-x-2">
                              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                :class="index === battleMode.currentTurnIndex ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'">
                                {{ index + 1 }}
                              </div>
                              <span class="font-medium"
                                :class="index === battleMode.currentTurnIndex ? 'text-green-900 dark:text-green-100' : 'text-white text-white'">
                                {{ participant.name }}
                              </span>
                              <UBadge :color="participant.type === 'player' ? 'blue' : 'red'" variant="soft" size="xs">
                                {{ t(participant.type) }}
                              </UBadge>
                            </div>
                            <div class="text-sm font-mono"
                              :class="index === battleMode.currentTurnIndex ? 'text-green-700 dark:text-green-300' : 'text-zinc-400 text-zinc-400'">
                              {{ participant.initiativeRoll }} ({{ participant.initiative >= 0 ? '+' : '' }}{{
                                participant.initiative }})
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
                        <h3 class="text-lg font-semibold text-white text-white">
                          ⚔️ {{ t('battleInProgress') }}
                        </h3>
                        <UBadge color="green" variant="soft">
                          {{ battleMode.phase }}
                        </UBadge>
                      </div>
                    </template>

                    <div class="space-y-4">
                      <!-- Current Turn Display -->
                      <div
                        v-if="battleMode.phase === 'combat' && battleMode.initiativeOrder && battleMode.currentTurnIndex !== undefined"
                        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div class="text-center">
                          <div class="text-lg font-bold text-green-900 dark:text-green-100">
                            {{ t('currentTurn') }}
                          </div>
                          <div class="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                            {{ battleMode.initiativeOrder[battleMode.currentTurnIndex]?.name || t('unknown') }}
                          </div>
                          <UBadge
                            :color="battleMode.initiativeOrder[battleMode.currentTurnIndex]?.type === 'player' ? 'blue' : 'red'"
                            variant="soft" class="mt-2">
                            {{ battleMode.initiativeOrder[battleMode.currentTurnIndex]?.type ?
                              t(battleMode.initiativeOrder[battleMode.currentTurnIndex]?.type) : t('unknown') }}
                          </UBadge>
                        </div>
                      </div>

                      <!-- Character Attacks Section (only show during player's turn) -->
                      <div
                        v-if="battleMode.phase === 'combat' && battleMode.initiativeOrder && battleMode.currentTurnIndex !== undefined && isPlayerTurn()"
                        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                          <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">
                            ⚔️ {{ t('yourAttacks') }}
                          </h4>
                          <UButton color="blue" variant="ghost" size="xs"
                            :icon="showCharacterAttacks ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                            @click="showCharacterAttacks = !showCharacterAttacks">
                            {{ showCharacterAttacks ? t('hide') : t('show') }}
                          </UButton>
                        </div>

                        <div v-if="showCharacterAttacks">
                          <div v-if="activeCharacterAttacks.length > 0" class="space-y-2">
                            <div v-for="attack in activeCharacterAttacks" :key="attack.id || attack.name"
                              class="bg-zinc-900 bg-zinc-900 border border-blue-200 dark:border-blue-700 rounded p-3">
                              <div class="flex items-center justify-between mb-2">
                                <h5 class="font-medium text-white text-white">
                                  {{ attack.name || t('unnamedAttack') }}
                                </h5>
                                <div class="flex items-center space-x-2">
                                  <UButton color="blue" size="xs" @click="rollAttack(attack)" :loading="isRollingAttack"
                                    icon="i-heroicons-cube">
                                    {{ t('attack') }}
                                  </UButton>
                                  <UButton v-if="attack.damage" color="red" size="xs" @click="rollDamage(attack)"
                                    :loading="isRollingAttack" icon="i-heroicons-fire">
                                    {{ t('damage') }}
                                  </UButton>
                                </div>
                              </div>
                              <div class="text-sm text-gray-600 text-zinc-400 space-y-1">
                                <div v-if="attack.attackBonus !== undefined">
                                  <span class="font-medium">{{ t('attackBonus') }}:</span>
                                  {{ attack.attackBonus >= 0 ? '+' : '' }}{{ attack.attackBonus }}
                                </div>
                                <div v-if="attack.damage">
                                  <span class="font-medium">{{ t('damage') }}:</span> {{ attack.damage }}
                                </div>
                                <div v-if="attack.rangeText">
                                  <span class="font-medium">{{ t('range') }}:</span> {{ attack.rangeText }}
                                </div>
                                <div v-if="attack.notes" class="text-xs">
                                  {{ attack.notes }}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div v-else class="text-center py-4 text-blue-600 dark:text-blue-400 text-sm">
                            {{ t('noAttacksConfigured') }}
                          </div>
                        </div>
                      </div>

                      <!-- Initiative Order (Player View) -->
                      <div v-if="battleMode.initiativeOrder && battleMode.initiativeOrder.length > 0">
                        <h4 class="text-sm font-medium text-white text-white mb-3">{{ t('initiativeOrder') }}</h4>
                        <div class="space-y-1">
                          <div v-for="(participant, index) in battleMode.initiativeOrder" :key="participant.id"
                            class="flex items-center justify-between p-2 rounded"
                            :class="index === battleMode.currentTurnIndex ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-zinc-950 bg-zinc-900 border border-zinc-800 border-zinc-800'">
                            <div class="flex items-center space-x-2">
                              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                :class="index === battleMode.currentTurnIndex ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'">
                                {{ index + 1 }}
                              </div>
                              <span class="font-medium"
                                :class="index === battleMode.currentTurnIndex ? 'text-green-900 dark:text-green-100' : 'text-white text-white'">
                                {{ participant.name }}
                              </span>
                              <UBadge :color="participant.type === 'player' ? 'blue' : 'red'" variant="soft" size="xs">
                                {{ participant.type }}
                              </UBadge>
                            </div>
                            <div class="text-sm font-mono"
                              :class="index === battleMode.currentTurnIndex ? 'text-green-700 dark:text-green-300' : 'text-zinc-400 text-zinc-400'">
                              {{ participant.initiativeRoll }} ({{ participant.initiative >= 0 ? '+' : '' }}{{
                                participant.initiative }})
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Battle Phase Info -->
                      <div v-if="battleMode.phase === 'setup'"
                        class="text-center py-4 text-zinc-400 text-zinc-400 text-sm">
                        <div class="text-2xl mb-2">⏳</div>
                        <p>{{ t('waitingForDm') }}</p>
                      </div>
                    </div>
                  </UCard>
                </div>
              </div>

              <!-- Mensaje cuando no hay sesión activa -->
              <div v-else class="text-center py-16">
                <div class="text-8xl mb-6">🎲</div>
                <h2 class="text-2xl font-bold text-white text-white mb-4">
                  {{ t('noActiveSession') }}
                </h2>
                <div v-if="userRole === 'DM'" class="space-y-4">
                  <p class="text-lg text-gray-600 text-zinc-400 mb-6">
                    {{ t('dmStartMessage') }}
                  </p>
                  <div class="flex justify-center space-x-4">
                    <UButton color="primary" size="lg" @click="showCreateRoom = true" icon="i-heroicons-plus">
                      {{ t('createNewRoom') }}
                    </UButton>
                    <div class="text-gray-400 dark:text-zinc-400 flex items-center">{{ t('or') }}</div>
                    <div class="flex items-center space-x-2">
                      <UInput v-model="joinRoomCode" :placeholder="t('enterRoomCode')" class="w-48"
                        @keyup.enter="joinExistingRoom" />
                      <UButton color="gray" @click="joinExistingRoom" :disabled="!joinRoomCode.trim()"
                        icon="i-heroicons-arrow-right-on-rectangle">
                        {{ t('joinRoom') }}
                      </UButton>
                    </div>
                  </div>
                </div>
                <div v-else class="space-y-4">
                  <p class="text-lg text-gray-600 text-zinc-400 mb-6">
                    {{ t('playerStartMessage') }}
                  </p>
                  <div class="flex justify-center">
                    <div class="flex items-center space-x-2">
                      <UInput v-model="joinRoomCode" :placeholder="t('enterRoomCodeFromDm')" class="w-64"
                        @keyup.enter="joinExistingRoom" />
                      <UButton color="primary" @click="joinExistingRoom" :disabled="!joinRoomCode.trim()"
                        icon="i-heroicons-arrow-right-on-rectangle">
                        {{ t('joinRoom') }}
                      </UButton>
                    </div>
                  </div>
                  <div
                    class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mx-auto max-w-md">
                    <div class="flex items-start space-x-2">
                      <UIcon name="i-heroicons-information-circle"
                        class="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <span class="font-medium text-blue-900 dark:text-blue-100">{{ t('needRoomCode') }}</span>
                        <span class="text-blue-800 dark:text-blue-200 block text-sm mt-1">
                          {{ t('askDmForCode') }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Topographical Map Section -->
        <!-- <div class="mt-12 border-t border-zinc-800 border-zinc-800 pt-8"> -->
        <!--   <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> -->
        <!--     <div class="mb-6"> -->
        <!--       <h2 class="text-2xl font-bold text-white text-white mb-2"> -->
        <!--         🗺️ {{ t('campaignMap') }} -->
        <!--       </h2> -->
        <!--       <p class="text-gray-600 text-zinc-400"> -->
        <!--         {{ t('campaignMapDesc') }} -->
        <!--       </p> -->
        <!--     </div> -->
        <!--     <TopoMap @zone-selected="handleMapZoneSelected" :zones="campaignZones" /> -->
        <!--   </div> -->
        <!-- </div> -->
    </main>
    <!-- Room Creation Modal -->
    <UModal v-model="showCreateRoom" :ui="{ width: 'max-w-md' }">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white text-white">
            🏠 {{ t('createNewRoom') }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showCreateRoom = false" />
        </div>

        <div class="space-y-4">
          <div class="text-center py-4">
            <div class="text-6xl mb-4">🎲</div>
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              {{ t('createRoomDesc') }}
            </p>
            <p class="text-sm text-zinc-400 text-zinc-400">
              {{ t('createRoomNote') }}
            </p>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-8">
          <UButton color="gray" variant="outline" @click="showCreateRoom = false">
            {{ t('cancel') }}
          </UButton>
          <UButton color="primary" @click="createRoom" icon="i-heroicons-plus">
            {{ t('createRoom') }}
          </UButton>
        </div>
      </div>
    </UModal>

    <!-- DM Roll Request Modal -->
    <UModal v-model="showRollRequestModal" :ui="{ width: 'max-w-md' }">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white text-white">
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
          <UButton color="primary" @click="sendRollRequest" :disabled="!requestedDiceType"
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
          <h3 class="text-lg font-semibold text-white text-white">
            {{ t('editStatsFor') }} {{ editingPlayer?.name }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="closeEditModal" />
        </div>

        <div v-if="editingPlayerStats" class="space-y-6">
          <!-- Hit Points -->
          <div>
            <h4 class="text-sm font-medium text-white text-white mb-3">{{ t('health') }}</h4>
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
            <h4 class="text-sm font-medium text-white text-white mb-3">{{ t('coreStats') }}</h4>
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
            <h4 class="text-sm font-medium text-white text-white mb-3">{{ t('abilityScores') }}</h4>
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
          <UButton color="primary" @click="savePlayerStats" :disabled="!editingPlayerStats">
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
          <h3 class="text-lg font-semibold text-white text-white mb-2">
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
            class="text-sm text-gray-600 text-zinc-400 mb-4">
            {{ t('modifier') }}: {{ pendingRollRequest.modifier > 0 ? '+' : '' }}{{ pendingRollRequest.modifier }}
          </div>

          <div class="flex justify-center space-x-3">
            <UButton color="gray" variant="outline" @click="declineRollRequest">
              {{ t('decline') }}
            </UButton>
            <UButton color="primary" @click="acceptRollRequest" icon="i-heroicons-cube">
              {{ t('roll') }} {{ pendingRollRequest?.diceType }}
            </UButton>
          </div>
        </div>
      </div>
    </UModal>

    <!-- Add Enemy Modal -->
    <UModal v-model="showAddEnemyModal" :ui="{ width: 'max-w-md' }">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-white text-white mb-4">
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
            <UButton color="gray" variant="outline" @click="showAddEnemyModal = false">
              {{ t('cancel') }}
            </UButton>
            <UButton color="green" @click="addEnemy" :disabled="!newEnemy.name || !newEnemy.hitPoints">
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
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showDmImageModal = false" />
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
            " />
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
            <UButton color="gray" variant="ghost" @click="showDmImageModal = false">{{ t('cancel') }}</UButton>
            <UButton color="purple" :loading="isSendingImage" @click="sendDmImage">{{ t('showToPlayers') }}</UButton>
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
          @click="showImageDisplayModal = false" />
      </div>
    </UModal>

    <!-- Critical Roll Animation Modal -->
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-300" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-active-class="transition-opacity duration-300" leave-from-class="opacity-100"
        leave-to-class="opacity-0">
        <div v-if="showCriticalAnimation"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div class="relative w-full h-full flex items-center justify-center p-4">
            <video v-if="criticalAnimationType === 'success'" src="/assets/animations/d20-20.mp4" autoplay muted
              class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              @ended="showCriticalAnimation = false" />
            <video v-else-if="criticalAnimationType === 'failure'" src="/assets/animations/d20-1.mp4" autoplay muted
              class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              @ended="showCriticalAnimation = false" />
            <!-- Close button -->
            <UButton color="white" variant="ghost" size="sm" icon="i-heroicons-x-mark"
              class="absolute top-4 right-4 z-10 text-white hover:bg-zinc-900 hover:bg-opacity-20"
              @click="showCriticalAnimation = false" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// SSE-based dice room implementation (replaces Socket.IO)

// Battle mode interfaces
interface Enemy {
  id: string
  name: string
  hitPoints: { current: number; max: number }
  armorClass: number
  initiative: number
  initiativeRoll?: number
  isDefeated: boolean
  createdBy: string // DM userId who created this enemy
}

interface BattleParticipant {
  id: string
  name: string
  type: 'player' | 'enemy'
  initiative: number
  initiativeRoll: number
  hitPoints: { current: number; max: number }
  armorClass: number
  isDefeated: boolean
  userId?: string // Only for players
}

interface BattleState {
  isActive: boolean
  round: number
  currentTurnIndex: number
  phase: 'setup' | 'combat' | 'ended'
  initiativeOrder: BattleParticipant[]
  enemies: { [key: string]: Enemy }
  selectedPlayerIds: Set<string>
}

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
  diceResults: { type: string; result: number }[]
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

// Component imports
import TopoMap from '~/components/TopoMap.vue'

// Translations
const { t, toggleLanguage, language } = useTranslations()

// Get authenticated user
const user = useState<any>('user')

// Campaign zones for the topographical map - Updated for Pilotes
const campaignZones = ref([
  {
    name: "PALERMO",
    description: "Elegante distrito residencial donde vive la nobleza y los comerciantes prósperos. Sus calles empedradas y mansiones reflejan el poder económico de la ciudad.",
    x: -6,
    z: 0,
    color: 0x8B4513
  },
  {
    name: "OPUS",
    description: "Vibrante centro artesanal donde los mejores craftsmen de Pilotes crean obras maestras. El sonido de martillos y el olor a metal forjado llenan el aire.",
    x: 6,
    z: 0,
    color: 0x4A4A4A
  },
  {
    name: "PUERTO",
    description: "Bullicioso distrito portuario donde llegan mercancías de tierras lejanas. Los muelles nunca descansan y siempre hay historias de aventura en las tabernas.",
    x: 8,
    z: 8,
    color: 0x1E90FF
  },
  {
    name: "Castillo Central",
    description: "Imponente fortaleza real que domina el corazón de Pilotes. Desde sus torres se puede ver toda la ciudad y las tierras circundantes.",
    x: 0,
    z: -4,
    color: 0xFFD700
  },
  {
    name: "LAFE",
    description: "Sereno lago de aguas cristalinas ubicado fuera de las murallas. Es un lugar de paz donde los ciudadanos van a reflexionar y los pescadores buscan su sustento.",
    x: -10,
    z: 10,
    color: 0x20B2AA
  },
  {
    name: "Las Murallas",
    description: "Poderosas fortificaciones de piedra que han protegido Pilotes durante siglos. Sus torres de vigilancia mantienen guardia constante contra cualquier amenaza.",
    x: 0,
    z: 6,
    color: 0x696969
  }
])

// Reactive state
const userRole = ref<'Player' | 'DM'>('Player')
const isConnected = ref(false)
const isOfflineMode = ref(false)
const isOfflineModePreference = ref(false) // Persistent offline mode preference
const connectedUsers = ref(1)
const isRolling = ref(false)
const eventSource = ref<EventSource | null>(null)
const animatingDice = ref<Set<string>>(new Set())

// Reconnection state
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5
const isReconnecting = ref(false)
const reconnectTimeout = ref<NodeJS.Timeout | null>(null)

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

// Heartbeat system to maintain session alive
const roomCodeForHeartbeat = computed(() => currentRoom.value?.code || '')
const { isHeartbeatActive, startHeartbeat, stopHeartbeat } = useHeartbeat(roomCodeForHeartbeat)

// Player stats (for current user if they're a player)
const playerStats = ref<PlayerStats | null>(null)

// Character attacks and combat data
const activeCharacterAttacks = ref<any[]>([])
const showCharacterAttacks = ref(false)
const isRollingAttack = ref(false)

// All players stats (for DMs)
const allPlayers = ref<Player[]>([])

// DM editing modal state
const isEditingPlayer = ref(false)
const editingPlayer = ref<Player | null>(null)
const editingPlayerStats = ref<PlayerStats | null>(null)

// Battle mode state
const battleMode = ref<BattleState | null>(null)
const isInBattle = computed(() => battleMode.value?.phase !== undefined)
const showBattleUI = ref(false)
const showAddEnemyModal = ref(false)
const newEnemy = ref({ name: '', hitPoints: 10, armorClass: 10, initiative: 0 })
const isBattleLoading = ref(false)
const showSpecialAbilitiesModal = ref(false)
const currentPlayerAbilities = ref<any[]>([])

// Character Detail Modal state (for DM)
const showCharacterDetailModal = ref(false)
const selectedCharacterForDetail = ref<any>(null)

// Active character data
const activeCharacter = computed(() => {
  return userCharacters.value.find(c => c.id === activeCharacterId.value) || null
})

const skillSearchQuery = ref('')

const filteredSkills = computed(() => {
  if (!activeCharacter.value) return []
  const skills = getAllSkills(activeCharacter.value)
  if (!skillSearchQuery.value) return skills

  const query = skillSearchQuery.value.toLowerCase()
  return skills.filter((skill: any) => skill.name.toLowerCase().includes(query))
})

const currentPlayerName = ref('')

// Battle player management
const selectedPlayers = ref<Array<{ userId: string; name: string }>>([])
const unselectedPlayers = ref<Array<{ userId: string; name: string }>>([])
const isBattlePlayersLoading = ref(false)

// Music system state
const musicState = ref({
  isPlaying: false,
  currentTrack: null as any,
  volume: 50,
  playlist: [] as any[],
  soundEffects: {
    soundEffectsVolume: 75,
    playableTrackIds: new Set<string>(),
    lastSoundEffectPlayed: null as Date | null
  }
})
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

// DM Show Image state
const showDmImageModal = ref(false)
const dmImageUrl = ref('')
const dmImageCaption = ref('')
const dmImageFile = ref<File | null>(null)
const isSendingImage = ref(false)

// Player Image Display state
const showImageDisplayModal = ref(false)
const displayedImageUrl = ref('')
const displayedImageCaption = ref('')
const imageDisplayTimeout = ref<any>(null)

function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    dmImageFile.value = input.files[0]
    // Create a preview URL
    dmImageUrl.value = URL.createObjectURL(input.files[0])
  }
}

async function sendDmImage() {
  const toast = useToast()
  if ((!dmImageUrl.value && !dmImageFile.value) || !currentRoom.value) return

  isSendingImage.value = true
  try {
    let finalImageUrl = dmImageUrl.value

    // If a file is selected, upload it first
    if (dmImageFile.value) {
      const formData = new FormData()
      formData.append('file', dmImageFile.value)

      const uploadResponse = await $fetch<{ url: string }>('/api/upload', {
        method: 'POST',
        body: formData
      } as any)

      finalImageUrl = uploadResponse.url
    }

    await $fetch('/api/dice/show-image', {
      method: 'POST',
      body: {
        userId: userId.value,
        roomCode: currentRoom.value.code,
        imageUrl: finalImageUrl,
        caption: dmImageCaption.value
      }
    })
    showDmImageModal.value = false
    dmImageUrl.value = ''
    dmImageCaption.value = ''
    dmImageFile.value = null

    // Show success toast
    toast.add({
      title: t('imageSent'),
      description: t('imageShownToPlayers'),
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
  } catch (error: any) {
    console.error('Failed to send image:', error)

    let errorMessage = t('imageSendFailed')
    if (error?.data?.statusMessage) {
      errorMessage = error.data.statusMessage
    } else if (error?.statusCode === 401) {
      errorMessage = 'Authentication required. Please log in again.'
    } else if (error?.statusCode === 403) {
      errorMessage = 'Access denied. DM or Admin role required.'
    } else if (error?.statusCode === 400) {
      errorMessage = 'Invalid file or no file uploaded.'
    }

    toast.add({
      title: t('error'),
      description: errorMessage,
      icon: 'i-heroicons-exclamation-circle',
      color: 'red'
    })
  } finally {
    isSendingImage.value = false
  }
}

// Player roll request notification
const showRollRequestNotification = ref(false)
const pendingRollRequest = ref<{
  fromDM: string
  diceType: string
  message?: string
  modifier?: number
  requestId: string
} | null>(null)

// Critical roll animation
const showCriticalAnimation = ref(false)
const criticalAnimationType = ref<'success' | 'failure' | null>(null)

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

// Determine if dice interface should be shown
const shouldShowDiceInterface = computed(() => {
  // Show dice interface only if:
  // 1. User is connected AND
  // 2. There's a current room AND 
  // 3. It's NOT the default room (only show dice in DM-created rooms)
  return isConnected.value && currentRoom.value && currentRoom.value.code !== 'default'
})

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
      if (userCharacters.value.length > 0) {
        userRole.value = 'Player'
        if (!activeCharacterId.value && userCharacters.value.length > 0) {
          activeCharacterId.value = userCharacters.value[0].id
          await loadCharacterStats()
        }
      } else {
        userRole.value = 'DM'
        playerStats.value = null
        activeCharacterId.value = null
        activeCharacterAttacks.value = []
      }

    } else {
      userCharacters.value = []
      userRole.value = 'DM'
    }
  } catch (error) {
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
    activeCharacterAttacks.value = []
    return
  }

  try {
    const character = userCharacters.value.find(c => c.id === activeCharacterId.value)
    if (character) {
      const realStats = {
        hitPoints: {
          current: character.currentHp || character.maxHp || 10,
          max: character.maxHp || 10
        },
        armorClass: character.armorClass || 10,
        abilities: {
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

      // Load character attacks
      activeCharacterAttacks.value = character.attacks || []

      // Show attacks automatically when in combat and it's player's turn
      showCharacterAttacks.value = isInBattle.value && isPlayerTurn()

      // Update the dice room store with the real character stats
      if (!isOfflineMode.value) {
        await updateStats()
      }
    } else {
      playerStats.value = createDefaultStats()
    }
  } catch (error) {
    playerStats.value = createDefaultStats()
  }
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
    'setup': t('setupPhase'),
    'rolling_initiative': t('rollingInitiativePhase'),
    'combat': t('activeCombatPhase'),
    'ended': t('battleEndedPhase')
  }
  return labelMap[phase] || t('unknownPhase')
}

function calculateTotalWealth(character: any): number {
  if (!character) return 0

  const copper = character.copperCoins || 0
  const silver = character.silverCoins || 0
  const electrum = character.electrumCoins || 0
  const gold = character.goldCoins || 0
  const platinum = character.platinumCoins || 0

  const total = (platinum * 100) + gold + (electrum * 0.5) + (silver * 0.1) + (copper * 0.01)
  return Math.round(total * 100) / 100 // Round to 2 decimal places
}

function calculateModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2)
}

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function calculateHealthPercentage(character: any): number {
  if (!character || !character.maxHp || character.maxHp === 0) return 0
  const current = character.currentHp || 0
  return Math.max(0, Math.min(100, (current / character.maxHp) * 100))
}

function calculateSavingThrowModifierByAbility(ability: string, character: any): number {
  if (!character) return 0

  // Get the base ability score
  const abilityScore = character[ability] || 10
  const abilityModifier = calculateModifier(abilityScore)

  // Check if proficient in this saving throw
  const proficient = getSavingThrowProficiency(ability, character)
  const proficiencyBonus = proficient ? (character.proficiencyBonus || 2) : 0

  return abilityModifier + proficiencyBonus
}

// Helper function to check if character is proficient in a saving throw
function getSavingThrowProficiency(ability: string, character: any): boolean {
  if (!character || !character.savingThrows) return false

  const savingThrow = character.savingThrows.find((st: any) =>
    st.ability.toLowerCase() === ability.toLowerCase()
  )

  return savingThrow ? savingThrow.proficient : false
}

function getAbilityAbbr(ability: string) {
  const key = ability.substring(0, 3).toLowerCase()
  return t(key as any)
}

// Helper function to get all D&D skills with character's proficiency
function getAllSkills(character: any): any[] {
  // Standard D&D 5e skills
  const standardSkills = [
    { name: 'Acrobatics', ability: 'DEX', key: 'skillAcrobatics' },
    { name: 'Animal Handling', ability: 'WIS', key: 'skillAnimalHandling' },
    { name: 'Arcana', ability: 'INT', key: 'skillArcana' },
    { name: 'Athletics', ability: 'STR', key: 'skillAthletics' },
    { name: 'Deception', ability: 'CHA', key: 'skillDeception' },
    { name: 'History', ability: 'INT', key: 'skillHistory' },
    { name: 'Insight', ability: 'WIS', key: 'skillInsight' },
    { name: 'Intimidation', ability: 'CHA', key: 'skillIntimidation' },
    { name: 'Investigation', ability: 'INT', key: 'skillInvestigation' },
    { name: 'Medicine', ability: 'WIS', key: 'skillMedicine' },
    { name: 'Nature', ability: 'INT', key: 'skillNature' },
    { name: 'Perception', ability: 'WIS', key: 'skillPerception' },
    { name: 'Performance', ability: 'CHA', key: 'skillPerformance' },
    { name: 'Persuasion', ability: 'CHA', key: 'skillPersuasion' },
    { name: 'Religion', ability: 'INT', key: 'skillReligion' },
    { name: 'Sleight of Hand', ability: 'DEX', key: 'skillSleightOfHand' },
    { name: 'Stealth', ability: 'DEX', key: 'skillStealth' },
    { name: 'Survival', ability: 'WIS', key: 'skillSurvival' }
  ]

  // Map character skills to standard skills
  return standardSkills.map(standardSkill => {
    const characterSkill = character?.skills?.find((skill: any) =>
      skill.name.toLowerCase() === standardSkill.name.toLowerCase()
    )

    return {
      name: t(standardSkill.key as any),
      ability: standardSkill.ability,
      proficient: characterSkill?.proficient || false,
      expertise: characterSkill?.expertise || false
    }
  })
}

// Helper function to calculate skill modifier for a specific skill object
function calculateSkillModifierForSkill(skill: any, character: any): number {
  if (!skill || !character) return 0

  const abilityMap: Record<string, string> = {
    'STR': 'strength',
    'DEX': 'dexterity',
    'CON': 'constitution',
    'INT': 'intelligence',
    'WIS': 'wisdom',
    'CHA': 'charisma'
  }

  const abilityField = abilityMap[skill.ability] || skill.ability.toLowerCase()
  const abilityScore = character[abilityField] || 10
  const abilityModifier = calculateModifier(abilityScore)

  let proficiencyBonus = 0
  if (skill.proficient) {
    proficiencyBonus = character.proficiencyBonus || 2
    if (skill.expertise) {
      proficiencyBonus *= 2
    }
  }

  return abilityModifier + proficiencyBonus
}

function toggleDice(diceType: string) {
  animatingDice.value.add(diceType)
  setTimeout(() => {
    animatingDice.value.delete(diceType)
  }, 500)

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

async function rollDice(customSelection?: Record<string, number> | any) {
  const diceSelection: Record<string, number> = (customSelection && typeof customSelection === 'object' && !customSelection.target)
    ? customSelection
    : selectedDice.value
  const totalSelected = Object.values(diceSelection).reduce((sum: number, count: number) => sum + count, 0)

  if (totalSelected === 0) return

  isRolling.value = true

  Object.entries(diceSelection).forEach(([diceType, count]) => {
    if (count > 0) {
      animatingDice.value.add(diceType)
    }
  })

  setTimeout(async () => {
    const diceRolled: { type: string; count: number; results: number[] }[] = []
    let total = 0
    const details: (string | number)[] = []

    for (const [diceType, count] of Object.entries(diceSelection)) {
      if (count > 0) {
        const dice = diceTypes.find(d => d.type === diceType)!
        const results: number[] = []

        for (let i = 0; i < count; i++) {
          let roll = rollSingleDie(dice.sides)

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

    if (modifier.value !== 0) {
      total += modifier.value
      details.push(modifier.value)
    }

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

    const diceResults: { type: string; result: number }[] = []
    diceRolled.forEach(dice => {
      dice.results.forEach(result => {
        diceResults.push({ type: dice.type, result })
      })
    })

    const roll: DiceRoll = {
      id: Date.now().toString(),
      userName: userName.value || 'Anonymous',
      userId: 'local-user',
      timestamp: new Date(),
      description,
      total,
      details,
      diceRolled,
      diceResults,
      modifier: modifier.value,
      rollType: rollType.value,
      isCritical,
      criticalType,
      isOwn: true
    }

    rollHistory.value.unshift(roll)

    if (isCritical && criticalType) {
      criticalAnimationType.value = criticalType
      showCriticalAnimation.value = true
    }
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
      }
    }

    animatingDice.value.clear()
    isRolling.value = false
  }, 1500)
}

async function rollAttack(attack: any) {
  if (!attack || isRollingAttack.value) return

  isRollingAttack.value = true

  try {
    const d20Roll = rollSingleDie(20)
    const attackBonus = attack.attackBonus || 0
    const total = d20Roll + attackBonus

    let isCritical = false
    let criticalType: 'success' | 'failure' | undefined

    if (d20Roll === 20) {
      isCritical = true
      criticalType = 'success'
    } else if (d20Roll === 1) {
      isCritical = true
      criticalType = 'failure'
    }

    const description = `${attack.name} Attack: 1d20${attackBonus >= 0 ? '+' : ''}${attackBonus}`
    const details = [`1d20=${d20Roll}`, attackBonus]

    const diceResults = [{ type: 'd20', result: d20Roll }]

    const roll: DiceRoll = {
      id: Date.now().toString(),
      userName: userName.value || 'Anonymous',
      userId: 'local-user',
      timestamp: new Date(),
      description,
      total,
      details,
      diceRolled: [{ type: 'd20', count: 1, results: [d20Roll] }],
      diceResults,
      modifier: attackBonus,
      rollType: 'normal',
      isCritical,
      criticalType,
      isOwn: true
    }

    rollHistory.value.unshift(roll)

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
        console.error('⚔️ Failed to submit attack roll to server:', error)
      }
    }

  } catch (error) {
    console.error('⚔️ Failed to roll attack:', error)
  } finally {
    isRollingAttack.value = false

    if (attack.damage) {
      setTimeout(async () => {
        await rollDamage(attack)
      }, 500)
    }
  }
}

async function rollDamage(attack: any) {
  if (!attack || !attack.damage || isRollingAttack.value) return

  isRollingAttack.value = true

  try {
    // Parse damage dice (e.g., "1d8+3", "2d6", "1d10+5")
    const damageString = attack.damage.toString()
    const total = rollDamageString(damageString)

    const description = `${attack.name} Damage: ${damageString}`

    const roll: DiceRoll = {
      id: Date.now().toString(),
      userName: userName.value || 'Anonymous',
      userId: 'local-user',
      timestamp: new Date(),
      description,
      total: total.total,
      details: total.details,
      diceRolled: total.diceRolled,
      modifier: total.modifier,
      rollType: 'normal',
      isCritical: false,
      isOwn: true
    }

    // Add to history
    rollHistory.value.unshift(roll)

    // Submit to server if connected
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
        console.error('🔥 Failed to submit damage roll to server:', error)
      }
    }

  } catch (error) {
    console.error('🔥 Failed to roll damage:', error)
  } finally {
    isRollingAttack.value = false
  }
}

function rollDamageString(damageString: string) {
  // Parse damage strings like "1d8+3", "2d6", "1d10+5", "8", etc.
  const match = damageString.match(/^(\d+)d(\d+)([+-]\d+)?$|^(\d+)$/)

  if (!match) {
    // If parsing fails, treat as flat value
    const flatValue = parseInt(damageString) || 0
    return {
      total: flatValue,
      details: [flatValue],
      diceRolled: [],
      modifier: 0
    }
  }

  if (match[4]) {
    // Flat damage (no dice)
    const flatValue = parseInt(match[4])
    return {
      total: flatValue,
      details: [flatValue],
      diceRolled: [],
      modifier: 0
    }
  }

  // Dice damage - modifier applies to each die
  const count = parseInt(match[1])
  const sides = parseInt(match[2])
  const modifier = match[3] ? parseInt(match[3]) : 0

  const results: number[] = []
  let total = 0

  for (let i = 0; i < count; i++) {
    const roll = rollSingleDie(sides)
    const modifiedRoll = roll + modifier
    results.push(roll) // Store original roll for display
    total += modifiedRoll // Add modified roll to total
  }

  // Build details to show the calculation clearly
  const details: (string | number)[] = []
  if (modifier !== 0) {
    // For single die: "1d4+2: (4+2=6)"
    // For multiple dice: "3d4+2: (2+2=4) + (3+2=5) + (1+2=3)"
    if (count === 1) {
      details.push(`1d${sides}${modifier >= 0 ? '+' : ''}${modifier}: (${results[0]}${modifier >= 0 ? '+' : ''}${modifier}=${results[0] + modifier})`)
    } else {
      const dieDetails = results.map(roll => `(${roll}${modifier >= 0 ? '+' : ''}${modifier}=${roll + modifier})`).join(' + ')
      details.push(`${count}d${sides}${modifier >= 0 ? '+' : ''}${modifier}: ${dieDetails}`)
    }
  } else {
    // No modifier, just show the dice: "3d4=2,4,1"
    details.push(`${count}d${sides}=${results.join(',')}`)
  }

  return {
    total,
    details,
    diceRolled: [{ type: `d${sides}`, count, results }],
    modifier
  }
}

function isPlayerTurn(): boolean {
  if (!battleMode.value?.initiativeOrder || battleMode.value.currentTurnIndex === undefined) {
    return false
  }

  const currentParticipant = battleMode.value.initiativeOrder[battleMode.value.currentTurnIndex]
  if (!currentParticipant || currentParticipant.type !== 'player') {
    return false
  }

  // Check if it's the current user's character
  const activeCharacter = userCharacters.value.find(c => c.id === activeCharacterId.value)
  return activeCharacter && currentParticipant.name === activeCharacter.characterName
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

function rollSingleDiceType(diceType: string) {
  // Create a temporary selection for just this dice type
  const tempSelection: Record<string, number> = {}

  // Initialize all dice to 0
  diceTypes.forEach(dice => {
    tempSelection[dice.type] = 0
  })

  // Set the clicked dice to the current count, or 1 if 0
  const count = selectedDice.value[diceType] > 0 ? selectedDice.value[diceType] : 1
  tempSelection[diceType] = count

  // Roll the dice with the temporary selection
  rollDice(tempSelection)
}

// Handle topographical map zone selection
function handleMapZoneSelected(zone: { name: string; description: string }) {
  console.log('Zone selected:', zone)

  // Could trigger different actions based on user role
  if (userRole.value === 'DM') {
    // DMs might get additional options like setting scene music or ambience
    showZoneInfoToast(zone, t('dmZoneInfo'))
  } else {
    // Players get basic zone information
    showZoneInfoToast(zone)
  }
}

function showZoneInfoToast(zone: { name: string; description: string }, additionalInfo?: string) {
  const toast = useToast()
  toast.add({
    title: `📍 ${zone.name}`,
    description: zone.description + (additionalInfo ? `\n\n${additionalInfo}` : ''),
    timeout: 5000,
    ui: {
      icon: 'i-heroicons-map-pin'
    }
  })
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
  if (isOfflineMode.value || !playerStats.value || !currentRoom.value || currentRoom.value.code === 'default') return

  try {
    await $fetch(`/api/dice/stats/${userId.value}`, {
      method: 'POST',
      body: {
        modifierUserId: userId.value,
        stats: playerStats.value,
        roomCode: currentRoom.value.code
      }
    })
    console.log('Stats updated successfully')
  } catch (error) {
    console.error('Failed to update stats:', error)
  }
}

async function loadPlayerStats(roomCode?: string) {
  if (!roomCode) return // Don't load stats if no room code provided

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

async function loadAllPlayersStats(roomCode?: string) {
  if (!roomCode || isOfflineMode.value || userRole.value !== 'DM') return

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
  if (!editingPlayer.value || !editingPlayerStats.value || !currentRoom.value || currentRoom.value.code === 'default') return

  try {
    await $fetch(`/api/dice/stats/${editingPlayer.value.userId}`, {
      method: 'POST',
      body: {
        modifierUserId: userId.value,
        stats: editingPlayerStats.value,
        roomCode: currentRoom.value.code
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
  if (!selectedPlayerForRequest.value || !requestedDiceType.value || !currentRoom.value || currentRoom.value.code === 'default') return

  try {
    const response = await $fetch('/api/dice/request-roll', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        targetUserId: selectedPlayerForRequest.value.userId,
        diceType: requestedDiceType.value,
        message: rollRequestMessage.value || undefined,
        modifier: rollRequestModifier.value || undefined
      }
    })

    if (response.success) {
      closeRollRequestModal()
      // Show success message
      showToast(`${t('rollRequestSent')} ${selectedPlayerForRequest.value.name}`, 'success')
    }
  } catch (error) {
    console.error('Error sending roll request:', error)
    showToast(t('rollRequestFailed'), 'error')
  }
}

function acceptRollRequest() {
  if (!pendingRollRequest.value) return

  const diceType = pendingRollRequest.value.diceType
  const requestModifier = pendingRollRequest.value.modifier || 0

  showRollRequestNotification.value = false

  selectedDice.value = { [diceType]: 1 }
  modifier.value = requestModifier

  rollDice()

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
// Helper function to show music-related toasts only to DMs
function showMusicToast(title: string, description: string, color: 'green' | 'red' | 'blue' | 'yellow' = 'green') {
  if (userRole.value === 'DM') {
    const toast = useToast()
    toast.add({
      title,
      description,
      color
    })
  }
}

// Room Maagement Functions
async function createRoom() {
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

    // Disconnect from SSE and clear room state
    disconnectSSE()
    isConnected.value = false
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
function initializeSSE(roomCode?: string) {
  // Don't connect if no room code provided
  if (!roomCode) return

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

      // Reset reconnection state on successful connection
      reconnectAttempts.value = 0
      isReconnecting.value = false
      if (reconnectTimeout.value) {
        clearTimeout(reconnectTimeout.value)
        reconnectTimeout.value = null
      }

      // Start heartbeat to maintain session alive
      if (roomCode && roomCode !== 'default') {
        startHeartbeat()
        console.log('🎲 Heartbeat started for room:', roomCode)
      }

      joinRoom(roomCode)
    }

    eventSource.value.onerror = (error) => {
      console.error('🎲 SSE connection error:', error)
      isConnected.value = false

      if (isOfflineModePreference.value) {
        console.log('🎲 Staying offline per user preference')
        isOfflineMode.value = true
        connectedUsers.value = 1
        return
      }

      if (reconnectAttempts.value < maxReconnectAttempts) {
        isReconnecting.value = true
        reconnectAttempts.value++

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value - 1), 16000)

        console.log(`🎲 Attempting reconnection ${reconnectAttempts.value}/${maxReconnectAttempts} in ${delay}ms`)

        reconnectTimeout.value = setTimeout(() => {
          console.log(`🎲 Reconnection attempt ${reconnectAttempts.value}`)
          disconnectSSE() // Clean up current connection
          setTimeout(() => {
            initializeSSE(roomCode) // Attempt to reconnect
          }, 100)
        }, delay)
      } else {
        console.log('🎲 Max reconnection attempts reached, falling back to offline mode')
        isReconnecting.value = false
        isOfflineMode.value = true
        connectedUsers.value = 1

        // Show user notification about connection issues
        const toast = useToast()
        toast.add({
          title: 'Connection Lost',
          description: 'Unable to reconnect to the server. Using offline mode.',
          color: 'red'
        })
      }
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
        .map((r: DiceRoll) => {
          // Ensure diceResults exists (for backward compatibility)
          let diceResults = r.diceResults
          if (!diceResults && r.diceRolled) {
            diceResults = []
            r.diceRolled.forEach(dice => {
              dice.results.forEach(result => {
                diceResults!.push({ type: dice.type, result })
              })
            })
          }

          return {
            ...r,
            timestamp: new Date(r.timestamp),
            isOwn: r.userId === userId.value,
            diceResults: diceResults || []
          }
        })

      rollHistory.value = [...rollHistory.value, ...newRolls]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    })

    eventSource.value.addEventListener('dice:roll', (event) => {
      const data = JSON.parse(event.data)
      const roll = data as DiceRoll

      // Only add rolls from other users
      if (roll.userId !== userId.value) {
        // Ensure diceResults exists (for backward compatibility)
        let diceResults = roll.diceResults
        if (!diceResults && roll.diceRolled) {
          diceResults = []
          roll.diceRolled.forEach(dice => {
            dice.results.forEach(result => {
              diceResults!.push({ type: dice.type, result })
            })
          })
        }

        const processedRoll = {
          ...roll,
          timestamp: new Date(roll.timestamp),
          isOwn: false,
          diceResults: diceResults || []
        }

        rollHistory.value.unshift(processedRoll)

        // Show critical animation if it's a critical roll from another user
        if (processedRoll.isCritical && processedRoll.criticalType) {
          criticalAnimationType.value = processedRoll.criticalType
          showCriticalAnimation.value = true
          // Video will auto-close when it ends via @ended event
        }
      }
    })


    if (data.userCount) {
      connectedUsers.value = data.userCount
    }

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

    // Handle DM show image event
    eventSource.value.addEventListener('dm:show_image', (event) => {
      const data = JSON.parse(event.data)
      displayedImageUrl.value = data.imageUrl
      displayedImageCaption.value = data.caption || ''
      showImageDisplayModal.value = true

      // Clear existing timeout if any
      if (imageDisplayTimeout.value) {
        clearTimeout(imageDisplayTimeout.value)
      }

      // Auto close after 5 seconds
      imageDisplayTimeout.value = setTimeout(() => {
        showImageDisplayModal.value = false
        imageDisplayTimeout.value = null
      }, 5000)
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

  } catch (error) {
    console.error('🎲 Failed to initialize SSE:', error)
    console.log('🎲 Using offline mode')
    isOfflineMode.value = true
    isConnected.value = false
    connectedUsers.value = 1
  }
}

async function joinRoom(roomCode?: string) {
  if (!roomCode) return // Don't join if no room code provided

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
  if (!currentRoom.value || currentRoom.value.code === 'default') return null

  try {
    const response = await $fetch('/api/dice/roll', {
      method: 'POST',
      body: {
        ...roll,
        userId: userId.value,
        userName: userName.value,
        roomCode: currentRoom.value.code
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

  // Stop heartbeat when disconnecting
  stopHeartbeat()
  console.log('🎲 Heartbeat stopped')

  // Clear reconnection timeout if active
  if (reconnectTimeout.value) {
    clearTimeout(reconnectTimeout.value)
    reconnectTimeout.value = null
  }

  isReconnecting.value = false
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

    // Reconnect with current room (if we have a valid room)
    if (currentRoom.value && currentRoom.value.code !== 'default') {
      initializeSSE(currentRoom.value.code)
    }
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

      // Load available players for battle selection
      await loadBattlePlayers()

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
  console.log('⚔️ Attempting to end battle...')
  console.log('Current room:', currentRoom.value)
  console.log('Battle mode:', battleMode.value)

  if (!currentRoom.value || currentRoom.value.code === 'default') {
    console.log('⚔️ Cannot end battle: no valid room')
    return
  }

  isBattleLoading.value = true
  try {
    console.log('⚔️ Making API call to end battle...')
    const response = await $fetch('/api/battle/end', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code
      }
    })

    console.log('⚔️ API response:', response)

    if (response.success && response.ended) {
      battleMode.value = null
      console.log('⚔️ Battle mode ended successfully')

      const toast = useToast()
      toast.add({
        title: 'Battle Ended',
        description: 'Battle mode has been deactivated',
        color: 'blue'
      })
    } else {
      console.log('⚔️ Battle end failed:', response)
      const toast = useToast()
      toast.add({
        title: 'Error',
        description: 'Failed to end battle mode',
        color: 'red'
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

// Battle Player Management Functions
async function loadBattlePlayers() {
  if (!currentRoom.value) return

  isBattlePlayersLoading.value = true
  try {
    const response = await $fetch(`/api/battle/players?roomCode=${currentRoom.value.code}`)

    if (response.success) {
      selectedPlayers.value = response.data.selectedPlayers
      unselectedPlayers.value = response.data.unselectedPlayers
      console.log('👥 Battle players loaded:', response.data)
    }
  } catch (error) {
    console.error('Failed to load battle players:', error)
  } finally {
    isBattlePlayersLoading.value = false
  }
}

// Note: During setup phase, we use select/deselect endpoints
// During active combat, we would use add/remove endpoints for mid-battle additions
async function addPlayerToBattle(playerId: string) {
  if (!currentRoom.value) return

  try {
    const response = await $fetch('/api/battle/player/select', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        playerId: playerId
      }
    })

    if (response.success) {
      // Reload the player lists to reflect changes
      await loadBattlePlayers()

      const toast = useToast()
      toast.add({
        title: 'Player Added',
        description: 'Player has been added to battle',
        color: 'green'
      })
    }
  } catch (error) {
    console.error('Failed to add player to battle:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to add player to battle',
      color: 'red'
    })
  }
}

async function removePlayerFromBattle(playerId: string) {
  if (!currentRoom.value) return

  try {
    const response = await $fetch('/api/battle/player/deselect', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        playerId: playerId
      }
    })

    if (response.success) {
      // Reload the player lists to reflect changes
      await loadBattlePlayers()

      const toast = useToast()
      toast.add({
        title: 'Player Removed',
        description: 'Player has been removed from battle',
        color: 'blue'
      })
    }
  } catch (error) {
    console.error('Failed to remove player from battle:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to remove player from battle',
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
    // For players, load their actual character attacks
    if (participant.type === 'player' && participant.userId) {
      let playerCharacter = null

      // If it's the current user, use their active character
      if (participant.userId === userId.value) {
        playerCharacter = userCharacters.value.find(c => c.id === activeCharacterId.value)
      } else {
        // For other players, fetch their character data from the API
        try {
          const response = await $fetch(`/api/characters?player=${participant.userId}`)
          if (response.success && response.data.length > 0) {
            // Find the character that matches the participant name
            playerCharacter = response.data.find((char: any) => char.characterName === participant.name)
            // If no exact match, use the first character (assuming they only have one active)
            if (!playerCharacter && response.data.length === 1) {
              playerCharacter = response.data[0]
            }
          }
        } catch (apiError) {
          console.warn('Could not fetch character data for participant:', participant.name, apiError)
        }
      }

      if (playerCharacter && playerCharacter.attacks) {
        // Convert character attacks to special abilities format
        const characterAttacks = playerCharacter.attacks.map((attack: any, index: number) => ({
          id: attack.id || `attack_${index}`,
          name: attack.name || 'Unnamed Attack',
          diceFormula: attack.damage || '1d6',
          description: `Attack bonus: +${attack.attackBonus || 0}${attack.rangeText ? ` | Range: ${attack.rangeText}` : ''}${attack.notes ? ` | ${attack.notes}` : ''}`,
          abilityType: 'ACTION' as const,
          usesPerRest: undefined,
          usesRemaining: undefined,
          attackBonus: attack.attackBonus || 0,
          rangeText: attack.rangeText,
          notes: attack.notes
        }))

        currentPlayerAbilities.value = characterAttacks
        currentPlayerName.value = participant.name
        showSpecialAbilitiesModal.value = true

        console.log('🗡️ Loaded character attacks for', participant.name, characterAttacks)
        return
      }
    }

    // Fallback: Show empty state with helpful message
    currentPlayerAbilities.value = []
    currentPlayerName.value = participant.name
    showSpecialAbilitiesModal.value = true

    const toast = useToast()
    toast.add({
      title: 'No Attacks Found',
      description: `No attacks found for ${participant.name}. They may need to add attacks to their character sheet.`,
      color: 'amber'
    })

  } catch (error) {
    console.error('Failed to load special abilities:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to load character attacks',
      color: 'red'
    })
  }
}

function handleRollAbility(ability: any) {
  // Close the special abilities modal
  showSpecialAbilitiesModal.value = false

  console.log('Rolling ability:', ability.name, ability.diceFormula)

  // If this is a character attack (has attackBonus), treat it as an attack
  if (ability.attackBonus !== undefined) {
    // Roll attack first
    rollAttack({
      name: ability.name,
      attackBonus: ability.attackBonus,
      damage: ability.diceFormula,
      rangeText: ability.rangeText,
      notes: ability.notes
    })
  } else {
    // For other abilities (like healing spells), just roll the dice formula
    if (ability.diceFormula) {
      try {
        const result = rollDamageString(ability.diceFormula)

        const roll: DiceRoll = {
          id: Date.now().toString(),
          userName: userName.value || 'Anonymous',
          userId: 'local-user',
          timestamp: new Date(),
          description: `${ability.name}: ${ability.diceFormula}`,
          total: result.total,
          details: result.details,
          diceRolled: result.diceRolled,
          modifier: result.modifier,
          rollType: 'normal',
          isCritical: false,
          isOwn: true
        }

        // Add to history
        rollHistory.value.unshift(roll)

        // Show critical animation if it's a critical roll
        if (isCritical && criticalType) {
          criticalAnimationType.value = criticalType
          showCriticalAnimation.value = true
          // Video will auto-close when it ends via @ended event
        }

        // Submit to server if connected and in valid room
        if (isConnected.value && !isOfflineMode.value && currentRoom.value && currentRoom.value.code !== 'default') {
          submitDiceRoll({
            userName: roll.userName,
            userId: roll.userId,
            roomCode: currentRoom.value.code,
            description: roll.description,
            total: roll.total,
            details: roll.details,
            diceRolled: roll.diceRolled,
            modifier: roll.modifier,
            rollType: roll.rollType,
            isCritical: roll.isCritical,
            criticalType: roll.criticalType
          })
        }
      } catch (error) {
        console.error('Failed to roll ability dice:', error)
        const toast = useToast()
        toast.add({
          title: 'Roll Failed',
          description: `Failed to roll ${ability.diceFormula}`,
          color: 'red'
        })
      }
    }
  }

  const toast = useToast()
  toast.add({
    title: 'Ability Used',
    description: `Rolling ${ability.diceFormula || 'dice'} for ${ability.name}`,
    color: 'blue'
  })
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

// DM function to show player character details
async function showPlayerDetails(player: Player) {
  try {
    // Fetch the full character data for the player
    const response = await $fetch(`/api/characters?player=${player.userId}`)
    if (response.success && response.data.length > 0) {
      // Find the character that matches the participant name
      let playerCharacter = response.data.find((char: any) => char.characterName === player.name)
      // If no exact match, use the first character (assuming they only have one active)
      if (!playerCharacter && response.data.length === 1) {
        playerCharacter = response.data[0]
      }

      if (playerCharacter) {
        // Map player stats to character object for consistency
        playerCharacter.currentHp = player.stats.hitPoints.current
        playerCharacter.maxHp = player.stats.hitPoints.max
        playerCharacter.armorClass = player.stats.armorClass
        playerCharacter.initiative = player.stats.initiative
        playerCharacter.speed = player.stats.speed
        playerCharacter.proficiencyBonus = player.stats.proficiencyBonus
        playerCharacter.strength = player.stats.abilities.strength
        playerCharacter.dexterity = player.stats.abilities.dexterity
        playerCharacter.constitution = player.stats.abilities.constitution
        playerCharacter.intelligence = player.stats.abilities.intelligence
        playerCharacter.wisdom = player.stats.abilities.wisdom
        playerCharacter.charisma = player.stats.abilities.charisma
        playerCharacter.classLevel = player.stats.level

        selectedCharacterForDetail.value = playerCharacter
        showCharacterDetailModal.value = true
      } else {
        const toast = useToast()
        toast.add({
          title: 'Character Not Found',
          description: `Could not find character data for ${player.name}`,
          color: 'red'
        })
      }
    } else {
      const toast = useToast()
      toast.add({
        title: 'No Character Data',
        description: `No character data available for ${player.name}`,
        color: 'red'
      })
    }
  } catch (error) {
    console.error('Failed to load player character details:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to load character details',
      color: 'red'
    })
  }
}

async function dealDamageToEnemy(enemy: Enemy) {
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

// Initialize with SSE connection
onMounted(async () => {
  console.log('🎲 Dice room component mounted')

  const originalConsoleError = console.error
  console.error = (...args) => {
    const errorStr = args.join(' ')
    if (errorStr.includes('doubleclick.net') ||
      errorStr.includes('googleads.g.doubleclick.net') ||
      errorStr.includes('CORS policy') && errorStr.includes('youtube')) {
      return
    }
    originalConsoleError.apply(console, args)
  }

  currentRoom.value = null

  await loadUserCharacters()

})

onUnmounted(() => {
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

<style scoped>
:deep(.modal-custom-size [id*="headlessui-dialog-panel-v-"] > div) {
  width: 1800px !important;
  max-width: 1800px !important;
  height: 600px !important;
  max-height: 600px !important;
}

:deep(.modal-custom-size .grid) {
  width: 100% !important;
  max-width: none !important;
}
</style>
