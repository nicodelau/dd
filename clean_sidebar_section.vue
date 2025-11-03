      <!-- Main content area with dual sidebars -->
      <div class="relative">
        <!-- Mobile Overlays -->
        <div v-if="isLeftSidebarOpen || isRightSidebarOpen" class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          @click="isLeftSidebarOpen = false; isRightSidebarOpen = false">
        </div>

        <!-- Left Sidebar - Character Info -->
        <div
          class="fixed top-0 left-0 h-full w-80 max-w-full bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto lg:w-80 md:w-72 sm:w-64"
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
          class="fixed top-0 right-0 h-full w-80 max-w-full bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto lg:w-80 md:w-72 sm:w-64"
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
                          {{ playerStats.abilities.strength >= 0 ? '+' : '' }}{{ playerStats.abilities.strength }} mod
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
                          {{ playerStats.abilities.dexterity >= 0 ? '+' : '' }}{{ playerStats.abilities.dexterity }} mod
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
                          {{ playerStats.abilities.constitution >= 0 ? '+' : '' }}{{ playerStats.abilities.constitution }} mod
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
                          {{ playerStats.abilities.intelligence >= 0 ? '+' : '' }}{{ playerStats.abilities.intelligence }} mod
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
                          {{ playerStats.abilities.wisdom >= 0 ? '+' : '' }}{{ playerStats.abilities.wisdom }} mod
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
                          {{ playerStats.abilities.charisma >= 0 ? '+' : '' }}{{ playerStats.abilities.charisma }} mod
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
                    <UButton color="blue" variant="outline" size="xs" @click="editPlayerStats(player)"
                      icon="i-heroicons-pencil">
                      Edit
                    </UButton>
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

        <!-- Main content area (centered between sidebars) -->
        <div class="transition-all duration-300"
          :class="{
            'lg:ml-80 xl:ml-80': isLeftSidebarOpen,
            'lg:mr-80 xl:mr-80': isRightSidebarOpen
          }">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column - Dice Rolling -->
            <div class="lg:col-span-2 space-y-6">
              <!-- User Info Card -->
              <UCard>
                <template #header>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Your Identity
                  </h3>
                </template>

                <div class="space-y-4">
                  <!-- Auto-detected Role Display -->
                  <div>
                    <UFormGroup label="Your Role">
                      <div class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="text-2xl">
                          {{ userRole === 'DM' ? '🎯' : '🎭' }}
                        </div>
                        <div class="flex-1">
                          <div class="font-medium text-gray-900 dark:text-white">
                            {{ userRole === 'DM' ? 'Dungeon Master (DM)' : 'Player' }}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            {{ userRole === 'DM'
                              ? 'Auto-detected: No characters found'
                              : `Auto-detected: ${userCharacters.length} character${userCharacters.length !== 1 ? 's' : ''} found`
                            }}
                          </div>
                        </div>
                        <UButton color="gray" variant="ghost" size="xs" @click="refreshUserData"
                          icon="i-heroicons-arrow-path" :loading="isRefreshingUserData">
                          Refresh
                        </UButton>
                      </div>
                    </UFormGroup>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {{ userRole === 'DM'
                        ? 'As a DM, you can view and modify all player stats'
                        : 'As a Player, you can view and edit your own character stats'
                      }}
                    </p>
                  </div>

                  <!-- Name Display (Read-only for authenticated users) -->
                  <div>
                    <UFormGroup label="Your Name">
                      <div class="flex items-center space-x-4">
                        <div class="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span class="text-gray-900 dark:text-white font-medium">{{ userName }}</span>
                          <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">(from your account)</span>
                        </div>
                        <UButton color="gray" variant="outline" @click="refreshUserData"
                          icon="i-heroicons-arrow-path" :loading="isRefreshingUserData">
                          Refresh
                        </UButton>
                      </div>
                    </UFormGroup>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Your name is automatically set from your authenticated user account
                    </p>
                  </div>

                  <!-- Character Selection (for Players) -->
                  <div v-if="userRole === 'Player' && userCharacters.length > 0">
                    <UFormGroup label="Active Character">
                      <USelect v-model="activeCharacterId" :options="userCharacters.map(c => ({
                        label: `${c.characterName} (Level ${c.classLevel} ${c.className})`,
                        value: c.id
                      }))" placeholder="Select your character" class="w-full" @change="onActiveCharacterChange" />
                    </UFormGroup>
                  </div>
                </div>

                <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  {{ isOfflineMode
                    ? 'You\'re in offline mode. Your rolls are only visible to you.'
                    : 'Your name and role will be visible to other players when you roll dice.'
                  }}
                </p>
              </UCard>

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
                        @click="setQuickRoll(roll)" class="text-xs">
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
    </main>