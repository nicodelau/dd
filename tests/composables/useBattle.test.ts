import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockToast = {
  add: vi.fn()
}

vi.stubGlobal('useToast', () => mockToast)
vi.stubGlobal('useState', () => ({ value: { id: 'dm-user-1', role: 'DM' } }))
vi.stubGlobal('ref', (val: any) => ({ value: val }))
vi.stubGlobal('computed', (fn: any) => ({
  get value() { return fn() }
}))
vi.stubGlobal('toValue', (val: any) => typeof val === 'object' && val !== null && 'value' in val ? val.value : val)
vi.stubGlobal('readonly', (val: any) => val)

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

vi.mock('../../composables/useSocketIO', () => ({
  useSocketIO: () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn()
  })
}))

vi.mock('../../composables/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key
  })
}))

describe('useBattle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should start battle via POST /api/battle/start', async () => {
    mockFetch.mockResolvedValueOnce({
      success: true,
      battleState: {
        isActive: true,
        phase: 'setup',
        round: 1,
        participants: []
      }
    })
    // Mock loadBattlePlayers
    mockFetch.mockResolvedValueOnce({
      success: true,
      data: { selectedPlayers: [], unselectedPlayers: [] }
    })

    const { useBattle } = await import('../../composables/useBattle')
    const battle = useBattle('default')

    await battle.startBattle()

    expect(mockFetch).toHaveBeenCalledWith('/api/battle/start', {
      method: 'POST',
      body: { roomCode: 'default' }
    })
    expect(battle.battleMode.value?.phase).toBe('setup')
  })

  it('should advance turn and navigate back to previous turn', async () => {
    mockFetch.mockResolvedValueOnce({
      success: true,
      currentTurn: { id: 'p1', name: 'Aragorn' }
    })

    const { useBattle } = await import('../../composables/useBattle')
    const battle = useBattle('default')

    await battle.nextTurn()

    expect(mockFetch).toHaveBeenCalledWith('/api/battle/next-turn', {
      method: 'POST',
      body: { roomCode: 'default' }
    })

    mockFetch.mockResolvedValueOnce({
      success: true,
      currentTurn: { id: 'p0', name: 'Legolas' }
    })

    await battle.previousTurn()

    expect(mockFetch).toHaveBeenCalledWith('/api/battle/previous-turn', {
      method: 'POST',
      body: { roomCode: 'default' }
    })
  })

  it('should deal damage and heal participant via /api/battle/damage', async () => {
    mockFetch.mockResolvedValue({ success: true })

    const { useBattle } = await import('../../composables/useBattle')
    const battle = useBattle('default')

    await battle.damageParticipant({
      participant: { id: 'enemy-1' } as any,
      damage: 15
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/battle/damage', {
      method: 'POST',
      body: {
        roomCode: 'default',
        targetId: 'enemy-1',
        damage: 15
      }
    })

    await battle.healParticipant({
      participant: { id: 'player-1' } as any,
      healing: 10
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/battle/damage', {
      method: 'POST',
      body: {
        roomCode: 'default',
        targetId: 'player-1',
        damage: -10
      }
    })
  })
})
