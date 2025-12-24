// Si usas "type": "module" en package.json, cambia los require por import
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  // Asegúrate de que esto apunte a tu URL DIRECTA (sin pooler)
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    },
  },
})

async function main() {
  console.log('🔓 Intentando liberar bloqueos consultivos (Advisory Locks)...')
  try {
    // Este es el comando mágico que mata los bloqueos zombies
    await prisma.$executeRawUnsafe('SELECT pg_advisory_unlock_all();')
    console.log('✅ Éxito: Bloqueos liberados.')
  } catch (e) {
    console.error('❌ Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
