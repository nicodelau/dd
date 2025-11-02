// In-memory store for dice room state
// This manages users, dice rolls, and SSE connections

export interface DiceRoll {
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

export interface DiceUser {
  id: string
  name: string
  joinedAt: Date
  lastSeen: Date
}

export interface DiceRoom {
  users: Map<string, DiceUser>
  rollHistory: DiceRoll[]
  sseConnections: Map<string, { response: any; userId: string }>
}

class DiceRoomStore {
  private room: DiceRoom = {
    users: new Map(),
    rollHistory: [],
    sseConnections: new Map()
  }

  // User management
  addUser(userId: string, name: string): DiceUser {
    const user: DiceUser = {
      id: userId,
      name: name || `User${Date.now()}`,
      joinedAt: new Date(),
      lastSeen: new Date()
    }
    
    this.room.users.set(userId, user)
    this.broadcastUserCount()
    
    console.log(`🎲 User joined: ${user.name} (${userId})`)
    return user
  }

  updateUser(userId: string, name: string): DiceUser | null {
    const user = this.room.users.get(userId)
    if (user) {
      user.name = name
      user.lastSeen = new Date()
      this.room.users.set(userId, user)
      console.log(`🎲 User updated: ${user.name} (${userId})`)
      return user
    }
    return null
  }

  removeUser(userId: string): boolean {
    const user = this.room.users.get(userId)
    if (user) {
      this.room.users.delete(userId)
      this.room.sseConnections.delete(userId)
      this.broadcastUserCount()
      console.log(`🎲 User left: ${user.name} (${userId})`)
      return true
    }
    return false
  }

  getUser(userId: string): DiceUser | null {
    return this.room.users.get(userId) || null
  }

  // Update user activity (called on any user action)
  updateUserActivity(userId: string): void {
    const user = this.room.users.get(userId)
    if (user) {
      user.lastSeen = new Date()
      this.room.users.set(userId, user)
    }
  }

  getUserCount(): number {
    return this.room.users.size
  }

  // Roll management
  addRoll(roll: Omit<DiceRoll, 'id' | 'timestamp'>): DiceRoll {
    const completeRoll: DiceRoll = {
      ...roll,
      id: `roll_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date()
    }

    // Add to history (keep last 100 rolls)
    this.room.rollHistory.unshift(completeRoll)
    if (this.room.rollHistory.length > 100) {
      this.room.rollHistory = this.room.rollHistory.slice(0, 100)
    }

    // Broadcast to all connected users
    this.broadcastRoll(completeRoll)
    
    console.log(`🎲 Roll added: ${completeRoll.userName} rolled ${completeRoll.total}`)
    return completeRoll
  }

  getRollHistory(): DiceRoll[] {
    return [...this.room.rollHistory]
  }

  clearRollHistory(): void {
    this.room.rollHistory = []
    this.broadcastEvent('dice:history:cleared', {})
  }

  // SSE connection management
  addSSEConnection(connectionId: string, response: any, userId: string): void {
    this.room.sseConnections.set(connectionId, { response, userId })
    
    // Send initial data to new connection
    this.sendToConnection(connectionId, 'users:count', { count: this.getUserCount() })
    this.sendToConnection(connectionId, 'dice:history', { history: this.getRollHistory() })
    
    console.log(`🎲 SSE connection added: ${connectionId} for user ${userId}`)
  }

  removeSSEConnection(connectionId: string): void {
    const connection = this.room.sseConnections.get(connectionId)
    if (connection) {
      this.room.sseConnections.delete(connectionId)
      console.log(`🎲 SSE connection removed: ${connectionId}`)
    }
  }

  // Broadcasting methods
  private sendToConnection(connectionId: string, event: string, data: any): void {
    const connection = this.room.sseConnections.get(connectionId)
    if (connection?.response) {
      try {
        const sseData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        connection.response.write(sseData)
      } catch (error) {
        console.error(`🎲 Error sending to connection ${connectionId}:`, error)
        this.removeSSEConnection(connectionId)
      }
    }
  }

  private broadcastEvent(event: string, data: any): void {
    const deadConnections: string[] = []
    
    for (const [connectionId, connection] of this.room.sseConnections) {
      try {
        const sseData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        connection.response.write(sseData)
      } catch (error) {
        console.error(`🎲 Error broadcasting to ${connectionId}:`, error)
        deadConnections.push(connectionId)
      }
    }

    // Clean up dead connections
    deadConnections.forEach(id => this.removeSSEConnection(id))
  }

  private broadcastRoll(roll: DiceRoll): void {
    // Send roll to all connections except the sender
    for (const [connectionId, connection] of this.room.sseConnections) {
      if (connection.userId !== roll.userId) {
        this.sendToConnection(connectionId, 'dice:roll', { 
          ...roll, 
          isOwn: false 
        })
      }
    }
  }

  private broadcastUserCount(): void {
    this.broadcastEvent('users:count', { count: this.getUserCount() })
  }

  // Cleanup inactive connections and users
  cleanup(): void {
    const now = new Date()
    const deadConnections: string[] = []

    // Remove connections older than 5 minutes without activity
    for (const [connectionId, connection] of this.room.sseConnections) {
      try {
        // Send ping to test connection
        connection.response.write(`event: ping\ndata: ${now.toISOString()}\n\n`)
      } catch (error) {
        deadConnections.push(connectionId)
      }
    }

    deadConnections.forEach(id => this.removeSSEConnection(id))

    // Remove users who haven't been seen in 5 minutes (300 seconds)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const removedUsers: string[] = []
    
    for (const [userId, user] of this.room.users) {
      if (user.lastSeen < fiveMinutesAgo) {
        this.removeUser(userId)
        removedUsers.push(user.name)
      }
    }

    // Log timeout activity
    if (removedUsers.length > 0) {
      console.log(`🎲 Auto-removed ${removedUsers.length} inactive users: ${removedUsers.join(', ')}`)
    }
  }

  // Get room statistics
  getStats() {
    return {
      userCount: this.getUserCount(),
      rollCount: this.room.rollHistory.length,
      connectionCount: this.room.sseConnections.size,
      users: Array.from(this.room.users.values()).map(u => ({
        id: u.id,
        name: u.name,
        joinedAt: u.joinedAt
      }))
    }
  }
}

// Singleton instance
export const diceRoomStore = new DiceRoomStore()

// Cleanup interval - run every 1 minute to check for timeouts
setInterval(() => {
  diceRoomStore.cleanup()
}, 1 * 60 * 1000)