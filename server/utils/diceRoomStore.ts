// In-memory store for dice room state with room code support
// This manages multiple rooms, users, dice rolls, and SSE connections
import prisma from '~/server/utils/prisma'

export interface DiceRoll {
  id: string
  userName: string
  userId: string
  timestamp: Date
  description: string
  total: number
  details: (string | number)[]
  diceRolled: { type: string; count: number; results: number[] }[]
  diceResults: { type: string; result: number; isAdvantageDisadvantage?: boolean; discardedRoll?: number; selectedRoll?: number; isSelectedDie?: boolean }[]
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

// Battle mode interfaces
export interface Enemy {
  id: string
  name: string
  hitPoints: { current: number; max: number }
  armorClass: number
  initiative: number
  initiativeRoll?: number
  isDefeated: boolean
  createdBy: string // DM userId who created this enemy
}

export interface BattleParticipant {
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

export interface BattleState {
  isActive: boolean
  round: number
  currentTurnIndex: number
  participants: BattleParticipant[]
  initiativeOrder: BattleParticipant[] // Sorted by initiative for display
  enemies: Map<string, Enemy>
  initiativeRolled: boolean
  phase: 'setup' | 'rolling_initiative' | 'combat' | 'ended'
  selectedPlayerIds: Set<string> // Players selected for this battle
}

// Music system interfaces
export interface MusicTrack {
  id: string
  name: string // Keep for backward compatibility
  title: string // YouTube video title
  artist?: string // Optional artist/channel name
  url: string // YouTube URL
  duration?: number // in seconds
  addedBy: string // userId of who added this track
  addedAt: Date
  // Enhanced metadata from YouTube Data API v3
  thumbnail?: string // Video thumbnail URL
  publishedAt?: string // Video publish date
  description?: string // Video description (truncated)
  tags?: string[] // Video tags
  // Sound effect properties
  isPlayableWhileMusic?: boolean // Can play while background music is playing
  isSoundEffect?: boolean // Mark as sound effect vs background music
}

export interface SoundEffectState {
  soundEffectsVolume: number // 0-100, separate from music volume
  playableTrackIds: Set<string> // Tracks marked as playable while music is on
  lastSoundEffectPlayed?: Date
}

export interface MusicState {
  currentTrack?: MusicTrack
  isPlaying: boolean
  volume: number // 0-100
  position: number // current position in seconds
  playlist: MusicTrack[]
  fadeTransition: boolean
  lastUpdated: Date
  // Sound effects state
  soundEffects: SoundEffectState
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
  id: string // DB ID
  code: string
  name: string
  createdAt: Date
  createdBy: string // userId of the creator (typically the first DM)
  users: Map<string, DiceUser>
  rollHistory: DiceRoll[]
  sseConnections: Map<string, { response: any; userId: string; roomCode: string }>
  battleState?: BattleState // Battle mode state
  musicState?: MusicState // DJ music system state
}

class DiceRoomStore {
  private rooms: Map<string, DiceRoom> = new Map()

  // Load room from DB if not in memory
  async ensureRoomLoaded(roomCode: string): Promise<DiceRoom | null> {
    if (this.rooms.has(roomCode)) {
      return this.rooms.get(roomCode)!
    }

    // If default room, we'll handle creation if DB load fails

    try {
      const dbRoom = await prisma.diceRoom.findUnique({
        where: { code: roomCode },
        include: {
          room_participants: {
            include: { user: true }
          },
          dice_rolls: {
            orderBy: { timestamp: 'desc' },
            take: 50,
            include: { users: true }
          },
          battle_sessions: {
            include: {
              battle_participants: true
            }
          },
          music_tracks: true
        }
      })

      if (!dbRoom) {
        if (roomCode === 'default') {
          return this.createRoom('default', 'Default Room', 'system')
        }
        return null
      }

      // Map DB rolls to DiceRoll interface
      const history: DiceRoll[] = dbRoom.dice_rolls.map((r: any) => {
        const data = r.data as any
        return {
          id: r.id,
          userName: r.users?.username || 'Unknown',
          userId: r.userId,
          timestamp: r.timestamp,
          description: r.description || '',
          total: r.total,
          details: data.details || [],
          diceRolled: data.diceRolled || [],
          diceResults: data.diceResults || [],
          modifier: data.modifier || 0,
          rollType: data.rollType || 'normal',
          isCritical: data.isCritical || false,
          criticalType: data.criticalType,
          isOwn: false
        }
      })

      const room: DiceRoom = {
        id: dbRoom.id,
        code: dbRoom.code,
        name: dbRoom.name,
        createdAt: dbRoom.createdAt,
        createdBy: dbRoom.createdBy,
        users: new Map(),
        rollHistory: history,
        sseConnections: new Map()
      }

      // Populate users
      for (const p of dbRoom.room_participants) {
        let stats: PlayerStats | undefined
        if (p.role === 'Player') {
          stats = this.createDefaultStats()
        }

        room.users.set(p.userId, {
          id: p.userId,
          name: p.user?.username || `User_${p.userId.substring(0, 4)}`,
          role: p.role as UserRole,
          joinedAt: p.joinedAt,
          lastSeen: p.lastSeen,
          roomCode: roomCode,
          stats
        })
      }

      // Load Battle State
      if (dbRoom.battle_sessions) {
        const bs = dbRoom.battle_sessions
        const enemies = new Map<string, Enemy>()
        const participants: BattleParticipant[] = []
        const selectedPlayerIds = new Set<string>()

        for (const bp of bs.battle_participants) {
          const participant: BattleParticipant = {
            id: bp.id,
            name: bp.name,
            type: bp.isEnemy ? 'enemy' : 'player',
            initiative: bp.initiative,
            initiativeRoll: bp.initiativeRoll,
            hitPoints: { current: bp.hpCurrent, max: bp.hpMax },
            armorClass: bp.armorClass,
            isDefeated: bp.hpCurrent <= 0,
            userId: bp.userId || undefined
          }
          participants.push(participant)

          if (bp.isEnemy) {
            enemies.set(bp.id, {
              id: bp.id,
              name: bp.name,
              hitPoints: { current: bp.hpCurrent, max: bp.hpMax },
              armorClass: bp.armorClass,
              initiative: bp.initiative,
              initiativeRoll: bp.initiativeRoll,
              isDefeated: bp.hpCurrent <= 0,
              createdBy: 'system'
            })
          } else if (bp.userId) {
            selectedPlayerIds.add(bp.userId)
          }
        }

        participants.sort((a, b) => b.initiativeRoll - a.initiativeRoll)

        room.battleState = {
          isActive: bs.isActive,
          round: bs.round,
          currentTurnIndex: 0, // Defaulting to 0 as it's missing in DB
          participants,
          initiativeOrder: [...participants], // Initialize with sorted participants
          enemies,
          initiativeRolled: participants.length > 0,
          phase: bs.phase as any,
          selectedPlayerIds
        }
      }

      // Load Music State
      if (dbRoom.musicState) {
        const ms = dbRoom.musicState as any
        const playlist: MusicTrack[] = dbRoom.music_tracks.map((t: any) => ({
          id: t.id,
          name: t.title, // Map title to name/title
          title: t.title,
          artist: t.artist || undefined,
          url: t.url,
          duration: t.duration || undefined,
          addedBy: t.addedBy,
          addedAt: t.addedAt,
          thumbnail: t.thumbnail || undefined,
          isSoundEffect: t.isSoundEffect,
          isPlayableWhileMusic: false // Not in DB currently
        }))

        room.musicState = {
          isPlaying: ms.isPlaying || false,
          volume: ms.volume || 50,
          position: ms.position || 0,
          playlist,
          fadeTransition: ms.fadeTransition || false,
          lastUpdated: new Date(),
          currentTrack: playlist.find(t => t.id === ms.currentTrackId),
          soundEffects: {
            soundEffectsVolume: ms.soundEffectsVolume || 75,
            playableTrackIds: new Set(),
            lastSoundEffectPlayed: undefined
          }
        }
      }

      this.rooms.set(roomCode, room)
      console.log(`🎲 Loaded room from DB: ${roomCode}`)
      return room
    } catch (error) {
      console.error(`🎲 Failed to load room ${roomCode} from DB:`, error)
      return null
    }
  }

