// GET /api/dice/users/online - get all connected users
import { diceRoomStore } from '~/server/utils/diceRoomStore'

export default defineEventHandler(async (event) => {
  // Get authenticated user
  const user = await authenticateUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Optional: Only allow DMs/Admins to see all users?
  // For now, let's allow anyone to see online users to facilitate invites, 
  // or restrict it on the frontend.
  // if (user.role !== 'DM' && user.role !== 'ADMIN') { ... }

  try {
    const onlineUsers = diceRoomStore.getAllConnectedUsers()
    
    // Filter out the requesting user
    const otherUsers = onlineUsers.filter(u => u.id !== user.id)

    return {
      success: true,
      users: otherUsers
    }
  } catch (error) {
    console.error('Error fetching online users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch online users'
    })
  }
})