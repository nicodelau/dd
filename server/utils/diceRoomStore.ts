// In-memory store for dice room state with room code support
// This manages multiple rooms, users, dice rolls, and SSE connections

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

export type UserRole = 'DM' | 'Player'

export interface PlayerStats {
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

export interface DiceUser {
  id: string
  name: string
  role: UserRole
  joinedAt: Date
  lastSeen: Date
  roomCode: string
  stats?: PlayerStats // Only Players have stats, DMs don't
}

export interface DiceRoom {
  code: string
  name: string
  createdAt: Date
  createdBy: string // userId of the creator (typically the first DM)
  users: Map<string, DiceUser>
  rollHistory: DiceRoll[]
  sseConnections: Map<string, { response: any; userId: string; roomCode: string }>
}

class DiceRoomStore {
  private rooms: Map<string, DiceRoom> = new Map()
  
  // Room management
  createRoom(roomCode: string, roomName: string, creatorUserId: string): DiceRoom {
    if (this.rooms.has(roomCode)) {
      throw new Error(`Room with code ${roomCode} already exists`)
    }
    
    const room: DiceRoom = {
      code: roomCode,
      name: roomName,
      createdAt: new Date(),
      createdBy: creatorUserId,
      users: new Map(),
      rollHistory: [],
      sseConnections: new Map()
    }
    
    this.rooms.set(roomCode, room)
    console.log(`🎲 Created new room: ${roomCode} (${roomName}) by ${creatorUserId}`)
    return room
  }

  getRoom(roomCode: string): DiceRoom | null {
    return this.rooms.get(roomCode) || null
  }

  getRoomCodes(): string[] {
    return Array.from(this.rooms.keys())
  }

  deleteRoom(roomCode: string): boolean {
    if (this.rooms.has(roomCode)) {
      const room = this.rooms.get(roomCode)!
      // Close all SSE connections
      for (const [connectionId] of room.sseConnections) {
        this.removeSSEConnection(connectionId, roomCode)
      }
      this.rooms.delete(roomCode)
      console.log(`🎲 Deleted room: ${roomCode}`)
      return true
    }
    return false
  }

  // Get or create default room for backward compatibility
  private getOrCreateDefaultRoom(): DiceRoom {
    const defaultCode = 'default'
    if (!this.rooms.has(defaultCode)) {
      this.createRoom(defaultCode, 'Default Room', 'system')
    }
    return this.rooms.get(defaultCode)!
  }

  // User management
  addUser(userId: string, name: string, roomCode: string = 'default', role: UserRole = 'Player'): DiceUser {
    const room = roomCode === 'default' ? this.getOrCreateDefaultRoom() : this.getRoom(roomCode)
    if (!room) {
      throw new Error(`Room ${roomCode} does not exist`)
    }

    const user: DiceUser = {
      id: userId,
      name: name || `User${Date.now()}`,
      role,
      joinedAt: new Date(),
      lastSeen: new Date(),
      roomCode,
      stats: role === 'Player' ? this.createDefaultStats() : undefined
    }
    
    room.users.set(userId, user)
    this.broadcastUserCount(roomCode)
    
    console.log(`🎲 User joined room ${roomCode}: ${user.name} (${userId}) as ${role}`)
    return user
  }

