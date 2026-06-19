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
  const count = await prisma.character.count();
  console.log(`Characters count: ${count}`);
  const users = await prisma.user.count();
  console.log(`Users count: ${users}`);
  
  if (count > 0) {
    const chars = await prisma.character.findMany({ take: 5 });
    console.log('Sample characters:', chars.map(c => ({ id: c.id, name: c.name, class: c.class, level: c.level, inspiration: c.inspiration })));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
