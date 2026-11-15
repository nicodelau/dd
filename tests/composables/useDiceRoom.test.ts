import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockState: Record<string, any> = {
  user: { id: 'user-1', username: 'Gandalf' }
}

vi.stubGlobal('useState', (key: string) => ({
  value: mockState[key]
}))

vi.stubGlobal('ref', (val: any) => ({ value: val }))
vi.stubGlobal('computed', (fn: any) => ({
  get value() { return fn() }
}))
vi.stubGlobal('readonly', (val: any) => val)
vi.stubGlobal('onBeforeUnmount', vi.fn())
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ rollHistory: [], room: { userCount: 1, name: 'Room' } }))

const mockSocketOn = vi.fn()
const mockSocketEmit = vi.fn().mockReturnValue(true)
const mockSocketConnect = vi.fn()
const mockSocketDisconnect = vi.fn()

vi.mock('../../composables/useSocketIO', () => ({
  useSocketIO: () => ({
    connectionState: { value: { status: 'connected' } },
    connect: mockSocketConnect,
    disconnect: mockSocketDisconnect,
    on: mockSocketOn,
    off: vi.fn(),
    emit: mockSocketEmit
  })
}))

vi.mock('../../composables/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key
  })
}))

describe('useDiceRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize and register socket event listeners', async () => {
    const { useDiceRoom } = await import('../../composables/useDiceRoom')
    const room = useDiceRoom()

    expect(room.userName.value).toBe('Gandalf')
    expect(room.userId.value).toBe('user-1')

    await room.connectToRoom('TEST01')

    expect(mockSocketConnect).toHaveBeenCalledWith({
      userId: 'user-1',
      userName: 'Gandalf',
      role: 'Player',
      roomCode: 'TEST01'
    })

    expect(mockSocketOn).toHaveBeenCalledWith('users:count', expect.any(Function))
    expect(mockSocketOn).toHaveBeenCalledWith('dice:history', expect.any(Function))
    expect(mockSocketOn).toHaveBeenCalledWith('dice:roll', expect.any(Function))
    expect(mockSocketOn).toHaveBeenCalledWith('dice:history:cleared', expect.any(Function))
  })

  it('should emit dice:roll over socket instead of http when online', async () => {
    const { useDiceRoom } = await import('../../composables/useDiceRoom')
    const room = useDiceRoom()

    await room.rollDice({
      diceRolled: [{ type: 'd20', count: 1, results: [18] }],
      diceResults: [{ type: 'd20', result: 18 }],
      total: 21,
      modifier: 3,
      description: 'Attack roll'
    })

    expect(mockSocketEmit).toHaveBeenCalledWith('dice:roll', expect.objectContaining({
      userId: 'user-1',
      userName: 'Gandalf',
      total: 21,
      modifier: 3,
      description: 'Attack roll'
    }))
  })
})
