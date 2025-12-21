<template>
  <div class="min-h-screen bg-zinc-950 bg-zinc-950">
    <!-- Header -->
    <header class="bg-zinc-900 bg-zinc-900 shadow-sm border-b border-zinc-800 border-zinc-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <UButton :to="(user?.role === 'DM' || user?.role === 'ADMIN') ? '/dashboard' : '/'" color="gray" variant="ghost" icon="i-heroicons-arrow-left" size="sm">
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
              <div class="h-3 w-3 rounded-full"
                :class="isConnected ? 'bg-green-500' : isOfflineMode ? 'bg-yellow-500' : 'bg-red-500'"></div>
              <span class="text-sm text-gray-600 dark:text-gray-300">
                {{ isConnected ? t('connected') : isOfflineMode ? t('offlineMode') : t('disconnected') }}
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
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4 bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <!-- Sidebar Toggles -->
        <div class="flex items-center space-x-2">
          <UButton color="blue" variant="outline" @click="isLeftSidebarOpen = !isLeftSidebarOpen"
            :icon="isLeftSidebarOpen ? 'i-heroicons-eye-slash' : 'i-heroicons-user'">
            {{ isLeftSidebarOpen ? t('hide') : t('show') }} {{ userRole === 'DM' ? t('playersInfo') : t('character') }}
          </UButton>
          <UButton color="green" variant="outline" @click="isRightSidebarOpen = !isRightSidebarOpen"
            :icon="isRightSidebarOpen ? 'i-heroicons-eye-slash' : 'i-heroicons-chart-bar'">
            {{ isRightSidebarOpen ? t('hide') : t('show') }} {{ userRole === 'DM' ? t('requestDices') : t('abilities') }}
          </UButton>
          <UButton v-if="userRole === 'DM'" color="purple" variant="outline" icon="i-heroicons-photo"
            @click="showDmImageModal = true">
            {{ t('showImage') }}
          </UButton>
        </div>

        <!-- Room Actions -->
        <div v-if="currentRoom && currentRoom.code !== 'default'" class="flex items-center space-x-2">
          <UButton color="red" variant="outline" icon="i-heroicons-arrow-right-on-rectangle"
            @click="leaveRoom">
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
                <UIcon :name="userRole === 'DM' ? 'i-heroicons-users' : 'i-heroicons-user'" class="w-5 h-5 text-red-500" />
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
                  <UButton v-if="!isOfflineMode && currentRoom && currentRoom.code !== 'default'" color="gray" variant="outline" size="xs"
                    @click="loadAllPlayersStats(currentRoom.code)" icon="i-heroicons-arrow-path">
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
                            class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">{{ t('prof') }}</span>
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
                      <UInput v-model="skillSearchQuery" icon="i-heroicons-magnifying-glass" :placeholder="t('searchSkills')" size="xs" color="gray" variant="outline" />
                    </div>
                    <div class="space-y-1 max-h-64 overflow-y-auto">
                      <!-- Always show all standard D&D skills -->
                      <div v-for="skill in filteredSkills" :key="skill.name"
                        class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded p-2">
                        <div class="flex items-center space-x-2 flex-1 min-w-0">
                          <span class="text-sm font-medium text-white text-white truncate">{{ skill.name
                          }}</span>
                          <span v-if="skill.proficient"
                            class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded flex-shrink-0">{{ t('prof') }}</span>
                          <span v-if="skill.expertise"
                            class="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1 py-0.5 rounded flex-shrink-0">{{ t('exp') }}</span>
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
                            <span class="font-mono">{{ attack.attackBonus >= 0 ? '+' : '' }}{{ attack.attackBonus }}</span>
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
                    <UButton v-if="currentRoom && currentRoom.code !== 'default'" color="blue" variant="outline" size="xs"
                      @click="loadAllPlayersStats(currentRoom.code)" icon="i-heroicons-arrow-path">
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
                      <div>{{ t('str') }}: {{ player.stats.abilities.strength }} | {{ t('dex') }}: {{ player.stats.abilities.dexterity }} |
                        {{ t('con') }}: {{
                          player.stats.abilities.constitution }}</div>
                      <div>{{ t('int') }}: {{ player.stats.abilities.intelligence }} | {{ t('wis') }}: {{ player.stats.abilities.wisdom }} |
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
                    <UButton v-if="rollHistory.length > 0 && (user?.role === 'DM' || user?.role === 'ADMIN')" color="gray" variant="ghost" size="xs" @click="clearHistory"
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
                          {{ roll.criticalType === 'success' ? `🎯 ${t('criticalSuccess')}` : `💥 ${t('criticalFailure')}` }}
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
                        <UButton v-if="rollHistory.length > 0 && (user?.role === 'DM' || user?.role === 'ADMIN')" color="gray" variant="ghost" size="xs"
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
                              {{ roll.criticalType === 'success' ? `🎯 ${t('criticalSuccess')}` : `💥 ${t('criticalFailure')}` }}
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
                            <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">{{ t('battleSetupPhase') }}</h4>
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
                          <h5 class="text-xs font-medium text-green-900 dark:text-green-100 mb-2">{{ t('selectedPlayers') }}</h5>
                          <div class="space-y-1">
                            <div v-for="player in selectedPlayers" :key="player.userId"
                              class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                              <div class="flex-1">
                                <div class="font-medium text-green-900 dark:text-green-100">{{ player.name }}</div>
                                <div class="text-xs text-green-700 dark:text-green-300">{{ t('readyForBattleStatus') }}</div>
                              </div>
                              <UButton color="red" variant="ghost" size="xs"
                                @click="removePlayerFromBattle(player.userId)" icon="i-heroicons-minus">
                              </UButton>
                            </div>
                          </div>
                        </div>

                        <!-- Available Players -->
                        <div v-if="unselectedPlayers.length > 0" class="mb-3">
                          <h5 class="text-xs font-medium text-gray-600 text-zinc-400 mb-2">{{ t('availablePlayers') }}</h5>
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
                            {{ battleMode.initiativeOrder[battleMode.currentTurnIndex]?.type ? t(battleMode.initiativeOrder[battleMode.currentTurnIndex]?.type) : t('unknown') }}
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

                  <!-- DJ Music Control Panel (DM Only) -->
                  <UCard v-if="userRole === 'DM' && currentRoom && currentRoom.code !== 'default' && isConnected">
                    <template #header>
                      <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-white text-white">
                          🎵 {{ t('djMusicControl') }}
                        </h3>
                        <div class="flex items-center space-x-2">
                          <UBadge v-if="musicState.isPlaying" color="green" variant="soft">
                            {{ t('playing') }}
                          </UBadge>
                          <UBadge v-else-if="musicState.currentTrack" color="yellow" variant="soft">
                            {{ t('paused') }}
                          </UBadge>
                          <UBadge v-else color="gray" variant="soft">
                            {{ t('noTrack') }}
                          </UBadge>
                        </div>
                      </div>
                    </template>

                    <div class="space-y-4">
                      <!-- Add YouTube Track Section -->
                      <div
                        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">{{ t('addYoutubeTrack') }}</h4>
                        <div class="space-y-3">
                          <UInput v-model="newTrackUrl" :placeholder="t('pasteYoutubeUrl')"
                            icon="i-heroicons-musical-note" />
                          <div class="flex flex-wrap gap-2">
                            <UButton color="blue" size="sm" @click="addTrackToPlaylist"
                              :disabled="!newTrackUrl || isAddingTrack" :loading="isAddingTrack"
                              icon="i-heroicons-plus">
                              {{ t('addToPlaylist') }}
                            </UButton>
                            <UButton color="green" size="sm" @click="addAndPlayTrack"
                              :disabled="!newTrackUrl || isAddingTrack" :loading="isAddingTrack"
                              icon="i-heroicons-play">
                              {{ t('addAndPlayNow') }}
                            </UButton>
                            <UButton color="purple" size="sm" @click="addTrackAsSoundEffect"
                              :disabled="!newTrackUrl || isAddingTrack" :loading="isAddingTrack"
                              icon="i-heroicons-speaker-wave">
                              {{ t('addAsSoundEffect') }}
                            </UButton>
                          </div>
                        </div>
                      </div>

                      <!-- Sound Effects Control Panel -->
                      <div
                        class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <h4 class="text-sm font-medium text-purple-900 dark:text-purple-100 mb-3">🔊 {{ t('soundEffectsControl') }}
                        </h4>
                        <div class="space-y-3">
                          <!-- Sound Effects Volume Control -->
                          <div>
                            <div class="flex items-center justify-between mb-2">
                              <label class="text-sm text-purple-700 dark:text-purple-300">{{ t('soundEffectsVolume') }}</label>
                              <span class="text-sm text-purple-600 dark:text-purple-400">{{
                                musicState.soundEffects.soundEffectsVolume }}%</span>
                            </div>
                            <div class="flex items-center space-x-3">
                              <UIcon name="i-heroicons-speaker-x-mark" class="h-4 w-4 text-purple-400" />
                              <input type="range" min="0" max="100" v-model="musicState.soundEffects.soundEffectsVolume"
                                @input="setSoundEffectsVolume"
                                class="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer dark:bg-purple-700" />
                              <UIcon name="i-heroicons-speaker-wave" class="h-4 w-4 text-purple-400" />
                            </div>
                          </div>

                          <!-- Quick Sound Effects -->
                          <div v-if="musicState.playlist.filter(t => t.isSoundEffect).length > 0">
                            <h5 class="text-xs font-medium text-purple-800 dark:text-purple-200 mb-2">{{ t('quickSoundEffects') }}</h5>
                            <div class="grid grid-cols-2 gap-2">
                              <UButton v-for="track in musicState.playlist.filter(t => t.isSoundEffect).slice(0, 4)"
                                :key="track.id" color="purple" variant="outline" size="xs"
                                @click="playSoundEffect(track.id)" class="truncate text-xs">
                                🔊 {{ track.title.length > 12 ? track.title.substring(0, 12) + '...' : track.title }}
                              </UButton>
                            </div>
                          </div>

                          <div
                            class="bg-purple-100 dark:bg-purple-800/30 border border-purple-200 dark:border-purple-700 rounded p-2">
                            <p class="text-xs text-purple-700 dark:text-purple-300">
                              {{ t('soundEffectsInfo') }}
                            </p>
                          </div>
                        </div>
                      </div>

                      <!-- Fade Transition Settings -->
                      <div
                        class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <h4 class="text-sm font-medium text-purple-900 dark:text-purple-100 mb-3">🎚️ {{ t('audioTransitions') }}
                        </h4>
                        <div class="space-y-3">
                          <div class="flex items-center justify-between">
                            <label class="text-sm text-purple-700 dark:text-purple-300">{{ t('enableSmoothFades') }}</label>
                            <UToggle v-model="fadeConfig.enabled" />
                          </div>

                          <div v-if="fadeConfig.enabled"
                            class="space-y-2 border-t border-purple-200 dark:border-purple-700 pt-3">
                            <div class="flex items-center justify-between">
                              <label class="text-xs text-purple-600 dark:text-purple-400">{{ t('trackSwitchMs') }}</label>
                              <UInput v-model.number="fadeConfig.trackTransition" type="number" min="100" max="2000"
                                size="xs" class="w-20" />
                            </div>

                            <div class="flex items-center justify-between">
                              <label class="text-xs text-purple-600 dark:text-purple-400">{{ t('volumeChangeMs') }}</label>
                              <UInput v-model.number="fadeConfig.volumeChange" type="number" min="100" max="1000"
                                size="xs" class="w-20" />
                            </div>

                            <div class="flex items-center justify-between">
                              <label class="text-xs text-purple-600 dark:text-purple-400">{{ t('playPauseMs') }}</label>
                              <UInput v-model.number="fadeConfig.playPause" type="number" min="100" max="1000" size="xs"
                                class="w-20" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Current Track Display -->
                      <div v-if="musicState.currentTrack"
                        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div class="flex items-start space-x-3">
                          <!-- Thumbnail -->
                          <div class="flex-shrink-0">
                            <img v-if="musicState.currentTrack.thumbnail" :src="musicState.currentTrack.thumbnail"
                              :alt="musicState.currentTrack.title" class="w-16 h-12 object-cover rounded-lg" />
                            <div v-else
                              class="w-16 h-12 bg-green-200 dark:bg-green-800 rounded-lg flex items-center justify-center">
                              <UIcon name="i-heroicons-musical-note"
                                class="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                          </div>

                          <!-- Track info and controls -->
                          <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between">
                              <div class="flex-1 min-w-0">
                                <h4 class="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                                  🎵 {{ musicState.currentTrack.title || t('unknownTrack') }}
                                </h4>
                                <p class="text-xs text-green-700 dark:text-green-300 truncate mt-1">
                                  {{ musicState.currentTrack.artist || t('unknownArtist') }}
                                </p>
                                <!-- Duration and metadata -->
                                <div
                                  class="flex items-center space-x-2 text-xs text-green-600 dark:text-green-400 mt-1">
                                  <span v-if="musicState.currentTrack.duration">{{
                                    formatDuration(musicState.currentTrack.duration) }}</span>
                                  <span v-if="musicState.currentTrack.tags && musicState.currentTrack.tags.length > 0"
                                    class="truncate">
                                    #{{ musicState.currentTrack.tags.slice(0, 1).join(', #') }}
                                  </span>
                                </div>
                              </div>

                              <!-- Control buttons -->
                              <div class="flex items-center space-x-1 ml-3">
                                <!-- Fade transition indicator -->
                                <div v-if="fadeTransition.isActive"
                                  class="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 mr-2">
                                  <UIcon name="i-heroicons-arrows-right-left" class="w-3 h-3 animate-pulse" />
                                  <span class="text-xs">{{ t('fading') }}</span>
                                </div>

                                <UButton v-if="musicState.isPlaying" color="yellow" variant="ghost" size="xs"
                                  @click="pauseMusic" icon="i-heroicons-pause" />
                                <UButton v-else color="green" variant="ghost" size="xs" @click="resumeMusic"
                                  icon="i-heroicons-play" />
                                <UButton color="red" variant="ghost" size="xs" @click="stopMusic"
                                  icon="i-heroicons-stop" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Volume Control -->
                      <div
                        class="bg-zinc-950 bg-zinc-900/50 border border-zinc-800 border-zinc-800 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                          <h4 class="text-sm font-medium text-white text-white">{{ t('volume') }}</h4>
                          <span class="text-sm text-gray-600 text-zinc-400">{{ musicState.volume }}%</span>
                        </div>
                        <div class="flex items-center space-x-3">
                          <UIcon name="i-heroicons-speaker-x-mark" class="h-4 w-4 text-gray-400" />
                          <input type="range" min="0" max="100" v-model="musicState.volume" @input="setVolume"
                            class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                          <UIcon name="i-heroicons-speaker-wave" class="h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <!-- Playlist -->
                      <div>
                        <div class="flex items-center justify-between mb-3">
                          <h4 class="text-sm font-medium text-white text-white">{{ t('playlist') }}</h4>
                          <UButton v-if="musicState.playlist.length > 0" color="gray" variant="ghost" size="xs"
                            @click="clearPlaylist" icon="i-heroicons-trash">
                            {{ t('clearAll') }}
                          </UButton>
                        </div>

                        <div v-if="musicState.playlist.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
                          <div v-for="track in musicState.playlist" :key="track.id"
                            class="flex items-center justify-between p-3 bg-zinc-900 bg-zinc-900 border border-zinc-800 border-zinc-800 rounded-lg"
                            :class="{
                              'ring-2 ring-green-500': track.id === musicState.currentTrack?.id,
                              'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20': track.isSoundEffect
                            }">
                            <!-- Thumbnail and track info -->
                            <div class="flex items-center flex-1 min-w-0 space-x-3">
                              <!-- Video thumbnail -->
                              <div class="flex-shrink-0">
                                <img v-if="track.thumbnail" :src="track.thumbnail" :alt="track.title"
                                  class="w-12 h-9 object-cover rounded" />
                                <div v-else
                                  class="w-12 h-9 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center"
                                  :class="track.isSoundEffect ? 'bg-purple-200 dark:bg-purple-800' : ''">
                                  <UIcon
                                    :name="track.isSoundEffect ? 'i-heroicons-speaker-wave' : 'i-heroicons-musical-note'"
                                    class="h-4 w-4"
                                    :class="track.isSoundEffect ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'" />
                                </div>
                              </div>

                              <!-- Track details -->
                              <div class="flex-1 min-w-0">
                                <div class="flex items-center space-x-2">
                                  <div class="text-sm font-medium text-white text-white truncate">
                                    {{ track.title || t('unknownTrack') }}
                                  </div>
                                  <!-- Sound Effect Badge -->
                                  <UBadge v-if="track.isSoundEffect" color="purple" variant="soft" size="xs">
                                    SFX
                                  </UBadge>
                                </div>
                                <div class="text-xs text-zinc-400 text-zinc-400 truncate">
                                  {{ track.artist || t('unknownArtist') }}
                                </div>
                                <!-- Duration and additional metadata -->
                                <div class="flex items-center space-x-2 text-xs text-gray-400 dark:text-zinc-400 mt-1">
                                  <span v-if="track.duration">{{ formatDuration(track.duration) }}</span>
                                  <span v-if="track.isSoundEffect && track.isPlayableWhileMusic"
                                    class="text-purple-500">
                                    {{ t('canPlayWithMusic') }}
                                  </span>
                                  <span v-if="track.tags && track.tags.length > 0" class="truncate">
                                    {{ track.tags.slice(0, 2).join(', ') }}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <!-- Control buttons -->
                            <div class="flex items-center space-x-1 ml-2">
                              <!-- Sound Effect Play Button -->
                              <UButton v-if="track.isSoundEffect" color="purple" variant="ghost" size="xs"
                                @click="playSoundEffect(track.id)" icon="i-heroicons-speaker-wave"
                                :title="t('playAsSoundEffect')" />
                              <!-- Regular Play Button -->
                              <UButton v-else color="green" variant="ghost" size="xs"
                                @click="playTrackFromPlaylist(track)" icon="i-heroicons-play"
                                :disabled="track.id === musicState.currentTrack?.id && musicState.isPlaying" />
                              <!-- Remove Button -->
                              <UButton color="red" variant="ghost" size="xs" @click="removeTrackFromPlaylist(track.id)"
                                icon="i-heroicons-trash" />
                            </div>
                          </div>
                        </div>

                        <div v-else
                          class="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                          <div class="text-2xl mb-2">🎵</div>
                          <p class="text-zinc-400 text-zinc-400 text-sm mb-3">
                            {{ t('noTracksInPlaylist') }}
                          </p>
                          <p class="text-gray-400 dark:text-zinc-400 text-xs">
                            {{ t('addTracksDesc') }}
                          </p>
                        </div>
                      </div>

                      <!-- Music Sync Info for Participants -->
                      <div
                        class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                        <div class="flex items-start space-x-2">
                          <UIcon name="i-heroicons-information-circle"
                            class="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                          <div>
                            <h4 class="text-xs font-medium text-purple-900 dark:text-purple-100">{{ t('musicSync') }}</h4>
                            <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">
                              {{ t('musicSyncDesc') }}
                            </p>
                          </div>
                        </div>
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
                  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mx-auto max-w-md">
                    <div class="flex items-start space-x-2">
                      <UIcon name="i-heroicons-information-circle" class="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
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
        <div class="mt-12 border-t border-zinc-800 border-zinc-800 pt-8">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="mb-6">
              <h2 class="text-2xl font-bold text-white text-white mb-2">
                🗺️ {{ t('campaignMap') }}
              </h2>
              <p class="text-gray-600 text-zinc-400">
                {{ t('campaignMapDesc') }}
              </p>
            </div>
            <TopoMap 
              @zone-selected="handleMapZoneSelected"
              :zones="campaignZones"
            />
          </div>
        </div>
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
const user = useState < any > ('user')

