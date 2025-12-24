import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  // Find users I have chatted with
  // Group by user, get last message
  // Prisma doesn't support complex group-by for this easily, so we fetch messages and aggregate manually or use raw query
  // For simplicity, let's just find distinct users from sent/received messages
  
  // Get all messages involving user
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: user.id },
        { receiverId: user.id }
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, username: true, avatar: true } },
      receiver: { select: { id: true, username: true, avatar: true } }
    }
  })

  const chatsMap = new Map()

  for (const msg of messages) {
    const otherUser = msg.senderId === user.id ? msg.receiver : msg.sender
    if (!chatsMap.has(otherUser.id)) {
      chatsMap.set(otherUser.id, {
        userId: otherUser.id,
        user: otherUser,
        lastMessageContent: msg.content,
        lastMessageAt: msg.createdAt,
        lastMessageIsInvite: msg.isInvite,
        unreadCount: 0
      })
    }
    
    if (msg.receiverId === user.id && !msg.read) {
        chatsMap.get(otherUser.id).unreadCount++
    }
  }

  return { chats: Array.from(chatsMap.values()) }
})