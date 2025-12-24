import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const pending = await prisma.friendship.findMany({
    where: {
      friendId: user.id,
      status: 'PENDING'
    },
    include: {
      user: { select: { id: true, username: true, avatar: true } }
    }
  })

  // Normalize structure
  return { requests: pending }
})