// Room management state (moved before heartbeat to avoid forward reference)
const currentRoom = ref < { name: string; code: string; isOwner: boolean } | null > (null)
const showCreateRoom = ref(false)
const joinRoomCode = ref('')

// Heartbeat system to maintain session alive
const roomCodeForHeartbeat = computed(() => currentRoom.value?.code || '')
const { isHeartbeatActive, startHeartbeat, stopHeartbeat } = useHeartbeat(roomCodeForHeartbeat)

// Helper function to validate dice type
function isValidDiceType(type: string): boolean {
  const validTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd36', 'd100']
  return validTypes.includes(type)
}

// Reactive state
const userRole = ref < 'Player' | 'DM' > ('Player')
const isConnected = ref(false)
const isOfflineMode = ref(false)
const isOfflineModePreference = ref(false) // Persistent offline mode preference
const connectedUsers = ref(1)
const isRolling = ref(false)
const eventSource = ref < EventSource | null > (null)
const animatingDice = ref < Set < string >> (new Set())

// Sidebar state
const isLeftSidebarOpen = ref(false)
const isRightSidebarOpen = ref(false)

// Legacy compatibility - for existing sidebar references
const isSidebarOpen = computed(() => isLeftSidebarOpen.value || isRightSidebarOpen.value)

// User character data and role detection
const userCharacters = ref < any[] > ([])
const activeCharacterId = ref < string | null > (null)
const isRefreshingUserData = ref(false)

