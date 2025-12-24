import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  const { friendId } = body

  if (!friendId) throw createError({ statusCode: 400 })

  // Check if friendship already exists
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: user.id, friendId },
        { userId: friendId, friendId: user.id }
      ]
    }
  })

  if (existing) {
    if (existing.status === 'PENDING' && existing.friendId === user.id) {
        // Accept if request exists in reverse
        await prisma.friendship.update({
            where: { id: existing.id },
            data: { status: 'ACCEPTED' }
        })
        return { status: 'ACCEPTED' }
    }
    return { status: existing.status }
  }

  await prisma.friendship.create({
    data: {
      userId: user.id,
      friendId,
      status: 'PENDING'
    }
  })

  return { success: true }
})