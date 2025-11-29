import { diceRoomStore } from '~/server/utils/diceRoomStore'

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    const { userId, roomCode, imageUrl, caption } = body

    if (!userId || !roomCode || !imageUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }

    // Verify user is DM
    if (!diceRoomStore.isDM(userId, roomCode)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only DMs can show images'
      })
    }

    diceRoomStore.sendEvent('dm:show_image', { imageUrl, caption }, roomCode)

    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})
