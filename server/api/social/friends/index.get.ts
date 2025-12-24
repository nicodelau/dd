import prisma from '~/server/utils/prisma'
import { diceRoomStore } from '~/server/utils/diceRoomStore'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userId: user.id, status: 'ACCEPTED' },
        { friendId: user.id, status: 'ACCEPTED' }
      ]
    },
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      friend: { select: { id: true, username: true, avatar: true } }
    }
  })

  // Get online status from diceRoomStore
  const onlineUsers = diceRoomStore.getAllConnectedUsers()
  const onlineIds = new Set(onlineUsers.map(u => u.id))

  const friends = friendships.map(f => {
    const friendUser = f.userId === user.id ? f.friend : f.user
    return {
      ...friendUser,
      isOnline: onlineIds.has(friendUser.id)
    }
  })

  return { friends }
})