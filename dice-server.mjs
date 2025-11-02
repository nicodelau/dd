import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

const PORT = 3003
const connectedUsers = new Map()
const rollHistory = []

// Create HTTP server
const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('D&D Dice Room WebSocket Server is running!')
})

// Create Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      // Development URLs
      "http://localhost:3000", 
      "http://localhost:3001", 
      "http://localhost:3002",
      // Production URLs (add your Vercel deployment URL here)
      "https://dd-tau-rosy.vercel.app",
      // Allow additional production domains
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io/',
  serveClient: false
})

io.on('connection', (socket) => {
  console.log('🎲 User connected:', socket.id)

  // Handle user joining
  socket.on('user:join', (userData) => {
    const user = {
      id: socket.id,
      name: userData.name || 'Anonymous',
      socketId: socket.id
    }
    
    connectedUsers.set(socket.id, user)
    
    // Send current state to new user
    socket.emit('dice:history', rollHistory.slice(-50)) // Last 50 rolls
    socket.emit('users:count', connectedUsers.size)
    
    // Broadcast updated user count
    io.emit('users:count', connectedUsers.size)
    
    console.log(`🎲 User ${user.name} joined. Total users: ${connectedUsers.size}`)
  })

  // Handle user name update
  socket.on('user:update', (userData) => {
    const user = connectedUsers.get(socket.id)
    if (user) {
      user.name = userData.name || 'Anonymous'
      connectedUsers.set(socket.id, user)
      console.log(`🎲 User updated name to: ${user.name}`)
    }
  })

  // Handle dice roll
  socket.on('dice:roll', (rollData) => {
    const user = connectedUsers.get(socket.id)
    if (!user) return

    // Add server timestamp and user info
    const completeRoll = {
      ...rollData,
      id: `${Date.now()}-${socket.id}`,
      userId: socket.id,
      userName: user.name,
      timestamp: new Date()
    }

    // Add to history (keep last 100 rolls)
    rollHistory.unshift(completeRoll)
    if (rollHistory.length > 100) {
      rollHistory.pop()
    }

    // Broadcast to all users
    io.emit('dice:roll', completeRoll)
    
    console.log(`🎲 ${user.name} rolled: ${completeRoll.description} = ${completeRoll.total}`)
    
    // Special logging for d36 rolls
    if (completeRoll.diceRolled.some(d => d.type === 'd36')) {
      console.log(`🎲 Special D36 roll detected!`)
    }
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id)
    if (user) {
      console.log(`🎲 User ${user.name} disconnected`)
      connectedUsers.delete(socket.id)
      
      // Broadcast updated user count
      io.emit('users:count', connectedUsers.size)
    }
  })
})

// Start server
httpServer.listen(PORT, () => {
  console.log(`🎲 D&D Dice Room WebSocket Server running on port ${PORT}`)
  console.log(`   WebSocket endpoint: ws://localhost:${PORT}/socket.io/`)
  console.log(`   Test endpoint: http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🎲 Shutting down dice room server...')
  httpServer.close(() => {
    console.log('🎲 Server closed')
    process.exit(0)
  })
})