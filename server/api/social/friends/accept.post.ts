import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  
  await prisma.friendship.update({
    where: { id: body.requestId },
    data: { status: 'ACCEPTED' }
  })

  return { success: true }
})