import { PrismaClient } from '../prisma/generated/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const characters = await prisma.character.findMany({
    include: {
      attacks: true,
      inventory: true
    }
  });
  for (const c of characters) {
    console.log(`Character: ${c.name} (${c.id})`);
    console.log('  Attacks:');
    c.attacks.forEach(a => console.log(`    - ${a.name}: ${a.createdAt} (type: ${a.type})`));
    console.log('  Inventory:');
    c.inventory.forEach(i => console.log(`    - ${i.name}: ${i.createdAt}`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