// Player stats (for current user if they're a player)
const playerStats = ref < PlayerStats | null > (null)

// Character attacks and combat data
const activeCharacterAttacks = ref < any[] > ([])
const showCharacterAttacks = ref(false)
const isRollingAttack = ref(false)

// All players stats (for DMs)
const allPlayers = ref < Player[] > ([])

// DM editing modal state
const isEditingPlayer = ref(false)
const editingPlayer = ref < Player | null > (null)
const editingPlayerStats = ref < PlayerStats | null > (null)

// Battle mode state
const battleMode = ref < BattleState | null > (null)
const isInBattle = computed(() => battleMode.value?.phase !== undefined)
const showBattleUI = ref(false)
const showAddEnemyModal = ref(false)
const newEnemy = ref({ name: '', hitPoints: 10, armorClass: 10, initiative: 0 })
const isBattleLoading = ref(false)
const showSpecialAbilitiesModal = ref(false)
const currentPlayerAbilities = ref < any[] > ([])

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
const selectedPlayers = ref < Array < { userId: string; name: string } >> ([])
const unselectedPlayers = ref < Array < { userId: string; name: string } >> ([])
const isBattlePlayersLoading = ref(false)

// Music system state
const musicState = ref({
  isPlaying: false,
  currentTrack: null as any,
  volume: 50,
  playlist: [] as any[],
  soundEffects: {
    soundEffectsVolume: 75,
    playableTrackIds: new Set < string > (),
    lastSoundEffectPlayed: null as Date | null
  }
})
const newTrackUrl = ref('')
const isAddingTrack = ref(false)

