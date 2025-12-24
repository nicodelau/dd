<template>
  <div>
    <!-- Floating Toggle Button -->
    <div class="fixed bottom-6 right-6 z-50">
      <UButton
        color="primary"
        variant="solid"
        size="xl"
        :ui="{ rounded: 'rounded-full' }"
        icon="i-heroicons-chat-bubble-left-right"
        @click="isOpen = !isOpen"
      >
        <div v-if="unreadCount > 0" class="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-zinc-900">
          {{ unreadCount }}
        </div>
      </UButton>
    </div>

    <!-- Sidebar -->
    <div
      class="fixed inset-y-0 right-0 w-80 bg-zinc-900 border-l border-zinc-800 shadow-2xl transform transition-transform duration-300 z-40"
      :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <!-- Header -->
      <div class="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
        <h2 class="text-lg font-semibold text-white">Social</h2>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isOpen = false" />
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-zinc-800">
        <button
          class="flex-1 py-3 text-sm font-medium transition-colors border-b-2"
          :class="activeTab === 'friends' ? 'text-primary-500 border-primary-500 bg-zinc-800/50' : 'text-zinc-400 border-transparent hover:text-zinc-200'"
          @click="activeTab = 'friends'"
        >
          Friends
        </button>
        <button
          class="flex-1 py-3 text-sm font-medium transition-colors border-b-2"
          :class="activeTab === 'chats' ? 'text-primary-500 border-primary-500 bg-zinc-800/50' : 'text-zinc-400 border-transparent hover:text-zinc-200'"
          @click="activeTab = 'chats'"
        >
          Chats
          <span v-if="unreadCount > 0" class="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{{ unreadCount }}</span>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto h-[calc(100vh-130px)]">
        <!-- Friends Tab -->
        <div v-if="activeTab === 'friends'" class="p-4 space-y-4">
          <!-- Add Friend -->
          <div class="flex gap-2">
            <UInput
              v-model="friendSearch"
              placeholder="Username..."
              size="sm"
              class="flex-1"
              icon="i-heroicons-magnifying-glass"
              @keyup.enter="searchUsers"
            />
            <UButton color="primary" variant="soft" size="sm" icon="i-heroicons-plus" @click="searchUsers" :loading="isSearching" />
          </div>

          <!-- Search Results -->
          <div v-if="searchResults.length > 0" class="space-y-2">
            <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Search Results</div>
            <div v-for="user in searchResults" :key="user.id" class="flex items-center justify-between p-2 rounded bg-zinc-800/50">
              <div class="flex items-center gap-2">
                <UAvatar :src="user.avatar" :alt="user.username" size="xs" />
                <span class="text-sm text-zinc-200">{{ user.username }}</span>
              </div>
              <UButton
                v-if="!user.isFriend && !user.hasPendingRequest"
                size="xs"
                color="primary"
                variant="ghost"
                icon="i-heroicons-user-plus"
                @click="sendFriendRequest(user.id)"
              />
              <span v-else-if="user.hasPendingRequest" class="text-xs text-zinc-500">Sent</span>
            </div>
          </div>

          <!-- Pending Requests -->
          <div v-if="pendingRequests.length > 0" class="space-y-2">
            <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pending Requests</div>
            <div v-for="req in pendingRequests" :key="req.id" class="flex items-center justify-between p-2 rounded bg-zinc-800/30 border border-zinc-700">
              <div class="flex items-center gap-2">
                <UAvatar :src="req.user.avatar" :alt="req.user.username" size="xs" />
                <span class="text-sm text-zinc-200">{{ req.user.username }}</span>
              </div>
              <div class="flex gap-1">
                <UButton size="2xs" color="green" variant="ghost" icon="i-heroicons-check" @click="acceptFriendRequest(req.id)" />
                <UButton size="2xs" color="red" variant="ghost" icon="i-heroicons-x-mark" @click="rejectFriendRequest(req.id)" />
              </div>
            </div>
          </div>

          <!-- Friends List -->
          <div class="space-y-2">
            <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">My Friends</div>
            <div v-if="friends.length === 0" class="text-center text-sm text-zinc-500 py-4">No friends yet</div>
            <div v-for="friend in friends" :key="friend.id" class="group flex items-center justify-between p-2 rounded hover:bg-zinc-800 cursor-pointer" @click="startChat(friend)">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <UAvatar :src="friend.avatar" :alt="friend.username" size="sm" />
                  <div class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-zinc-900" 
                    :class="{
                      'bg-green-500': friend.status === 'online',
                      'bg-yellow-500': friend.status === 'idle',
                      'bg-zinc-500': !friend.status || friend.status === 'offline'
                    }">
                  </div>
                </div>
                <div>
                  <div class="text-sm font-medium text-zinc-200">{{ friend.username }}</div>
                  <div class="text-xs text-zinc-500 capitalize">{{ friend.status || 'Offline' }}</div>
                </div>
              </div>
              <UButton size="xs" color="gray" variant="ghost" icon="i-heroicons-chat-bubble-oval-left" class="opacity-0 group-hover:opacity-100" />
            </div>
          </div>
        </div>

        <!-- Chats Tab -->
        <div v-if="activeTab === 'chats'" class="h-full flex flex-col">
          <!-- Active Chat View -->
          <div v-if="activeChatUser" class="flex-1 flex flex-col h-full">
            <!-- Chat Header -->
            <div class="p-3 border-b border-zinc-800 flex items-center gap-2 bg-zinc-800/30">
              <UButton color="gray" variant="ghost" size="xs" icon="i-heroicons-arrow-left" @click="activeChatUser = null" />
              <UAvatar :src="activeChatUser.avatar" :alt="activeChatUser.username" size="xs" />
              <span class="text-sm font-medium text-zinc-200">{{ activeChatUser.username }}</span>
            </div>

            <!-- Messages -->
            <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3">
              <div v-for="msg in activeMessages" :key="msg.id" class="flex flex-col" :class="msg.senderId === user?.id ? 'items-end' : 'items-start'">
                <div 
                  class="max-w-[80%] rounded-lg px-3 py-2 text-sm"
                  :class="msg.senderId === user?.id ? 'bg-primary-600 text-white' : 'bg-zinc-700 text-zinc-200'"
                >
                  <p v-if="msg.isInvite" class="font-semibold text-xs mb-1 flex items-center gap-1">
                    <UIcon name="i-heroicons-ticket" class="w-3 h-3" /> Game Invite
                  </p>
                  {{ msg.content }}
                  
                  <div v-if="msg.isInvite && msg.inviteRoomCode" class="mt-2 pt-2 border-t border-white/20">
                    <UButton 
                      size="2xs" 
                      color="white" 
                      variant="solid" 
                      class="text-primary-600 w-full justify-center"
                      @click="joinRoom(msg.inviteRoomCode)"
                    >
                      Join Room
                    </UButton>
                  </div>
                </div>
                <span class="text-[10px] text-zinc-500 mt-1 px-1">{{ formatTime(msg.createdAt) }}</span>
              </div>
            </div>

            <!-- Input -->
            <div class="p-3 border-t border-zinc-800 bg-zinc-900">
              <form @submit.prevent="sendMessage" class="flex gap-2">
                <UInput v-model="messageInput" placeholder="Message..." size="sm" class="flex-1" :ui="{ rounded: 'rounded-full' }" />
                <UButton type="submit" color="primary" variant="ghost" icon="i-heroicons-paper-airplane" :disabled="!messageInput.trim()" />
              </form>
              <div class="flex justify-start mt-2" v-if="currentRoom?.code && currentRoom?.code !== 'default'">
                 <UButton size="xs" color="green" variant="ghost" icon="i-heroicons-ticket" @click="sendRoomInvite">Invite to Room</UButton>
              </div>
            </div>
          </div>

          <!-- Chat List -->
          <div v-else class="p-2 space-y-1">
            <div v-if="recentChats.length === 0" class="text-center text-sm text-zinc-500 py-8">
              No recent chats. Start a conversation from the Friends tab.
            </div>
            <div 
              v-for="chat in recentChats" 
              :key="chat.userId" 
              class="flex items-center gap-3 p-3 rounded hover:bg-zinc-800 cursor-pointer"
              @click="startChat(chat.user)"
            >
              <div class="relative">
                <UAvatar :src="chat.user.avatar" :alt="chat.user.username" size="md" />
                <div v-if="chat.unreadCount > 0" class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-zinc-900"></div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline mb-0.5">
                  <span class="text-sm font-medium text-zinc-200 truncate">{{ chat.user.username }}</span>
                  <span class="text-xs text-zinc-500">{{ formatTime(chat.lastMessageAt) }}</span>
                </div>
                <p class="text-xs text-zinc-400 truncate" :class="{'font-semibold text-zinc-200': chat.unreadCount > 0}">
                  <span v-if="chat.lastMessageIsInvite">🎫 Invite: </span>
                  {{ chat.lastMessageContent }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'

const user = useState<any>('user')
const isOpen = ref(false)
const activeTab = ref<'friends' | 'chats'>('friends')
const friendSearch = ref('')
const messageInput = ref('')
const searchResults = ref<any[]>([])
const pendingRequests = ref<any[]>([])
const friends = ref<any[]>([])
const recentChats = ref<any[]>([])
const activeChatUser = ref<any>(null)
const activeMessages = ref<any[]>([])
const isSearching = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const currentRoom = useState<any>('currentRoom') // Assuming currentRoom is global state or passed down

// Polling for updates (could be replaced by SSE later)
useIntervalFn(() => {
  if (user.value) {
    fetchFriends()
    fetchPendingRequests()
    fetchRecentChats()
    if (activeChatUser.value) {
      fetchMessages(activeChatUser.value.id)
    }
  }
}, 5000)

const unreadCount = computed(() => {
  return recentChats.value.reduce((acc, chat) => acc + chat.unreadCount, 0)
})

// --- Actions ---

const searchUsers = async () => {
  if (!friendSearch.value.trim()) return
  isSearching.value = true
  try {
    const res = await $fetch('/api/social/users/search', {
      params: { query: friendSearch.value }
    })
    searchResults.value = res.users
  } finally {
    isSearching.value = false
  }
}

const sendFriendRequest = async (friendId: string) => {
  try {
    await $fetch('/api/social/friends/request', {
      method: 'POST',
      body: { friendId }
    })
    const user = searchResults.value.find(u => u.id === friendId)
    if (user) user.hasPendingRequest = true
  } catch (error) {
    console.error('Failed to send friend request')
  }
}

const acceptFriendRequest = async (requestId: string) => {
  await $fetch('/api/social/friends/accept', {
    method: 'POST',
    body: { requestId }
  })
  fetchPendingRequests()
  fetchFriends()
}

const rejectFriendRequest = async (requestId: string) => {
  await $fetch('/api/social/friends/reject', {
    method: 'POST',
    body: { requestId }
  })
  fetchPendingRequests()
}

const fetchFriends = async () => {
  const res = await $fetch('/api/social/friends')
  friends.value = res.friends
}

const fetchPendingRequests = async () => {
  const res = await $fetch('/api/social/friends/pending')
  pendingRequests.value = res.requests
}

const fetchRecentChats = async () => {
  const res = await $fetch('/api/social/chat/recent')
  recentChats.value = res.chats
}

const startChat = (friend: any) => {
  activeChatUser.value = friend
  activeTab.value = 'chats'
  fetchMessages(friend.id)
  // Mark as read immediately
  const chat = recentChats.value.find(c => c.userId === friend.id)
  if (chat) chat.unreadCount = 0
}

const fetchMessages = async (friendId: string) => {
  const res = await $fetch('/api/social/chat/messages', {
    params: { friendId }
  })
  activeMessages.value = res.messages
  scrollToBottom()
}

const sendMessage = async () => {
  if (!messageInput.value.trim() || !activeChatUser.value) return
  
  const tempMsg = {
    id: 'temp-' + Date.now(),
    content: messageInput.value,
    senderId: user.value.id,
    createdAt: new Date(),
    isInvite: false
  }
  activeMessages.value.push(tempMsg)
  const content = messageInput.value
  messageInput.value = ''
  scrollToBottom()

  try {
    await $fetch('/api/social/chat/send', {
      method: 'POST',
      body: {
        receiverId: activeChatUser.value.id,
        content
      }
    })
    fetchMessages(activeChatUser.value.id)
  } catch (error) {
    console.error('Failed to send message')
  }
}

const sendRoomInvite = async () => {
  if (!activeChatUser.value || !currentRoom.value) return
  
  const roomCode = currentRoom.value.code
  const content = `Join me in room ${roomCode}!`
  
  try {
    await $fetch('/api/social/chat/send', {
      method: 'POST',
      body: {
        receiverId: activeChatUser.value.id,
        content,
        isInvite: true,
        inviteRoomCode: roomCode
      }
    })
    fetchMessages(activeChatUser.value.id)
  } catch (error) {
    console.error('Failed to send invite')
  }
}

const joinRoom = (code: string) => {
  const router = useRouter()
  router.push(`/dice/${code}`)
  isOpen.value = false
}

// --- Utils ---

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const formatTime = (dateStr: string | Date) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  if (user.value) {
    fetchFriends()
    fetchPendingRequests()
    fetchRecentChats()
  }
})
</script>