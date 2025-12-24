import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const query = getQuery(event)
  const friendId = query.friendId as string

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: friendId },
        { senderId: friendId, receiverId: user.id }
      ]
    },
    orderBy: { createdAt: 'asc' },
    take: 50
  })

  // Mark as read
  await prisma.directMessage.updateMany({
    where: {
      senderId: friendId,
      receiverId: user.id,
      read: false
    },
    data: { read: true }
  })

  return { messages }
})