  private createDefaultStats(): PlayerStats {
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

  updateUser(userId: string, name: string, roomCode: string = 'default', role?: UserRole): DiceUser | null {
    const room = this.getRoom(roomCode)
    if (!room) return null

    const user = room.users.get(userId)
    if (user) {
      user.name = name
      user.lastSeen = new Date()
      
      // If role is being changed, update stats accordingly
      if (role && role !== user.role) {
        user.role = role
        if (role === 'Player' && !user.stats) {
          user.stats = this.createDefaultStats()
        } else if (role === 'DM') {
          user.stats = undefined
        }
      }
      
      room.users.set(userId, user)
      console.log(`🎲 User updated in room ${roomCode}: ${user.name} (${userId}) as ${user.role}`)
      return user
    }
    return null
  }

  removeUser(userId: string, roomCode: string = 'default'): boolean {
    const room = this.getRoom(roomCode)
    if (!room) return false

    const user = room.users.get(userId)
    if (user) {
      room.users.delete(userId)
      
      // Remove user's SSE connections
      const connectionsToRemove: string[] = []
      for (const [connectionId, connection] of room.sseConnections) {
        if (connection.userId === userId) {
          connectionsToRemove.push(connectionId)
        }
      }
      connectionsToRemove.forEach(id => this.removeSSEConnection(id, roomCode))
      
      this.broadcastUserCount(roomCode)
      console.log(`🎲 User left room ${roomCode}: ${user.name} (${userId})`)
      return true
    }
    return false
  }

  // DM kick functionality
  kickUser(kickerUserId: string, targetUserId: string, roomCode: string): boolean {
    const room = this.getRoom(roomCode)
    if (!room) return false

    // Check if kicker is a DM
    const kicker = room.users.get(kickerUserId)
    if (!kicker || kicker.role !== 'DM') {
      throw new Error('Only DMs can kick players')
    }

    // Can't kick other DMs
    const target = room.users.get(targetUserId)
    if (!target) {
      throw new Error('Target user not found')
    }
    
    if (target.role === 'DM') {
      throw new Error('Cannot kick other DMs')
    }

    // Remove the user
    const success = this.removeUser(targetUserId, roomCode)
    if (success) {
      // Broadcast kick event
      this.broadcastEvent('user:kicked', { 
        kickedUserId: targetUserId, 
        kickedUserName: target.name,
        kickerName: kicker.name 
      }, roomCode)
      console.log(`🎲 User ${target.name} was kicked from room ${roomCode} by ${kicker.name}`)
    }
    return success
  }

  getUser(userId: string, roomCode: string = 'default'): DiceUser | null {
    const room = this.getRoom(roomCode)
    if (!room) return null
    return room.users.get(userId) || null
  }

  // Update user activity (called on any user action)
  updateUserActivity(userId: string, roomCode: string = 'default'): void {
    const room = this.getRoom(roomCode)
    if (!room) return

    const user = room.users.get(userId)
    if (user) {
      user.lastSeen = new Date()
      room.users.set(userId, user)
    }
  }

  getUserCount(roomCode: string = 'default'): number {
    const room = this.getRoom(roomCode)
    return room ? room.users.size : 0
  }

  // RBAC permission methods
  isDM(userId: string, roomCode: string = 'default'): boolean {
    const user = this.getUser(userId, roomCode)
    return user?.role === 'DM' || false
  }

  canModifyStats(modifierUserId: string, targetUserId: string, roomCode: string = 'default'): boolean {
    // DMs can modify anyone's stats in their room
    if (this.isDM(modifierUserId, roomCode)) {
      return true
    }
    // Players can only modify their own stats
    return modifierUserId === targetUserId
  }

  canViewStats(viewerUserId: string, targetUserId: string, roomCode: string = 'default'): boolean {
    // DMs can view all stats in their room
    if (this.isDM(viewerUserId, roomCode)) {
      return true
    }
    // Players can only view their own stats
    return viewerUserId === targetUserId
  }

  // Stats management
  updatePlayerStats(targetUserId: string, modifierUserId: string, newStats: Partial<PlayerStats>, roomCode: string = 'default'): PlayerStats | null {
    // Check permissions
    if (!this.canModifyStats(modifierUserId, targetUserId, roomCode)) {
      throw new Error('Insufficient permissions to modify stats')
    }

    const room = this.getRoom(roomCode)
    if (!room) throw new Error('Room not found')

    const user = room.users.get(targetUserId)
    if (!user || user.role !== 'Player' || !user.stats) {
      return null
    }

    // Deep merge the stats
    user.stats = {
      ...user.stats,
      ...newStats,
      abilities: newStats.abilities ? { ...user.stats.abilities, ...newStats.abilities } : user.stats.abilities,
      hitPoints: newStats.hitPoints ? { ...user.stats.hitPoints, ...newStats.hitPoints } : user.stats.hitPoints
    }

    room.users.set(targetUserId, user)
    
    // Broadcast stats update to all users in the room
    this.broadcastStatsUpdate(targetUserId, user.stats, roomCode)
    
    console.log(`🎲 Stats updated for ${user.name} by ${this.getUser(modifierUserId, roomCode)?.name} in room ${roomCode}`)
    return user.stats
  }

  getPlayerStats(targetUserId: string, viewerUserId: string, roomCode: string = 'default'): PlayerStats | null {
    // Check permissions
    if (!this.canViewStats(viewerUserId, targetUserId, roomCode)) {
      throw new Error('Insufficient permissions to view stats')
    }

    const user = this.getUser(targetUserId, roomCode)
    if (!user || user.role !== 'Player') {
      return null
    }

    return user.stats || null
  }

  getAllPlayersStats(viewerUserId: string, roomCode: string = 'default'): Array<{ userId: string; name: string; stats: PlayerStats }> {
    // Only DMs can view all player stats
    if (!this.isDM(viewerUserId, roomCode)) {
      throw new Error('Only DMs can view all player stats')
    }

    const room = this.getRoom(roomCode)
    if (!room) return []

    const playersWithStats: Array<{ userId: string; name: string; stats: PlayerStats }> = []
    
    for (const [userId, user] of room.users) {
      if (user.role === 'Player' && user.stats) {
        playersWithStats.push({
          userId,
          name: user.name,
          stats: user.stats
        })
      }
    }

    return playersWithStats
  }

  // Roll management
  addRoll(roll: Omit<DiceRoll, 'id' | 'timestamp'>, roomCode: string = 'default'): DiceRoll {
    const room = this.getRoom(roomCode)
    if (!room) {
      throw new Error('Room not found')
    }

    const completeRoll: DiceRoll = {
      ...roll,
      id: `roll_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date()
    }

    // Add to history (keep last 100 rolls)
    room.rollHistory.unshift(completeRoll)
    if (room.rollHistory.length > 100) {
      room.rollHistory = room.rollHistory.slice(0, 100)
    }

    // Broadcast to all connected users in the room
    this.broadcastRoll(completeRoll, roomCode)
    
    console.log(`🎲 Roll added in room ${roomCode}: ${completeRoll.userName} rolled ${completeRoll.total}`)
    return completeRoll
  }

  getRollHistory(roomCode: string = 'default'): DiceRoll[] {
    const room = this.getRoom(roomCode)
    return room ? [...room.rollHistory] : []
  }

  clearRollHistory(roomCode: string = 'default'): void {
    const room = this.getRoom(roomCode)
    if (room) {
      room.rollHistory = []
      this.broadcastEvent('dice:history:cleared', {}, roomCode)
    }
  }

  // SSE connection management
  addSSEConnection(connectionId: string, response: any, userId: string, roomCode: string = 'default'): void {
    const room = roomCode === 'default' ? this.getOrCreateDefaultRoom() : this.getRoom(roomCode)
    if (!room) {
      throw new Error(`Room ${roomCode} does not exist`)
    }

    room.sseConnections.set(connectionId, { response, userId, roomCode })
    
    // Send initial data to new connection
    this.sendToConnection(connectionId, 'users:count', { count: this.getUserCount(roomCode) }, roomCode)
    this.sendToConnection(connectionId, 'dice:history', { history: this.getRollHistory(roomCode) }, roomCode)
    this.sendToConnection(connectionId, 'room:info', { code: room.code, name: room.name }, roomCode)
    
    // Send user's own role and stats if they're a player
    const user = this.getUser(userId, roomCode)
    if (user) {
      this.sendToConnection(connectionId, 'user:role', { role: user.role }, roomCode)
      if (user.role === 'Player' && user.stats) {
        this.sendToConnection(connectionId, 'user:stats', { stats: user.stats }, roomCode)
      }
      
      // If user is DM, send all player stats
      if (user.role === 'DM') {
        try {
          const allStats = this.getAllPlayersStats(userId, roomCode)
          this.sendToConnection(connectionId, 'players:stats', { players: allStats }, roomCode)
        } catch (error) {
          // Ignore permission errors on connection setup
        }
      }
    }
    
    console.log(`🎲 SSE connection added to room ${roomCode}: ${connectionId} for user ${userId}`)
  }

  removeSSEConnection(connectionId: string, roomCode?: string): void {
    if (roomCode) {
      const room = this.getRoom(roomCode)
      if (room?.sseConnections.has(connectionId)) {
        room.sseConnections.delete(connectionId)
        console.log(`🎲 SSE connection removed from room ${roomCode}: ${connectionId}`)
      }
    } else {
      // Remove from all rooms if roomCode not specified
      for (const room of this.rooms.values()) {
        if (room.sseConnections.has(connectionId)) {
          room.sseConnections.delete(connectionId)
          console.log(`🎲 SSE connection removed: ${connectionId}`)
          break
        }
      }
    }
  }

  // Broadcasting methods
  private sendToConnection(connectionId: string, event: string, data: any, roomCode: string): void {
    const room = this.getRoom(roomCode)
    if (!room) return

    const connection = room.sseConnections.get(connectionId)
    if (connection?.response) {
      try {
        const sseData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        connection.response.write(sseData)
      } catch (error) {
        console.error(`🎲 Error sending to connection ${connectionId}:`, error)
        this.removeSSEConnection(connectionId, roomCode)
      }
    }
  }

  private broadcastEvent(event: string, data: any, roomCode: string): void {
    const room = this.getRoom(roomCode)
    if (!room) return

    const deadConnections: string[] = []
    
    for (const [connectionId, connection] of room.sseConnections) {
      try {
        const sseData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        connection.response.write(sseData)
      } catch (error) {
        console.error(`🎲 Error broadcasting to ${connectionId}:`, error)
        deadConnections.push(connectionId)
      }
    }

    // Clean up dead connections
    deadConnections.forEach(id => this.removeSSEConnection(id, roomCode))
  }

  private broadcastRoll(roll: DiceRoll, roomCode: string): void {
    const room = this.getRoom(roomCode)
    if (!room) return

    // Send roll to all connections except the sender
    for (const [connectionId, connection] of room.sseConnections) {
      if (connection.userId !== roll.userId) {
        this.sendToConnection(connectionId, 'dice:roll', { 
          ...roll, 
          isOwn: false 
        }, roomCode)
      }
    }
  }

  private broadcastUserCount(roomCode: string): void {
    this.broadcastEvent('users:count', { count: this.getUserCount(roomCode) }, roomCode)
  }

  private broadcastStatsUpdate(userId: string, stats: PlayerStats, roomCode: string): void {
    this.broadcastEvent('stats:updated', { userId, stats }, roomCode)
  }

  // Public method to broadcast custom events (used by API endpoints)
  sendEvent(event: string, data: any, roomCode: string): void {
    this.broadcastEvent(event, data, roomCode)
  }

  // Cleanup inactive connections and users
  cleanup(): void {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    for (const [roomCode, room] of this.rooms) {
      const deadConnections: string[] = []

      // Remove connections older than 5 minutes without activity
      for (const [connectionId, connection] of room.sseConnections) {
        try {
          // Send ping to test connection
          connection.response.write(`event: ping\ndata: ${now.toISOString()}\n\n`)
        } catch (error) {
          deadConnections.push(connectionId)
        }
      }

      deadConnections.forEach(id => this.removeSSEConnection(id, roomCode))

      // Remove users who haven't been seen in 5 minutes
      const removedUsers: string[] = []
      
      for (const [userId, user] of room.users) {
        if (user.lastSeen < fiveMinutesAgo) {
          this.removeUser(userId, roomCode)
          removedUsers.push(user.name)
        }
      }

      // Log timeout activity
      if (removedUsers.length > 0) {
        console.log(`🎲 Auto-removed ${removedUsers.length} inactive users from room ${roomCode}: ${removedUsers.join(', ')}`)
      }

      // Remove empty rooms (except default)
      if (roomCode !== 'default' && room.users.size === 0 && room.sseConnections.size === 0) {
        this.deleteRoom(roomCode)
      }
    }
  }

  // Get room statistics
  getStats(roomCode: string = 'default') {
    const room = this.getRoom(roomCode)
    if (!room) return null

    return {
      roomCode: room.code,
      roomName: room.name,
      userCount: room.users.size,
      rollCount: room.rollHistory.length,
      connectionCount: room.sseConnections.size,
      users: Array.from(room.users.values()).map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        joinedAt: u.joinedAt,
        hasStats: !!u.stats
      }))
    }
  }

  // Get all rooms info (for admin purposes)
  getAllRoomsStats() {
    const rooms = []
    for (const [roomCode, room] of this.rooms) {
      rooms.push({
        code: room.code,
        name: room.name,
        createdAt: room.createdAt,
        createdBy: room.createdBy,
        userCount: room.users.size,
        rollCount: room.rollHistory.length,
        connectionCount: room.sseConnections.size
      })
    }
    return rooms
  }
}

// Singleton instance
export const diceRoomStore = new DiceRoomStore()

// Cleanup interval - run every 1 minute to check for timeouts
setInterval(() => {
  diceRoomStore.cleanup()
}, 1 * 60 * 1000)