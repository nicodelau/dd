import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  const { receiverId, content, isInvite, inviteRoomCode } = body

  if (!receiverId || !content) throw createError({ statusCode: 400 })

  const message = await prisma.directMessage.create({
    data: {
      senderId: user.id,
      receiverId,
      content,
      isInvite: !!isInvite,
      inviteRoomCode,
      read: false
    }
  })

  return { success: true, message }
})