  // Room management
  async createRoom(roomCode: string, roomName: string, creatorUserId: string): Promise<DiceRoom> {
    if (this.rooms.has(roomCode)) {
      throw new Error(`Room with code ${roomCode} already exists`)
    }

    // Check DB with fallback
    let existing = null
    try {
      if (!prisma.diceRoom) {
        console.error('❌ Critical Error: prisma.diceRoom is undefined. Available models:',
          Object.keys(prisma).filter(k => typeof (prisma as any)[k] === 'object' && (prisma as any)[k] !== null))
        throw new Error('Database model DiceRoom is missing. Please restart the server.')
      }
      existing = await prisma.diceRoom.findUnique({ where: { code: roomCode } })
    } catch (dbError) {
      console.error('❌ Database error in createRoom:', dbError)
      // In production, if DB is unavailable, we can still create in-memory room as fallback
      console.warn('⚠️ Creating room in-memory only due to DB unavailability')
    }

    if (existing) {
      throw new Error(`Room with code ${roomCode} already exists`)
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const room: DiceRoom = {
      id: roomId,
      code: roomCode,
      name: roomName,
      createdAt: new Date(),
      createdBy: creatorUserId,
      users: new Map(),
      rollHistory: [],
      sseConnections: new Map()
    }

    // Persist to DB (optional in fallback mode)
    try {
      if (prisma.diceRoom) {
        await prisma.diceRoom.create({
          data: {
            id: roomId,
            code: roomCode,
            name: roomName,
            createdBy: creatorUserId,
            updatedAt: new Date()
          }
        })
      }
    } catch (e) {
      console.error('Failed to create room in DB, continuing with in-memory only:', e)
      // Don't throw error - allow room to exist in memory
    }

    this.rooms.set(roomCode, room)
    console.log(`🎲 Created new room: ${roomCode} (${roomName}) by ${creatorUserId}`)
    return room
  }

  getRoom(roomCode: string): DiceRoom | null {
    return this.rooms.get(roomCode) || null
  }

  private getOrCreateDefaultRoom(): DiceRoom {
    const defaultRoomCode = 'default'
    let room = this.rooms.get(defaultRoomCode)
    if (!room) {
      room = {
        id: 'default_room',
        code: defaultRoomCode,
        name: 'Default Room',
        createdAt: new Date(),
        createdBy: 'system',
        users: new Map(),
        rollHistory: [],
        sseConnections: new Map()
      }
      this.rooms.set(defaultRoomCode, room)
    }
    return room
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



  // User management
  async addUser(userId: string, name: string, roomCode: string = 'default', role: UserRole = 'Player'): Promise<DiceUser> {
    const room = await this.ensureRoomLoaded(roomCode)
    if (!room) {
      throw new Error(`Room ${roomCode} does not exist`)
    }

    let user = room.users.get(userId)

    if (user) {
      // User already exists, update info but preserve state
      user.name = name
      user.lastSeen = new Date()

      // Update role if changed
      if (role && role !== user.role) {
        user.role = role
        // If switching to Player, ensure stats exist
        if (role === 'Player' && !user.stats) {
          user.stats = this.createDefaultStats()
        } else if (role === 'DM') {
          // If switching to DM, remove stats
          user.stats = undefined
        }
      }

      room.users.set(userId, user)
      console.log(`🎲 User reconnected to room ${roomCode}: ${user.name} (${userId}) as ${role}`)
    } else {
      // New user
      user = {
        id: userId,
        name: name || `User${Date.now()}`,
        role,
        joinedAt: new Date(),
        lastSeen: new Date(),
        roomCode,
        stats: role === 'Player' ? this.createDefaultStats() : undefined
      }

      room.users.set(userId, user)
      console.log(`🎲 User joined room ${roomCode}: ${user.name} (${userId}) as ${role}`)
    }

    // Auto-initialize music system when first DM joins
    if (role === 'DM') {
      console.log(`🎵 === DM JOINED ROOM ${roomCode} - MUSIC AUTO-SETUP STARTING ===`)
      console.log(`🎵 DM user: ${user.name} (${userId})`)
      console.log(`🎵 Room musicState exists: ${!!room.musicState}`)
      console.log(`🎵 Room musicState playlist length: ${room.musicState?.playlist?.length || 0}`)

      // Initialize if no music state OR if music state exists but has empty playlist
      const needsSetup = !room.musicState || !room.musicState.playlist || room.musicState.playlist.length === 0

      if (needsSetup) {
        try {
          console.log(`🎵 Auto-initializing music system for room ${roomCode} - DM joined`)

          if (!room.musicState) {
            this.initializeMusicState(roomCode, userId)
            console.log(`🎵 Music state initialized for room ${roomCode}`)
          }

          // Auto-setup default tracks for convenience (now with await for proper timing)
          const defaultTracks = [
            { url: 'https://www.youtube.com/watch?v=ddMSMwKQkKI', title: 'D&D Lobby Music', type: 'lobby' },
            { url: 'https://www.youtube.com/watch?v=fv_7EurNAss', title: 'D&D Tense Music', type: 'tense' },
            { url: 'https://www.youtube.com/watch?v=t3B802PIuB0', title: 'D&D Battle Music', type: 'battle' }
          ]

          console.log(`🎵 Setting up ${defaultTracks.length} default tracks...`)
          // Make this synchronous so tracks are ready when user count is broadcast
          await this.setupDefaultTracks(roomCode, userId, defaultTracks)
          console.log(`🎵 ✅ Auto-setup complete: ${defaultTracks.length} default tracks added to room ${roomCode}`)
          console.log(`🎵 Final playlist length: ${room.musicState!.playlist.length}`)

        } catch (musicError) {
          console.error('❌ Failed to auto-initialize music system:', musicError)
          // Don't fail user addition if music setup fails
        }
      } else {
        console.log(`🎵 ✅ Music system already setup for room ${roomCode} (${room.musicState!.playlist.length} tracks)`)
      }
      console.log(`🎵 === DM AUTO-SETUP COMPLETE for room ${roomCode} ===`)
    }

    // Persist to DB
    try {
      if (!userId.startsWith('user_')) {
        await prisma.roomParticipant.upsert({
          where: {
            roomId_userId: {
              roomId: room.id,
              userId: userId
            }
          },
          update: {
            lastSeen: new Date(),
            role: role
          },
          create: {
            roomId: room.id,
            userId: userId,
            role: role,
            lastSeen: new Date(),
            joinedAt: new Date()
          }
        })
      }
    } catch (e) {
      console.error('Failed to persist user to DB', e)
    }

    this.broadcastUserCount(roomCode)

    // Extra debug: Force check lobby music trigger after user addition
    setTimeout(async () => {
      console.log(`🎵 DEBUG: Post-user-addition check for lobby music in room ${roomCode}`)
      const currentUserCount = this.getUserCount(roomCode)
      console.log(`🎵 DEBUG: Current user count: ${currentUserCount}`)
      if (currentUserCount >= 2) {
        console.log(`🎵 DEBUG: Manually triggering lobby music check`)
        try {
          await this.triggerLobbyMusic(roomCode)
        } catch (error) {
          console.error('🎵 DEBUG: Failed to trigger lobby music:', error)
        }
      }
    }, 1000)

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

  async updateUser(userId: string, name: string, roomCode: string = 'default', role?: UserRole): Promise<DiceUser | null> {
    const room = await this.ensureRoomLoaded(roomCode)
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

      // Persist
      try {
        if (!userId.startsWith('user_')) {
          await prisma.roomParticipant.update({
            where: { roomId_userId: { roomId: room.id, userId } },
            data: { role, lastSeen: new Date() }
          })
        }
      } catch (e) {
        console.error('Failed to persist user update', e)
      }

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

    // Persist to DB (fire-and-forget)
    prisma.diceRoll.create({
      data: {
        roomId: room.id,
        userId: roll.userId,
        total: completeRoll.total,
        description: completeRoll.description,
        data: {
          details: completeRoll.details,
          diceRolled: completeRoll.diceRolled,
          diceResults: completeRoll.diceResults,
          modifier: completeRoll.modifier,
          rollType: completeRoll.rollType,
          isCritical: completeRoll.isCritical,
          criticalType: completeRoll.criticalType
        },
        timestamp: completeRoll.timestamp
      }
    }).catch(e => console.error('Failed to save roll to DB', e))

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

  syncRollHistory(roomCode: string = 'default'): void {
    const room = this.getRoom(roomCode)
    if (room) {
      this.broadcastEvent('dice:history:sync', {
        rollHistory: room.rollHistory
      }, roomCode)
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

    // Send music state if it exists
    if (room.musicState) {
      this.sendToConnection(connectionId, 'music:state_changed', {
        isPlaying: room.musicState.isPlaying,
        currentTrack: room.musicState.currentTrack,
        volume: room.musicState.volume,
        playlist: room.musicState.playlist
      }, roomCode)
    }

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
    const userCount = this.getUserCount(roomCode)
    console.log(`🎵 broadcastUserCount: Room ${roomCode} has ${userCount} users`)
    this.broadcastEvent('users:count', { count: userCount }, roomCode)

    // Trigger lobby music when enough players have joined
    // (2+ total users, indicating party formation)
    if (userCount >= 2) {
      console.log(`🎵 broadcastUserCount: Triggering lobby music for ${userCount} users in room ${roomCode}`)

      // Add a small delay to ensure all setup is complete, then trigger
      setTimeout(async () => {
        try {
          await this.triggerLobbyMusic(roomCode)
          console.log(`🎵 broadcastUserCount: Lobby music trigger completed for room ${roomCode}`)
        } catch (musicError) {
          console.warn('Failed to trigger lobby music:', musicError)
        }
      }, 100) // Small delay to ensure setup completion

    } else {
      console.log(`🎵 broadcastUserCount: Not enough users (${userCount}) for lobby music in room ${roomCode}`)
    }
  }

  private broadcastStatsUpdate(userId: string, stats: PlayerStats, roomCode: string): void {
    this.broadcastEvent('stats:updated', { userId, stats }, roomCode)
  }

  // Public method to broadcast custom events (used by API endpoints)
  sendEvent(event: string, data: any, roomCode: string): void {
    this.broadcastEvent(event, data, roomCode)
  }

  // Battle mode management
  startBattleMode(dmUserId: string, roomCode: string): BattleState {
    const room = this.getRoom(roomCode)
    if (!room) {
      throw new Error('Room not found')
    }

    // Check if user is DM
    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can start battle mode')
    }

    // Initialize battle state
    const battleState: BattleState = {
      isActive: false,
      round: 0,
      currentTurnIndex: 0,
      participants: [],
      initiativeOrder: [], // Initialize empty
      enemies: new Map(),
      initiativeRolled: false,
      phase: 'setup',
      selectedPlayerIds: new Set()
    }

    room.battleState = battleState

    // Persist to DB (fire-and-forget)
    const battleId = `battle_${Date.now()}`
    prisma.battle_sessions.upsert({
      where: { roomId: room.id },
      update: { isActive: false, round: 0, phase: 'setup' },
      create: {
        id: battleId,
        roomId: room.id,
        isActive: false,
        round: 0,
        phase: 'setup'
      }
    }).then(async (session) => {
      // Clear old participants if any (new battle started)
      await prisma.battle_participants.deleteMany({ where: { battleId: session.id } })
    }).catch(e => console.error('Failed to persist battle start', e))

    // Broadcast battle setup started so all players know battle mode is being configured
    this.broadcastEvent('battle:setup_started', { battleState }, roomCode)

    console.log(`⚔️ Battle mode started in room ${roomCode} by ${dmUserId} (setup phase)`)
    return battleState
  }

  addEnemy(dmUserId: string, enemyData: Omit<Enemy, 'id' | 'createdBy'>, roomCode: string): Enemy {
    const room = this.getRoom(roomCode)
    if (!room || !room.battleState) {
      throw new Error('Battle mode not active')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can add enemies')
    }

    const enemy: Enemy = {
      ...enemyData,
      id: `enemy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdBy: dmUserId,
      isDefeated: false
    }

    room.battleState.enemies.set(enemy.id, enemy)

    // Always broadcast enemy additions, regardless of phase
    // Players should see enemies being added during setup too
    this.broadcastEvent('battle:enemy_added', { enemy }, roomCode)

    console.log(`⚔️ Enemy added: ${enemy.name} in room ${roomCode} (${room.battleState.phase} phase)`)
    return enemy
  }

  removeEnemy(dmUserId: string, enemyId: string, roomCode: string): boolean {
    const room = this.getRoom(roomCode)
    if (!room || !room.battleState) {
      throw new Error('Battle mode not active')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can remove enemies')
    }

    const success = room.battleState.enemies.delete(enemyId)
    if (success) {
      // Always broadcast enemy removals, regardless of phase
      // Players should see enemies being removed during setup too
      this.broadcastEvent('battle:enemy_removed', { enemyId }, roomCode)

      console.log(`⚔️ Enemy removed: ${enemyId} in room ${roomCode} (${room.battleState.phase} phase)`)
    }
    return success
  }

  rollInitiative(dmUserId: string, roomCode: string): BattleParticipant[] {
    const room = this.getRoom(roomCode)
    if (!room || !room.battleState) {
      throw new Error('Battle mode not active')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can roll initiative')
    }

    const participants: BattleParticipant[] = []

    // Add selected players (set initiative to 0 - will be rolled individually)
    for (const [userId, user] of room.users) {
      if (user.role === 'Player' && user.stats && room.battleState.selectedPlayerIds.has(userId)) {
        // Don't auto-roll - let DM roll for each participant individually
        participants.push({
          id: userId,
          name: user.name,
          type: 'player',
          initiative: user.stats.initiative,
          initiativeRoll: 0, // Will be rolled manually by DM
          hitPoints: { ...user.stats.hitPoints },
          armorClass: user.stats.armorClass,
          isDefeated: false,
          userId
        })
      }
    }

    // Add enemies (set initiative to 0 - will be rolled individually)
    for (const [enemyId, enemy] of room.battleState.enemies) {
      // Don't auto-roll - let DM roll for each enemy individually
      participants.push({
        id: enemyId,
        name: enemy.name,
        type: 'enemy',
        initiative: enemy.initiative,
        initiativeRoll: 0, // Will be rolled manually by DM
        hitPoints: { ...enemy.hitPoints },
        armorClass: enemy.armorClass,
        isDefeated: enemy.isDefeated
      })
    }

    room.battleState.participants = participants
    room.battleState.phase = 'rolling_initiative'
    room.battleState.isActive = false // Not active until all initiative is rolled

    // Broadcast that initiative phase started (DM needs to roll for each participant)
    this.broadcastEvent('battle:initiative_phase_started', {
      participants,
      message: 'DM needs to roll initiative for each participant'
    }, roomCode)

    console.log(`⚔️ Initiative phase started in room ${roomCode} - DM needs to roll for each participant`)
    return participants
  }

  // Start combat phase after all initiative is rolled
  startCombatPhase(roomCode: string): void {
    const room = this.getRoom(roomCode)
    if (!room || !room.battleState) {
      throw new Error('Battle mode not active')
    }

    // Verify all participants have rolled initiative
    const allRolled = room.battleState.participants?.every(p => p.initiativeRoll > 0)
    if (!allRolled) {
      throw new Error('Not all participants have rolled initiative yet')
    }

    // Sort participants by initiative (highest first)
    room.battleState.participants.sort((a, b) => b.initiativeRoll - a.initiativeRoll)

    // Start combat phase
    room.battleState.phase = 'combat'
    room.battleState.isActive = true
    room.battleState.round = 1
    room.battleState.currentTurnIndex = 0
    room.battleState.initiativeRolled = true

    // Create initiative order for display
    room.battleState.initiativeOrder = [...room.battleState.participants]

    // Broadcast combat started event
    this.broadcastEvent('battle:combat_started', {
      participants: room.battleState.participants,
      initiativeOrder: room.battleState.initiativeOrder,
      currentTurn: room.battleState.participants[0],
      round: 1
    }, roomCode)

    console.log(`⚔️ Combat started in room ${roomCode} - Initiative order:`,
      room.battleState.participants.map(p => `${p.name}: ${p.initiativeRoll}`))
  }

  // Public method to broadcast events to a room
  sendEventToRoom(eventType: string, data: any, roomCode: string): void {
    this.broadcastEvent(eventType, data, roomCode)
  }

  nextTurn(dmUserId: string, roomCode: string): { currentParticipant: BattleParticipant; round: number } {
    const room = this.getRoom(roomCode)
    if (!room || !room.battleState || !room.battleState.isActive) {
      throw new Error('Battle not active')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can advance turns')
    }

    if (!room.battleState.participants || room.battleState.participants.length === 0) {
      throw new Error('No participants in battle')
    }

    room.battleState.currentTurnIndex++

    // Check if we need to start a new round
    if (room.battleState.currentTurnIndex >= room.battleState.participants.length) {
      room.battleState.currentTurnIndex = 0
      room.battleState.round++
    }

    const currentParticipant = room.battleState.participants[room.battleState.currentTurnIndex]

    if (!currentParticipant) {
      throw new Error(`No participant found at index ${room.battleState.currentTurnIndex}`)
    }

    this.broadcastEvent('battle:turn_changed', {
      currentParticipant,
      round: room.battleState.round,
      currentTurnIndex: room.battleState.currentTurnIndex
    }, roomCode)

    return { currentParticipant, round: room.battleState.round }
  }

  dealDamage(dmUserId: string, targetId: string, damage: number, roomCode: string): BattleParticipant | null {
    const room = this.getRoom(roomCode)
    if (!room || !room.battleState) {
      throw new Error('Battle mode not active')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can deal damage')
    }

    const participant = room.battleState.participants.find(p => p.id === targetId)
    if (!participant) {
      throw new Error('Participant not found')
    }

    participant.hitPoints.current = Math.max(0, participant.hitPoints.current - damage)
    participant.isDefeated = participant.hitPoints.current === 0

    // Update the actual user/enemy data as well
    if (participant.type === 'player' && participant.userId) {
      const user = room.users.get(participant.userId)
      if (user?.stats) {
        user.stats.hitPoints.current = participant.hitPoints.current
      }
    } else if (participant.type === 'enemy') {
      const enemy = room.battleState.enemies.get(participant.id)
      if (enemy) {
        enemy.hitPoints.current = participant.hitPoints.current
        enemy.isDefeated = participant.isDefeated
      }
    }

    this.broadcastEvent('battle:damage_dealt', {
      targetId,
      damage,
      newHp: participant.hitPoints.current,
      isDefeated: participant.isDefeated
    }, roomCode)

    console.log(`⚔️ ${damage} damage dealt to ${participant.name} in room ${roomCode}`)
    return participant
  }

  endBattle(dmUserId: string, roomCode: string): boolean {
    console.log(`⚔️ Attempting to end battle in room ${roomCode} by user ${dmUserId}`)

    const room = this.getRoom(roomCode)
    if (!room) {
      console.log(`⚔️ Room ${roomCode} not found`)
      return false
    }

    if (!room.battleState) {
      console.log(`⚔️ No battle state in room ${roomCode}`)
      return false
    }

    if (!this.isDM(dmUserId, roomCode)) {
      console.log(`⚔️ User ${dmUserId} is not a DM in room ${roomCode}`)
      return false
    }

    console.log(`⚔️ Ending battle - current phase: ${room.battleState.phase}, isActive: ${room.battleState.isActive}`)

    room.battleState.isActive = false
    room.battleState.phase = 'ended'

    this.broadcastEvent('battle:ended', {}, roomCode)
    console.log(`⚔️ Battle ended in room ${roomCode}`)
    return true
  }

  getBattleState(roomCode: string): BattleState | null {
    const room = this.getRoom(roomCode)
    return room?.battleState || null
  }

  // Player selection for battle
  selectPlayerForBattle(dmUserId: string, playerId: string, roomCode: string): boolean {
    const room = this.getRoom(roomCode)
    if (!room || !room.battleState) {
      throw new Error('Battle mode not active')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can select players for battle')
    }

    const user = room.users.get(playerId)
    if (!user || user.role !== 'Player') {
      throw new Error('Player not found')
    }

    room.battleState.selectedPlayerIds.add(playerId)
    this.broadcastEvent('battle:player_selected', { playerId, playerName: user.name }, roomCode)
    console.log(`⚔️ Player ${user.name} selected for battle in room ${roomCode}`)
    return true
  }

  deselectPlayerForBattle(dmUserId: string, playerId: string, roomCode: string): boolean {
    const room = this.getRoom(roomCode)
    if (!room || !room.battleState) {
      throw new Error('Battle mode not active')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can deselect players for battle')
    }

    const user = room.users.get(playerId)
    if (!user) {
      throw new Error('Player not found')
    }

    const wasSelected = room.battleState.selectedPlayerIds.delete(playerId)
    if (wasSelected) {
      this.broadcastEvent('battle:player_deselected', { playerId, playerName: user.name }, roomCode)
      console.log(`⚔️ Player ${user.name} deselected for battle in room ${roomCode}`)
    }
    return wasSelected
  }

  getSelectedPlayers(roomCode: string): Array<{ userId: string; name: string }> {
    const room = this.getRoom(roomCode)
    if (!room || !room.battleState) {
      return []
    }

    const selectedPlayers: Array<{ userId: string; name: string }> = []
    for (const playerId of room.battleState.selectedPlayerIds) {
      const user = room.users.get(playerId)
      if (user && user.role === 'Player') {
        selectedPlayers.push({ userId: playerId, name: user.name })
      }
    }
    return selectedPlayers
  }

  getUnselectedPlayers(roomCode: string): Array<{ userId: string; name: string }> {
    const room = this.getRoom(roomCode)
    if (!room || !room.battleState) {
      return []
    }

    const unselectedPlayers: Array<{ userId: string; name: string }> = []
    for (const [userId, user] of room.users) {
      if (user.role === 'Player' && !room.battleState.selectedPlayerIds.has(userId)) {
        unselectedPlayers.push({ userId, name: user.name })
      }
    }
    return unselectedPlayers
  }

  // Add player to ongoing battle
  addPlayerToBattle(dmUserId: string, playerId: string, roomCode: string): BattleParticipant | null {
    const room = this.getRoom(roomCode)
    if (!room || !room.battleState || !room.battleState.isActive) {
      throw new Error('Battle not active')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can add players to battle')
    }

    const user = room.users.get(playerId)
    if (!user || user.role !== 'Player' || !user.stats) {
      throw new Error('Player not found or not a valid player')
    }

    // Check if player is already in battle
    const existingParticipant = room.battleState.participants.find(p => p.id === playerId)
    if (existingParticipant) {
      throw new Error('Player is already in battle')
    }

    // Select the player for battle if not already selected
    room.battleState.selectedPlayerIds.add(playerId)

    // Roll initiative for the new player
    const initiativeRoll = this.rollD20() + this.getModifier(user.stats.abilities.dexterity)
    const newParticipant: BattleParticipant = {
      id: playerId,
      name: user.name,
      type: 'player',
      initiative: user.stats.initiative,
      initiativeRoll,
      hitPoints: { ...user.stats.hitPoints },
      armorClass: user.stats.armorClass,
      isDefeated: false,
      userId: playerId
    }

    // Insert the new participant in the correct initiative order
    let insertIndex = room.battleState.participants.length
    for (let i = 0; i < room.battleState.participants.length; i++) {
      if (newParticipant.initiativeRoll > room.battleState.participants[i].initiativeRoll) {
        insertIndex = i
        break
      }
    }

    room.battleState.participants.splice(insertIndex, 0, newParticipant)

    // Adjust current turn index if necessary
    if (insertIndex <= room.battleState.currentTurnIndex) {
      room.battleState.currentTurnIndex++
    }

    this.broadcastEvent('battle:player_added', {
      participant: newParticipant,
      insertIndex,
      currentTurnIndex: room.battleState.currentTurnIndex
    }, roomCode)

    console.log(`⚔️ Player ${user.name} added to ongoing battle in room ${roomCode}`)
    return newParticipant
  }

  private rollD20(): number {
    return Math.floor(Math.random() * 20) + 1
  }

  private getModifier(abilityScore: number): number {
    return Math.floor((abilityScore - 10) / 2)
  }

  // Cleanup inactive connections and users
  cleanup(): void {
    const now = new Date()
    // Increased timeout to 3 hours for more persistent sessions
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)

    for (const [roomCode, room] of this.rooms) {
      const deadConnections: string[] = []

      // Remove connections that have errors
      for (const [connectionId, connection] of room.sseConnections) {
        try {
          // Send ping to test connection
          connection.response.write(`event: ping\ndata: ${now.toISOString()}\n\n`)
        } catch (error) {
          deadConnections.push(connectionId)
        }
      }

      deadConnections.forEach(id => this.removeSSEConnection(id, roomCode))

      // Remove users who haven't been seen in 3 hours (increased from 1 hour)
      // AND who don't have an active connection
      const removedUsers: string[] = []

      for (const [userId, user] of room.users) {
        const hasActiveConnection = Array.from(room.sseConnections.values()).some(conn => conn.userId === userId)

        if (!hasActiveConnection && user.lastSeen < threeHoursAgo) {
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

  // Invite system methods
  getAllConnectedUsers(): Array<{ id: string; name: string; role: UserRole; roomCode: string; status: 'online' | 'idle' }> {
    const connectedUsers = new Map<string, { id: string; name: string; role: UserRole; roomCode: string; status: 'online' | 'idle' }>()
    const now = Date.now()
    const IDLE_THRESHOLD = 15 * 60 * 1000 // 15 minutes

    for (const [roomCode, room] of this.rooms) {
      for (const [connectionId, connection] of room.sseConnections) {
        const user = room.users.get(connection.userId)
        if (user && !connectedUsers.has(user.id)) {
          const isIdle = (now - user.lastSeen.getTime()) > IDLE_THRESHOLD
          connectedUsers.set(user.id, {
            id: user.id,
            name: user.name,
            role: user.role,
            roomCode: room.code,
            status: isIdle ? 'idle' : 'online'
          })
        }
      }
    }

    return Array.from(connectedUsers.values())
  }

  sendInvite(senderId: string, senderName: string, targetUserId: string, targetRoomCode: string): boolean {
    // Find target user's connection in any room
    let targetConnection: { response: any; userId: string; roomCode: string } | null = null

    // Search all rooms for the user
    for (const room of this.rooms.values()) {
      for (const conn of room.sseConnections.values()) {
        if (conn.userId === targetUserId) {
          targetConnection = conn
          break
        }
      }
      if (targetConnection) break
    }

    if (!targetConnection) {
      return false
    }

    try {
      const inviteData = {
        senderId,
        senderName,
        targetRoomCode,
        timestamp: new Date()
      }

      const sseData = `event: room:invite\ndata: ${JSON.stringify(inviteData)}\n\n`
      targetConnection.response.write(sseData)
      console.log(`📨 Invite sent from ${senderName} to user ${targetUserId} for room ${targetRoomCode}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to send invite to ${targetUserId}:`, error)
      return false
    }
  }

  // Music system methods
  initializeMusicState(roomCode: string, dmUserId: string): MusicState {
    const room = this.getRoom(roomCode)
    if (!room) {
      throw new Error('Room not found')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can initialize music system')
    }

    const musicState: MusicState = {
      isPlaying: false,
      volume: 50,
      position: 0,
      playlist: [],
      fadeTransition: false,
      lastUpdated: new Date(),
      soundEffects: {
        soundEffectsVolume: 75, // Default sound effects volume
        playableTrackIds: new Set<string>(),
        lastSoundEffectPlayed: undefined
      }
    }

    room.musicState = musicState
    this.broadcastEvent('music:state_updated', musicState, roomCode)

    console.log(`🎵 Music system initialized in room ${roomCode}`)
    return musicState
  }

  addTrackToPlaylist(roomCode: string, dmUserId: string, trackData: {
    name: string;
    title?: string;
    artist?: string;
    url: string;
    duration?: number;
    thumbnail?: string;
    publishedAt?: string;
    description?: string;
    tags?: string[];
    isSoundEffect?: boolean;
    isPlayableWhileMusic?: boolean;
  }): MusicTrack {
    const room = this.getRoom(roomCode)
    if (!room) {
      throw new Error('Room not found')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can add tracks')
    }

    // Initialize music state if it doesn't exist
    if (!room.musicState) {
      this.initializeMusicState(roomCode, dmUserId)
    }

    const track: MusicTrack = {
      id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: trackData.name,
      title: trackData.title || trackData.name, // Use title if provided, fallback to name
      artist: trackData.artist,
      url: trackData.url,
      duration: trackData.duration,
      addedBy: dmUserId,
      addedAt: new Date(),
      thumbnail: trackData.thumbnail,
      publishedAt: trackData.publishedAt,
      description: trackData.description,
      tags: trackData.tags,
      isSoundEffect: trackData.isSoundEffect || false,
      isPlayableWhileMusic: trackData.isPlayableWhileMusic || false
    }

    room.musicState!.playlist.push(track)
    room.musicState!.lastUpdated = new Date()

    // If track is marked as playable while music, add it to the sound effects set
    if (track.isPlayableWhileMusic) {
      room.musicState!.soundEffects.playableTrackIds.add(track.id)
    }

    this.broadcastEvent('music:track_added', { track, playlist: room.musicState!.playlist }, roomCode)

    console.log(`🎵 Track "${track.name}" added to playlist in room ${roomCode}`)
    return track
  }

  removeTrackFromPlaylist(roomCode: string, dmUserId: string, trackId: string): boolean {
    const room = this.getRoom(roomCode)
    if (!room || !room.musicState) {
      throw new Error('Room or music state not found')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can remove tracks')
    }

    const trackIndex = room.musicState.playlist.findIndex(t => t.id === trackId)
    if (trackIndex === -1) {
      return false
    }

    const removedTrack = room.musicState.playlist.splice(trackIndex, 1)[0]
    room.musicState.lastUpdated = new Date()

    // Remove from sound effects set if it was marked as playable while music
    room.musicState.soundEffects.playableTrackIds.delete(trackId)

    // If the removed track was currently playing, stop playback
    if (room.musicState.currentTrack?.id === trackId) {
      room.musicState.currentTrack = undefined
      room.musicState.isPlaying = false
      room.musicState.position = 0
    }

    this.broadcastEvent('music:track_removed', {
      trackId,
      playlist: room.musicState.playlist,
      currentTrack: room.musicState.currentTrack,
      isPlaying: room.musicState.isPlaying
    }, roomCode)

    console.log(`🎵 Track "${removedTrack.name}" removed from playlist in room ${roomCode}`)
    return true
  }

  playTrack(roomCode: string, dmUserId: string, trackId: string): void {
    const room = this.getRoom(roomCode)
    if (!room || !room.musicState) {
      throw new Error('Room or music state not found')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can control music playback')
    }

    const track = room.musicState.playlist.find(t => t.id === trackId)
    if (!track) {
      throw new Error('Track not found in playlist')
    }

    // Set fade transition if changing tracks
    const wasPlaying = room.musicState.isPlaying && !!room.musicState.currentTrack
    room.musicState.fadeTransition = wasPlaying
    room.musicState.currentTrack = track
    room.musicState.isPlaying = true
    room.musicState.position = 0
    room.musicState.lastUpdated = new Date()

    this.broadcastEvent('music:playback_changed', {
      currentTrack: track,
      isPlaying: true,
      position: 0,
      fadeTransition: room.musicState.fadeTransition,
      volume: room.musicState.volume
    }, roomCode)

    console.log(`🎵 Now playing "${track.name}" in room ${roomCode}`)
  }

  pauseMusic(roomCode: string, dmUserId: string): void {
    const room = this.getRoom(roomCode)
    if (!room || !room.musicState) {
      throw new Error('Room or music state not found')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can control music playback')
    }

    room.musicState.isPlaying = false
    room.musicState.lastUpdated = new Date()

    this.broadcastEvent('music:playback_changed', {
      currentTrack: room.musicState.currentTrack,
      isPlaying: false,
      position: room.musicState.position,
      fadeTransition: false,
      volume: room.musicState.volume
    }, roomCode)

    console.log(`⏸️ Music paused in room ${roomCode}`)
  }

  resumeMusic(roomCode: string, dmUserId: string): void {
    const room = this.getRoom(roomCode)
    if (!room || !room.musicState) {
      throw new Error('Room or music state not found')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can control music playback')
    }

    if (!room.musicState.currentTrack) {
      throw new Error('No track selected to resume')
    }

    room.musicState.isPlaying = true
    room.musicState.lastUpdated = new Date()

    this.broadcastEvent('music:playback_changed', {
      currentTrack: room.musicState.currentTrack,
      isPlaying: true,
      position: room.musicState.position,
      fadeTransition: false,
      volume: room.musicState.volume
    }, roomCode)

    console.log(`▶️ Music resumed in room ${roomCode}`)
  }

  setVolume(roomCode: string, dmUserId: string, volume: number): void {
    const room = this.getRoom(roomCode)
    if (!room || !room.musicState) {
      throw new Error('Room or music state not found')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can control volume')
    }

    // Clamp volume between 0 and 100
    volume = Math.max(0, Math.min(100, volume))
    room.musicState.volume = volume
    room.musicState.lastUpdated = new Date()

    this.broadcastEvent('music:volume_changed', { volume }, roomCode)

    console.log(`🔊 Volume set to ${volume}% in room ${roomCode}`)
  }

  setSoundEffectsVolume(roomCode: string, dmUserId: string, soundEffectsVolume: number): void {
    const room = this.getRoom(roomCode)
    if (!room || !room.musicState) {
      throw new Error('Room or music state not found')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can control sound effects volume')
    }

    // Clamp volume between 0 and 100
    soundEffectsVolume = Math.max(0, Math.min(100, soundEffectsVolume))
    room.musicState.soundEffects.soundEffectsVolume = soundEffectsVolume
    room.musicState.lastUpdated = new Date()

    this.broadcastEvent('music:sound_effects_volume_changed', { soundEffectsVolume }, roomCode)

    console.log(`🔊 Sound effects volume set to ${soundEffectsVolume}% in room ${roomCode}`)
  }

  playSoundEffect(roomCode: string, dmUserId: string, trackId: string): void {
    const room = this.getRoom(roomCode)
    if (!room || !room.musicState) {
      throw new Error('Room or music state not found')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can control music playback')
    }

    const track = room.musicState.playlist.find(t => t.id === trackId)
    if (!track) {
      throw new Error('Track not found in playlist')
    }

    if (!track.isPlayableWhileMusic && !track.isSoundEffect) {
      throw new Error('Track is not marked as a sound effect')
    }

    // Update sound effects state
    room.musicState.soundEffects.lastSoundEffectPlayed = new Date()
    room.musicState.lastUpdated = new Date()

    this.broadcastEvent('music:sound_effect_played', {
      track,
      volume: room.musicState.soundEffects.soundEffectsVolume,
      timestamp: new Date()
    }, roomCode)

    console.log(`🎵 Sound effect "${track.name}" played in room ${roomCode}`)
  }

  updateMusicPosition(roomCode: string, position: number): void {
    const room = this.getRoom(roomCode)
    if (!room || !room.musicState) {
      return
    }

    room.musicState.position = position
    room.musicState.lastUpdated = new Date()
  }

  /**
   * Setup default music tracks for a room (lobby, tense, battle)
   */
  async setupDefaultTracks(roomCode: string, dmUserId: string, trackDefinitions: Array<{
    url: string;
    title: string;
    type: string;
  }>): Promise<MusicTrack[]> {
    const room = this.getRoom(roomCode)
    if (!room) {
      throw new Error('Room not found')
    }

    if (!this.isDM(dmUserId, roomCode)) {
      throw new Error('Only DMs can setup default tracks')
    }

    // Initialize music state if it doesn't exist
    if (!room.musicState) {
      this.initializeMusicState(roomCode, dmUserId)
    }

    const addedTracks: MusicTrack[] = []

    for (const trackDef of trackDefinitions) {
      // Check if track already exists in playlist
      const existingTrack = room.musicState!.playlist.find(t => t.url === trackDef.url)
      if (existingTrack) {
        addedTracks.push(existingTrack)
        continue
      }

      // Add new track with metadata
      const track: MusicTrack = {
        id: `${trackDef.type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: trackDef.title,
        title: trackDef.title,
        url: trackDef.url,
        addedBy: dmUserId,
        addedAt: new Date(),
        isSoundEffect: false,
        isPlayableWhileMusic: false
      }

      room.musicState!.playlist.push(track)
      addedTracks.push(track)
    }

    room.musicState!.lastUpdated = new Date()

    // Broadcast the updated playlist
    this.broadcastEvent('music:default_tracks_added', {
      tracks: addedTracks,
      playlist: room.musicState!.playlist
    }, roomCode)

    console.log(`🎵 Added ${addedTracks.length} default tracks to room ${roomCode}`)

    return addedTracks
  }

  /**
   * Auto-trigger lobby music when all players have joined
   */
  async triggerLobbyMusic(roomCode: string): Promise<void> {
    console.log(`🎵 triggerLobbyMusic: === STARTING LOBBY MUSIC TRIGGER for room ${roomCode} ===`)

    const room = this.getRoom(roomCode)
    if (!room) {
      console.log(`🎵 triggerLobbyMusic: Room ${roomCode} not found`)
      return
    }

    // Auto-initialize music state if missing and there's a DM
    if (!room.musicState) {
      const dmUser = Array.from(room.users.values()).find(u => u.role === 'DM')
      if (dmUser) {
        console.log(`🎵 triggerLobbyMusic: Auto-initializing music for room ${roomCode}`)
        try {
          this.initializeMusicState(roomCode, dmUser.id)
          const defaultTracks = [
            { url: 'https://www.youtube.com/watch?v=ddMSMwKQkKI', title: 'D&D Lobby Music', type: 'lobby' },
            { url: 'https://www.youtube.com/watch?v=fv_7EurNAss', title: 'D&D Tense Music', type: 'tense' },
            { url: 'https://www.youtube.com/watch?v=t3B802PIuB0', title: 'D&D Battle Music', type: 'battle' }
          ]
          await this.setupDefaultTracks(roomCode, dmUser.id, defaultTracks)
        } catch (error) {
          console.error(`🎵 Failed to auto-initialize music for room ${roomCode}:`, error)
          return
        }
      } else {
        console.log(`🎵 triggerLobbyMusic: No music state and no DM in room ${roomCode}`)
        return
      }
    }

    console.log(`🎵 triggerLobbyMusic: Room ${roomCode} - playlist has ${room.musicState!.playlist.length} tracks`)
    console.log(`🎵 triggerLobbyMusic: Current music state - isPlaying: ${room.musicState!.isPlaying}, currentTrack: ${room.musicState!.currentTrack?.title || 'none'}`)

    // Debug: log all playlist tracks
    console.log(`🎵 triggerLobbyMusic: Playlist tracks:`, room.musicState!.playlist.map(t => ({
      title: t.title,
      name: t.name,
      url: t.url.substring(t.url.lastIndexOf('/') + 1)
    })))

    // Find lobby music track - Enhanced search logic
    let lobbyTrack = room.musicState!.playlist.find(track =>
      track.url.includes('LCfEqudu4pc')
    )

    // Fallback: search by name
    if (!lobbyTrack) {
      lobbyTrack = room.musicState!.playlist.find(track =>
        track.name.toLowerCase().includes('lobby') || track.title.toLowerCase().includes('lobby')
      )
    }

    console.log(`🎵 triggerLobbyMusic: Searching for lobby track with criteria:`)
    console.log(`🎵 triggerLobbyMusic: - Primary: URL contains 'LCfEqudu4pc'`)
    console.log(`🎵 triggerLobbyMusic: - Fallback: name/title contains 'lobby' (case-insensitive)`)
    console.log(`🎵 triggerLobbyMusic: Found lobby track:`, lobbyTrack ? { title: lobbyTrack.title, name: lobbyTrack.name, url: lobbyTrack.url.substring(lobbyTrack.url.lastIndexOf('/') + 1) } : 'NONE')

    if (!lobbyTrack) {
      console.log(`🎵 triggerLobbyMusic: ❌ No lobby track found in room ${roomCode}`)
      return
    }

    if (room.musicState!.isPlaying && room.musicState!.currentTrack) {
      // If lobby music is already playing, don't restart it
      if (room.musicState!.currentTrack.url.includes('LCfEqudu4pc') ||
        room.musicState!.currentTrack.name.toLowerCase().includes('lobby') ||
        room.musicState!.currentTrack.title.toLowerCase().includes('lobby')) {
        console.log(`🎵 triggerLobbyMusic: ✅ Lobby music already playing in room ${roomCode} - skipping`)
        return
      }

      // If other music is playing, we could either:
      // 1. Skip lobby music (current behavior)
      // 2. Override with lobby music (more aggressive)
      // For now, let's still skip but with better logging
      console.log(`🎵 triggerLobbyMusic: ⚠️ Other music (${room.musicState!.currentTrack.title || room.musicState!.currentTrack.name}) already playing in room ${roomCode} - skipping lobby music`)
      return
    }

    console.log(`🎵 triggerLobbyMusic: ✅ Starting lobby music "${lobbyTrack.title}" in room ${roomCode}`)

    // Auto-play lobby music
    room.musicState!.currentTrack = lobbyTrack
    room.musicState!.isPlaying = true
    room.musicState!.position = 0
    room.musicState!.fadeTransition = false
    room.musicState!.lastUpdated = new Date()

    this.broadcastEvent('music:auto_play', {
      track: lobbyTrack,
      type: 'lobby',
      fadeTransition: false,
      volume: room.musicState!.volume
    }, roomCode)

    console.log(`🎵 ✅ Auto-playing lobby music in room ${roomCode} - Event broadcast complete`)
  }

  /**
   * Auto-trigger battle music when combat starts
   */
  async triggerBattleMusic(roomCode: string): Promise<void> {
    console.log(`🎵 triggerBattleMusic: === STARTING BATTLE MUSIC TRIGGER for room ${roomCode} ===`)

    const room = this.getRoom(roomCode)
    if (!room) {
      console.log(`🎵 triggerBattleMusic: Room ${roomCode} not found`)
      return
    }

    // Auto-initialize music state if missing and there's a DM
    if (!room.musicState) {
      const dmUser = Array.from(room.users.values()).find(u => u.role === 'DM')
      if (dmUser) {
        console.log(`🎵 triggerBattleMusic: Auto-initializing music for room ${roomCode}`)
        try {
          this.initializeMusicState(roomCode, dmUser.id)
          const defaultTracks = [
            { url: 'https://www.youtube.com/watch?v=ddMSMwKQkKI', title: 'D&D Lobby Music', type: 'lobby' },
            { url: 'https://www.youtube.com/watch?v=fv_7EurNAss', title: 'D&D Tense Music', type: 'tense' },
            { url: 'https://www.youtube.com/watch?v=t3B802PIuB0', title: 'D&D Battle Music', type: 'battle' }
          ]
          await this.setupDefaultTracks(roomCode, dmUser.id, defaultTracks)
        } catch (error) {
          console.error(`🎵 Failed to auto-initialize music for room ${roomCode}:`, error)
          return
        }
      } else {
        console.log(`🎵 triggerBattleMusic: No music state and no DM in room ${roomCode}`)
        return
      }
    }

    console.log(`🎵 triggerBattleMusic: Room ${roomCode} - playlist has ${room.musicState!.playlist.length} tracks`)

    // Debug: log all playlist tracks
    console.log(`🎵 triggerBattleMusic: Playlist tracks:`, room.musicState!.playlist.map(t => ({
      title: t.title,
      name: t.name,
      url: t.url.substring(t.url.lastIndexOf('/') + 1)
    })))

    // Find battle music track - Enhanced search logic
    let battleTrack = room.musicState!.playlist.find(track =>
      track.url.includes('t3B802PIuB0')
    )

    // Fallback: search by name  
    if (!battleTrack) {
      battleTrack = room.musicState!.playlist.find(track =>
        track.name.toLowerCase().includes('battle') || track.title.toLowerCase().includes('battle')
      )
    }

    console.log(`🎵 triggerBattleMusic: Searching for battle track with criteria:`)
    console.log(`🎵 triggerBattleMusic: - Primary: URL contains 't3B802PIuB0'`)
    console.log(`🎵 triggerBattleMusic: - Fallback: name/title contains 'battle' (case-insensitive)`)
    console.log(`🎵 triggerBattleMusic: Found battle track:`, battleTrack ? { title: battleTrack.title, name: battleTrack.name, url: battleTrack.url.substring(battleTrack.url.lastIndexOf('/') + 1) } : 'NONE')

    if (!battleTrack) {
      console.log(`🎵 triggerBattleMusic: ❌ No battle track found in room ${roomCode}`)
      return
    }

    console.log(`🎵 triggerBattleMusic: ✅ Starting battle music "${battleTrack.title}" in room ${roomCode}`)

    // Set fade transition if music is currently playing
    const wasPlaying = room.musicState!.isPlaying && !!room.musicState!.currentTrack

    room.musicState!.fadeTransition = wasPlaying
    room.musicState!.currentTrack = battleTrack
    room.musicState!.isPlaying = true
    room.musicState!.position = 0
    room.musicState!.lastUpdated = new Date()

    this.broadcastEvent('music:auto_play', {
      track: battleTrack,
      type: 'battle',
      fadeTransition: wasPlaying,
      volume: room.musicState!.volume
    }, roomCode)

    console.log(`🎵 ✅ Auto-playing battle music in room ${roomCode} with fade: ${wasPlaying} - Event broadcast complete`)
  }

  /**
   * Play tense music with fade transition (DM-controlled)
   */
  playTenseMusic(roomCode: string, dmUserId: string): void {
    console.log(`🎵 playTenseMusic: === STARTING TENSE MUSIC TRIGGER for room ${roomCode} ===`)
    console.log(`🎵 playTenseMusic: DM user: ${dmUserId}`)
    
    const room = this.getRoom(roomCode)
    if (!room || !room.musicState) {
      console.log(`🎵 playTenseMusic: Room ${roomCode} not found or no music state`)
      return
    }

    if (!this.isDM(dmUserId, roomCode)) {
      console.log(`🎵 playTenseMusic: User ${dmUserId} is not DM in room ${roomCode}`)
      throw new Error('Only DMs can control tense music')
    }

    console.log(`🎵 playTenseMusic: Room ${roomCode} - playlist has ${room.musicState.playlist.length} tracks`)
    
    // Debug: log all playlist tracks
    console.log(`🎵 playTenseMusic: Playlist tracks:`, room.musicState.playlist.map(t => ({
      title: t.title,
      name: t.name,
      url: t.url.substring(t.url.lastIndexOf('/') + 1)
    })))

    // Find tense music track - Enhanced search logic
    let tenseTrack = room.musicState.playlist.find(track =>
      track.url.includes('fv_7EurNAss')
    )
    
    // Fallback: search by name
    if (!tenseTrack) {
      tenseTrack = room.musicState.playlist.find(track =>
        track.name.toLowerCase().includes('tense') || track.title.toLowerCase().includes('tense')
      )
    }

    console.log(`🎵 playTenseMusic: Searching for tense track with criteria:`)
    console.log(`🎵 playTenseMusic: - Primary: URL contains 'fv_7EurNAss'`)
    console.log(`🎵 playTenseMusic: - Fallback: name/title contains 'tense' (case-insensitive)`)
    console.log(`🎵 playTenseMusic: Found tense track:`, tenseTrack ? { title: tenseTrack.title, name: tenseTrack.name, url: tenseTrack.url.substring(tenseTrack.url.lastIndexOf('/') + 1) } : 'NONE')

    if (tenseTrack) {
      // Always use fade transition for tense music
      const wasPlaying = room.musicState.isPlaying && !!room.musicState.currentTrack
      console.log(`🎵 playTenseMusic: Current music playing: ${wasPlaying}, track: ${room.musicState.currentTrack?.title || 'none'}`)

      room.musicState.fadeTransition = true
      room.musicState.currentTrack = tenseTrack
      room.musicState.isPlaying = true
      room.musicState.position = 0
      room.musicState.lastUpdated = new Date()

      this.broadcastEvent('music:tense_activated', {
        track: tenseTrack,
        type: 'tense',
        fadeTransition: true,
        volume: room.musicState.volume
      }, roomCode)

      console.log(`🎵 ✅ DM activated tense music "${tenseTrack.title}" in room ${roomCode} with fade transition - Event broadcast complete`)
    } else {
      console.log(`🎵 playTenseMusic: ❌ No tense track found in room ${roomCode}`)
    }
  }

  getMusicState(roomCode: string): MusicState | null {
    const room = this.getRoom(roomCode)
    return room?.musicState || null
  }
}

// Singleton instance
export const diceRoomStore = new DiceRoomStore()

// Cleanup interval - run every 1 minute to check for timeouts
setInterval(() => {
  diceRoomStore.cleanup()
}, 1 * 60 * 1000)