// YouTube Player state
const youtubePlayer = ref < any > (null)
const isYouTubeAPIReady = ref(false)
const currentVideoId = ref < string | null > (null)

// Fade transition configuration
const fadeConfig = ref({
  trackTransition: 500,  // ms for track switching fade
  volumeChange: 300,     // ms for volume change fade
  playPause: 400,        // ms for play/pause fade
  enabled: true          // global fade enable/disable
})

// Dice selection
const selectedDice = ref < Record < string, number>> ({
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
const rollHistory = ref < DiceRoll[] > ([])

// Roll request system
const showRollRequestModal = ref(false)
const selectedPlayerForRequest = ref < Player | null > (null)
const requestedDiceType = ref < string > ('')
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
const pendingRollRequest = ref < {
  fromDM: string
  diceType: string
  message?: string
  modifier?: number
  requestId: string
} | null > (null)

// Critical roll animation
const showCriticalAnimation = ref(false)
const criticalAnimationType = ref < 'success' | 'failure' | null > (null)

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
    const response = await $fetch < { success: boolean, data: any[] } > (`/api/characters?player=${user.value.id}`)
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
        activeCharacterAttacks.value = []
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
    activeCharacterAttacks.value = []
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

      // Load character attacks
      activeCharacterAttacks.value = character.attacks || []
      console.log('⚔️ Loaded character attacks:', activeCharacterAttacks.value.length, 'attacks')

      // Show attacks automatically when in combat and it's player's turn
      showCharacterAttacks.value = isInBattle.value && isPlayerTurn()

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

    // Only update stats if we're in a valid room
    if (currentRoom.value && currentRoom.value.code !== 'default') {
      if (userRole.value === 'Player') {
        await loadPlayerStats(currentRoom.value.code)
      } else {
        await loadAllPlayersStats(currentRoom.value.code)
      }

      // Re-join room with updated role
      if (isConnected.value && !isOfflineMode.value) {
        await joinRoom(currentRoom.value.code)
      }
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

  // Convert everything to gold pieces
  // 1 pp = 10 gp, 1 ep = 0.5 gp, 1 sp = 0.1 gp, 1 cp = 0.01 gp
  const total = (platinum * 10) + gold + (electrum * 0.5) + (silver * 0.1) + (copper * 0.01)
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

function calculateSkillModifier(skill: any, character: any): number {
  if (!skill || !character) return 0

  // Get the base ability score
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

  // Add proficiency bonus if proficient
  let proficiencyBonus = 0
  if (skill.proficient) {
    proficiencyBonus = character.proficiencyBonus || 2
    // Double proficiency bonus if expertise
    if (skill.expertise) {
      proficiencyBonus *= 2
    }
  }

  return abilityModifier + proficiencyBonus
}

function calculateSavingThrowModifier(savingThrow: any, character: any): number {
  if (!savingThrow || !character) return 0

  // Get the base ability score
  const abilityMap: Record<string, string> = {
    'strength': 'strength',
    'dexterity': 'dexterity',
    'constitution': 'constitution',
    'intelligence': 'intelligence',
    'wisdom': 'wisdom',
    'charisma': 'charisma'
  }

  const abilityField = abilityMap[savingThrow.ability.toLowerCase()] || savingThrow.ability.toLowerCase()
  const abilityScore = character[abilityField] || 10
  const abilityModifier = calculateModifier(abilityScore)

  // Add proficiency bonus if proficient
  const proficiencyBonus = savingThrow.proficient ? (character.proficiencyBonus || 2) : 0

  return abilityModifier + proficiencyBonus
}

// Helper function to calculate saving throw modifier by ability name
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

  // Get the base ability score
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

  // Add proficiency bonus if proficient
  let proficiencyBonus = 0
  if (skill.proficient) {
    proficiencyBonus = character.proficiencyBonus || 2
    // Double proficiency bonus if expertise
    if (skill.expertise) {
      proficiencyBonus *= 2
    }
  }

  return abilityModifier + proficiencyBonus
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

async function rollDice(customSelection?: Record<string, number> | any) {
  const diceSelection: Record<string, number> = (customSelection && typeof customSelection === 'object' && !customSelection.target) 
    ? customSelection 
    : selectedDice.value
  const totalSelected = Object.values(diceSelection).reduce((sum: number, count: number) => sum + count, 0)

  if (totalSelected === 0) return

  isRolling.value = true

  // Add dramatic animation  all selected dice
  Object.entries(diceSelection).forEach(([diceType, count]) => {
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
    for (const [diceType, count] of Object.entries(diceSelection)) {
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

    // Create flat array of individual dice results
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

    // Add to history (newest first)
    rollHistory.value.unshift(roll)

    // Show critical animation if it's a critical roll
    if (isCritical && criticalType) {
      criticalAnimationType.value = criticalType
      showCriticalAnimation.value = true
      // Video will auto-close when it ends via @ended event
    }

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

// Character Attack Functions
async function rollAttack(attack: any) {
  if (!attack || isRollingAttack.value) return

  isRollingAttack.value = true

  try {
    // Calculate attack roll: 1d20 + attack bonus
    const d20Roll = rollSingleDie(20)
    const attackBonus = attack.attackBonus || 0
    const total = d20Roll + attackBonus

    // Determine if it's a critical hit or miss
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
        console.error('⚔️ Failed to submit attack roll to server:', error)
      }
    }

  } catch (error) {
    console.error('⚔️ Failed to roll attack:', error)
  } finally {
    isRollingAttack.value = false

    // Automatically roll damage after attack (if attack has damage)
    if (attack.damage) {
      // Add a small delay to show attack roll first, then damage
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

async function updateUserName() {
  if (userName.value.trim()) {
    // Load characters for the new user name and auto-detect role
    await loadUserCharacters()

    if (isConnected.value && !isOfflineMode.value && currentRoom.value && currentRoom.value.code !== 'default') {
      try {
        await joinRoom(currentRoom.value.code) // Re-join with updated name and role
        console.log('Updated user name to:', userName.value)
      } catch (error) {
        console.error('Failed to update user name:', error)
        console.log('Updated user name to:', userName.value, '(locally only)')
      }
    } else {
      console.log('Updated user name to:', userName.value, '(offline mode or no valid room)')
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
    // Sync roll history when stats are loaded
    await syncRollHistory(roomCode)
    return
  }

  // Fallback to dice room store stats (this was the old behavior)
  await syncRollHistory(roomCode)
  
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

  // Sync roll history when loading all player stats
  await syncRollHistory(roomCode)

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

async function clearHistory() {
  try {
    // Call backend to clear history for all players
    await $fetch('/api/dice/clear-history', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value?.code || 'default'
      }
    })
    
    // Clear local history
    rollHistory.value = []
    console.log('🎲 Roll history cleared successfully')
  } catch (error) {
    console.error('Failed to clear roll history:', error)
    // Still clear local history even if backend call fails
    rollHistory.value = []
  }
}

// Sync roll history from server
async function syncRollHistory(roomCode?: string) {
  if (!roomCode) return
  
  try {
    console.log('🎲 Syncing roll history for room:', roomCode)
    const response = await $fetch(`/api/dice/rooms/${roomCode}/state`)
    
    if (response.rollHistory && Array.isArray(response.rollHistory)) {
      // Process synced rolls to ensure proper timestamps and diceResults
      const processedRolls = response.rollHistory.map((roll: any) => {
        // Ensure diceResults exists (for backward compatibility)
        let diceResults = roll.diceResults
        if (!diceResults && roll.diceRolled) {
          diceResults = []
          roll.diceRolled.forEach((dice: any) => {
            dice.results.forEach((result: number) => {
              diceResults!.push({ type: dice.type, result })
            })
          })
        }

        return {
          ...roll,
          timestamp: new Date(roll.timestamp),
          isOwn: roll.userId === userId.value,
          diceResults: diceResults || []
        }
      })

      // Replace current history with synced history
      rollHistory.value = processedRolls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      console.log('🎲 Roll history synced manually from server')
    }
  } catch (error) {
    console.error('Failed to sync roll history:', error)
  }
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
  return 'text-white text-white'
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

      // Start heartbeat to maintain session alive
      if (roomCode && roomCode !== 'default') {
        startHeartbeat()
        console.log('🎲 Heartbeat started for room:', roomCode)
      }

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
      try {
        if (!event.data) {
          console.warn('🎲 SSE connected event with no data')
          return
        }
        const data = JSON.parse(event.data)
        console.log('🎲 SSE connected with ID:', data.connectionId)
      } catch (error) {
        console.error('🎲 Error processing connected event:', error)
      }
    })

    eventSource.value.addEventListener('users:count', (event) => {
      try {
        if (!event.data) {
          console.warn('🎲 SSE users:count event with no data')
          return
        }
        const data = JSON.parse(event.data)
        connectedUsers.value = data.count
      } catch (error) {
        console.error('🎲 Error processing users:count event:', error)
      }
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

    eventSource.value.addEventListener('dice:history:cleared', (event) => {
      const data = JSON.parse(event.data)
      console.log('🎲 Roll history cleared by another user')
      rollHistory.value = []
    })

    eventSource.value.addEventListener('dice:history:sync', (event) => {
      const data = JSON.parse(event)
      const { rollHistory: syncedHistory } = data
      
      if (syncedHistory && Array.isArray(syncedHistory)) {
        // Process synced rolls to ensure proper timestamps and diceResults
        const processedRolls = syncedHistory.map(roll => {
          // Ensure diceResults exists (for backward compatibility)
          let diceResults = roll.diceResults
          if (!diceResults && roll.diceRolled) {
            diceResults = []
            roll.diceRolled.forEach((dice: any) => {
              dice.results.forEach((result: number) => {
                diceResults!.push({ type: dice.type, result })
              })
            })
          }

          return {
            ...roll,
            timestamp: new Date(roll.timestamp),
            isOwn: roll.userId === userId.value,
            diceResults: diceResults || []
          }
        })

        // Replace current history with synced history
        rollHistory.value = processedRolls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        console.log('🎲 Roll history synced with server')
      }
    })

    // Handle room state sync (for reconnection scenarios)
    window.addEventListener('room:state:sync', (event) => {
      const data = (event as any).detail
      
      if (data.rollHistory && Array.isArray(data.rollHistory)) {
        // Process synced rolls to ensure proper timestamps and diceResults
        const processedRolls = data.rollHistory.map((roll: any) => {
          // Ensure diceResults exists (for backward compatibility)
          let diceResults = roll.diceResults
          if (!diceResults && roll.diceRolled) {
            diceResults = []
            roll.diceRolled.forEach((dice: any) => {
              dice.results.forEach((result: number) => {
                diceResults!.push({ type: dice.type, result })
              })
            })
          }

          return {
            ...roll,
            timestamp: new Date(roll.timestamp),
            isOwn: roll.userId === userId.value,
            diceResults: diceResults || []
          }
        })

        // Replace current history with synced history
        rollHistory.value = processedRolls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        console.log('🎲 Roll history synced from room state')
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

    eventSource.value.addEventListener('music:track_added', (event) => {
      const data = JSON.parse(event.data)

      // Check if track already exists to prevent duplicates
      const existingTrack = musicState.value.playlist.find(t => t.id === data.track.id)
      if (!existingTrack) {
        musicState.value.playlist.push(data.track)

        // If it's a sound effect, add it to the playable track IDs
        if (data.track.isSoundEffect || data.track.isPlayableWhileMusic) {
          musicState.value.soundEffects.playableTrackIds.add(data.track.id)
        }

        console.log('🎵 Track added to playlist:', data.track.title)

        const toast = useToast()
        toast.add({
          title: data.track.isSoundEffect ? 'Sound Effect Added' : 'Track Added',
          description: `${data.track.isSoundEffect ? '🔊' : '🎵'} ${data.track.title}`,
          color: data.track.isSoundEffect ? 'purple' : 'green'
        })
      }
    })

    // Sound Effects SSE Event Handlers
    eventSource.value.addEventListener('music:sound_effects_volume_changed', (event) => {
      const data = JSON.parse(event.data)
      musicState.value.soundEffects.soundEffectsVolume = data.soundEffectsVolume
      console.log('🔊 Sound effects volume changed:', data.soundEffectsVolume)
    })

    eventSource.value.addEventListener('music:sound_effect_played', (event) => {
      const data = JSON.parse(event.data)
      console.log('🔊 Sound effect played event received:', data)
      console.log('🔊 Track data:', data.track)
      console.log('🔊 Volume data:', data.volume)

      // Update last played timestamp
      musicState.value.soundEffects.lastSoundEffectPlayed = new Date(data.timestamp)

      // Actually play the sound effect audio
      if (data.track?.url) {
        console.log('🔊 Calling playSoundEffectAudio with:', data.track.url, data.volume || musicState.value.soundEffects.soundEffectsVolume)
        playSoundEffectAudio(data.track.url, data.volume || musicState.value.soundEffects.soundEffectsVolume)
      } else {
        console.error('🔊 No track URL found in sound effect data:', data)
      }

      const toast = useToast()
      toast.add({
        title: 'Sound Effect',
        description: `🔊 ${data.track?.title || 'Sound effect'} played`,
        color: 'purple'
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

      // Load initial music state for DMs
      await loadInitialMusicState(roomCode)
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

      showMusicToast('Track Added', `Added "${response.track.title}" to playlist`, 'green')
    } else {
      console.error('🎵 API returned unsuccessful response:', response)
      throw new Error(response?.message || 'API returned unsuccessful response')
    }
  } catch (error: any) {
    console.error('🎵 Failed to add track:', error)

    showMusicToast('Error', error.data?.statusMessage || error.message || 'Failed to add track to playlist', 'red')
  } finally {
    clearTimeout(fallbackTimeout) // Clear the fallback timeout
    const finalTime = Date.now()
    console.log('🎵 Setting isAddingTrack to false', `(total time: ${finalTime - startTime}ms)`)
    isAddingTrack.value = false
  }
}

// Sound Effects Functions
async function setSoundEffectsVolume() {
  if (!currentRoom.value) return

  try {
    const response = await $fetch('/api/music/sound-effects-volume', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        soundEffectsVolume: musicState.value.soundEffects.soundEffectsVolume
      }
    })

    if (response.success) {
      console.log('🔊 Sound effects volume set to:', musicState.value.soundEffects.soundEffectsVolume)
    }
  } catch (error) {
    console.error('Failed to set sound effects volume:', error)
    // Don't show toast for volume changes as they happen frequently
  }
}

async function playSoundEffect(trackId: string) {
  if (!currentRoom.value) return

  try {
    const response = await $fetch('/api/music/play-sound-effect', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        trackId: trackId
      }
    })

    if (response.success) {
      console.log('🔊 Sound effect played:', trackId)

      showMusicToast('Sound Effect Played', '🔊 Sound effect triggered for all players', 'blue')
    }
  } catch (error) {
    console.error('Failed to play sound effect:', error)
    showMusicToast('Error', 'Failed to play sound effect', 'red')
  }
}

// Function to actually play sound effect audio for all clients
// Ensure YouTube API is ready for sound effects
function ensureYouTubeAPIForSoundEffects(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.YT && window.YT.Player) {
      console.log('🔊 YouTube API already available for sound effects')
      resolve(true)
      return
    }

    // If the main music player has already loaded the API, it should be available
    if (isYouTubeAPIReady.value) {
      console.log('🔊 YouTube API marked as ready')
      // Wait a moment for the API to fully initialize
      setTimeout(() => {
        if (window.YT && window.YT.Player) {
          resolve(true)
        } else {
          console.error('🔊 YouTube API marked ready but not actually available')
          resolve(false)
        }
      }, 100)
      return
    }

    // Try to wait for the API to become available
    let attempts = 0
    const checkAPI = () => {
      attempts++
      if (window.YT && window.YT.Player) {
        console.log('🔊 YouTube API became available after', attempts, 'attempts')
        resolve(true)
      } else if (attempts < 20) { // Wait up to 10 seconds
        setTimeout(checkAPI, 500)
      } else {
        console.error('🔊 YouTube API not available after waiting')
        resolve(false)
      }
    }

    checkAPI()
  })
}

function playSoundEffectAudio(youtubeUrl: string, volume: number = 50) {
  try {
    // Extract YouTube video ID
    const videoId = extractYouTubeVideoId(youtubeUrl)
    if (!videoId) {
      console.error('🔊 Invalid YouTube URL for sound effect:', youtubeUrl)
      return
    }

    console.log('🔊 Playing sound effect:', videoId, 'at volume:', volume)

    // Ensure YouTube API is available, then create player
    ensureYouTubeAPIForSoundEffects().then((apiReady) => {
      if (apiReady) {
        createSoundEffectPlayer(videoId, volume)
      } else {
        console.error('🔊 Cannot play sound effect - YouTube API not available')
        // Could add a fallback here, but for volume control we need the API
      }
    })

  } catch (error) {
    console.error('🔊 Error playing sound effect audio:', error)
  }
}

// Create a YouTube Player specifically for sound effects with volume control
function createSoundEffectPlayer(videoId: string, volume: number) {
  // Create unique ID for this sound effect player
  const playerId = `sound-effect-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Create container div
  const playerDiv = document.createElement('div')
  playerDiv.id = playerId
  playerDiv.style.position = 'absolute'
  playerDiv.style.left = '-9999px'
  playerDiv.style.top = '-9999px'
  playerDiv.style.width = '1px'
  playerDiv.style.height = '1px'
  playerDiv.style.opacity = '0'
  playerDiv.style.pointerEvents = 'none'

  // Add to sound effects container
  let container = document.getElementById('sound-effects-container')
  if (!container) {
    console.log('🔊 Creating sound effects container')
    container = document.createElement('div')
    container.id = 'sound-effects-container'
    container.style.display = 'none'
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    document.body.appendChild(container)
  }

  container.appendChild(playerDiv)
  console.log('🔊 Sound effect player container created:', playerId)

  // Add small delay to avoid conflicts with main player
  setTimeout(() => {
    try {
      if (!window.YT || !window.YT.Player) {
        console.error('🔊 YouTube API not available when creating sound effect player')
        if (playerDiv && playerDiv.parentNode) {
          playerDiv.parentNode.removeChild(playerDiv)
        }
        return
      }

      console.log('🔊 Creating YouTube Player for sound effect')
      const player = new window.YT.Player(playerId, {
        height: '1',
        width: '1',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          start: 0,
          end: 10,  // Play only first 10 seconds
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            console.log('🔊 Sound effect player ready, setting volume to:', volume)
            try {
              // Set volume and play
              event.target.setVolume(Math.max(0, Math.min(100, volume)))
              event.target.playVideo()
              console.log('🔊 Sound effect playback started at volume:', volume)
            } catch (e) {
              console.error('🔊 Error setting volume or starting playback:', e)
            }
          },
          onStateChange: (event) => {
            console.log('🔊 Sound effect player state changed:', event.data)
            // Clean up when finished (ENDED = 0)
            if (event.data === 0) {
              console.log('🔊 Sound effect ended, cleaning up')
              setTimeout(() => cleanupPlayer(player, playerDiv), 1000)
            }
          },
          onError: (event) => {
            console.error('🔊 Sound effect player error:', event.data)
            setTimeout(() => cleanupPlayer(player, playerDiv), 1000)
          }
        }
      })

      // Safety cleanup after 15 seconds
      setTimeout(() => {
        console.log('🔊 Safety cleanup for sound effect player')
        cleanupPlayer(player, playerDiv)
      }, 15000)

    } catch (error) {
      console.error('🔊 Error creating YouTube player for sound effect:', error)
      // Remove the div if player creation failed
      if (playerDiv && playerDiv.parentNode) {
        playerDiv.parentNode.removeChild(playerDiv)
      }
    }
  }, 100) // Small delay to avoid conflicts
}

// Clean up a sound effect player
function cleanupPlayer(player: any, playerDiv: HTMLElement) {
  try {
    if (player && typeof player.destroy === 'function') {
      player.destroy()
      console.log('🔊 YouTube player destroyed')
    }
  } catch (e) {
    console.log('🔊 Error destroying player:', e.message)
  }

  try {
    if (playerDiv && playerDiv.parentNode) {
      playerDiv.parentNode.removeChild(playerDiv)
      console.log('🔊 Player div removed from DOM')
    }
  } catch (e) {
    console.log('🔊 Error removing player div:', e.message)
  }
}



// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

async function addTrackAsSoundEffect() {
  if (!newTrackUrl.value.trim() || !currentRoom.value) return

  isAddingTrack.value = true
  try {
    const response = await $fetch('/api/music/add-track', {
      method: 'POST',
      body: {
        roomCode: currentRoom.value.code,
        url: newTrackUrl.value.trim(),
        isSoundEffect: true,
        isPlayableWhileMusic: true
      }
    })

    if (response.success) {
      console.log('🔊 Sound effect added:', response.track)

      // Clear the input field
      newTrackUrl.value = ''

      // The track will be added to playlist via SSE event
      showMusicToast('Sound Effect Added', `Added "${response.track.title}" as sound effect`, 'green')
    }
  } catch (error) {
    console.error('Failed to add sound effect:', error)
    showMusicToast('Error', 'Failed to add sound effect', 'red')
  } finally {
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

      // Clear the input field
      newTrackUrl.value = ''

      // The track and playback state will be updated via SSE events
      showMusicToast('Track Added & Playing', `🎵 ${response.track.title}`, 'green')
    }
  } catch (error) {
    console.error('Failed to add and play track:', error)
    showMusicToast('Error', 'Failed to add and play track', 'red')
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

      showMusicToast('Music Paused', 'Music has been paused for all participants', 'yellow')
    }
  } catch (error) {
    console.error('Failed to pause music:', error)
    showMusicToast('Error', 'Failed to pause music', 'red')
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

      showMusicToast('Music Resumed', 'Music has been resumed for all participants', 'green')
    }
  } catch (error) {
    console.error('Failed to resume music:', error)
    showMusicToast('Error', 'Failed to resume music', 'red')
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

      showMusicToast('Music Stopped', 'Music has been stopped for all participants', 'blue')
    }
  } catch (error) {
    console.error('Failed to stop music:', error)
    showMusicToast('Error', 'Failed to stop music', 'red')
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

      showMusicToast('Playlist Cleared', 'All tracks have been removed from the playlist', 'blue')
    }
  } catch (error) {
    console.error('Failed to clear playlist:', error)
    showMusicToast('Error', 'Failed to clear playlist', 'red')
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

      showMusicToast('Now Playing', `Playing "${track.title}"`, 'green')
    }
  } catch (error) {
    console.error('Failed to play track:', error)
    showMusicToast('Error', 'Failed to play track', 'red')
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

      // Clean up sound effects tracking
      musicState.value.soundEffects.playableTrackIds.delete(trackId)

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
    showMusicToast('Error', 'Failed to remove track', 'red')
  }
}

// Utility function to format duration in seconds to MM:SS format
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Load initial music state when joining a room
async function loadInitialMusicState(roomCode?: string) {
  if (!roomCode || !userRole.value || userRole.value === 'Player') {
    console.log('🎵 Skipping music state load - no room or not DM')
    return
  }

  try {
    console.log('🎵 Loading initial music state for room:', roomCode)

    const response = await $fetch(`/api/music/state?roomCode=${encodeURIComponent(roomCode)}`)

    if (response.success && response.musicState) {
      console.log('🎵 Initial music state loaded:', response.musicState)

      // Update local music state
      musicState.value.isPlaying = response.musicState.isPlaying || false
      musicState.value.currentTrack = response.musicState.currentTrack || null
      musicState.value.volume = response.musicState.volume || 50
      musicState.value.playlist = response.musicState.playlist || []

      if (response.musicState.soundEffects) {
        musicState.value.soundEffects.soundEffectsVolume = response.musicState.soundEffects.soundEffectsVolume || 75
        musicState.value.soundEffects.playableTrackIds = new Set(response.musicState.soundEffects.playableTrackIds || [])
        musicState.value.soundEffects.lastSoundEffectPlayed = response.musicState.soundEffects.lastSoundEffectPlayed || null
      }

      console.log('🎵 Updated local music state:', musicState.value)

      // Initialize YouTube player with current track if available
      if (response.musicState.currentTrack && isYouTubePlayerReady()) {
        console.log('🎵 Syncing YouTube player with loaded music state')
        syncPlayerWithMusicState()
      }

    } else {
      console.log('🎵 No initial music state found for room:', roomCode)
    }

  } catch (error) {
    console.error('🎵 Failed to load initial music state:', error)
  }
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

  // Don't set any initial room state
  // Users must create or join a room explicitly
  currentRoom.value = null

  // Load user characters and auto-detect role
  await loadUserCharacters()

  // Initialize YouTube player if there's music content
  console.log('🎵 Initializing YouTube player...')
  await initializeYouTubePlayer()

  // Add global diagnostic function for debugging
  window.diagnoseMusicSystem = diagnoseMusicSystem
  window.forceReinitializePlayer = forceReinitializePlayer

  // Add debug function for testing sound effects volume
  window.testSoundEffectVolume = (url: string, volume: number = 50) => {
    console.log(`🔊 Testing sound effect at volume ${volume}%:`, url)
    playSoundEffectAudio(url, volume)
  }

  // Add debug function to test with a sample YouTube URL
  window.testSoundEffect = (volume: number = 50) => {
    const sampleUrl = 'https://www.youtube.com/watch?v=2WPCLda_erI' // Short sound effect
    console.log(`🔊 Testing with sample URL at volume ${volume}%`)
    playSoundEffectAudio(sampleUrl, volume)
  }

  // Add function to check YouTube API status
  window.checkYouTubeAPI = () => {
    console.log('YouTube API status:', {
      windowYT: !!window.YT,
      YTPlayer: !!(window.YT && window.YT.Player),
      isAPIReady: isYouTubeAPIReady.value,
      youtubePlayerExists: !!youtubePlayer.value
    })
  }

  // Don't automatically connect to any room
  // Users must create or join a room explicitly
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

<style scoped>
:deep(.modal-custom-size [id*="headlessui-dialog-panel-v-"] > div) {
  width: 1800px !important;
  max-width: 1800px !important;
  height: 600px !important;
  max-height: 600px !important;
}

/* :deep(.modal-custom-size [id*="headlessui-dialog-panel-v-"] > div) { */
/*   width: 100% !important; */
/*   max-width: none !important; */
/*   min-width: 1750px !important; */
/* } */

:deep(.modal-custom-size .grid) {
  width: 100% !important;
  max-width: none !important;
}
</style>
