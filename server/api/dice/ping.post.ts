// POST /api/dice/ping - endpoint para verificación de conectividad
// Utilizado por el cliente para verificar la latencia y calidad de conexión

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  const body = await readBody(event)
  const { clientTimestamp, userId, roomCode } = body

  if (!userId || !roomCode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'userId and roomCode are required'
    })
  }

  const serverTimestamp = Date.now()
  const clientTime = parseInt(clientTimestamp)
  const roundTrip = serverTimestamp - clientTime

  // Calculate connection quality
  let quality: 'excellent' | 'good' | 'poor' | 'critical'
  if (roundTrip < 100) quality = 'excellent'
  else if (roundTrip < 300) quality = 'good'
  else if (roundTrip < 1000) quality = 'poor'
  else quality = 'critical'

  return {
    pong: true,
    serverTimestamp,
    clientTimestamp,
    roundTrip,
    quality,
    status: 'connected'
  }
})