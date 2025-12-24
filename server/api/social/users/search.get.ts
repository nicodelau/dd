import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const user = await authenticateUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const search = query.query as string
  if (!search || search.length < 3) return { users: [] }

  const users = await prisma.user.findMany({
    where: {
      username: { contains: search, mode: 'insensitive' },
      id: { not: user.id }
    },
    take: 10,
    select: { id: true, username: true, avatar: true }
  })

  // Check friendship status
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userId: user.id, friendId: { in: users.map(u => u.id) } },
        { userId: { in: users.map(u => u.id) }, friendId: user.id }
      ]
    }
  })

  const results = users.map(u => {
    const friendship = friendships.find(f => f.userId === u.id || f.friendId === u.id)
    return {
      ...u,
      isFriend: friendship?.status === 'ACCEPTED',
      hasPendingRequest: friendship?.status === 'PENDING',
      // If I am the one who sent the request, hasPendingRequest is true.
      // If they sent it, we might want to show "Accept" button instead, but for now simple search
    }
  })

  return { users: results }
})