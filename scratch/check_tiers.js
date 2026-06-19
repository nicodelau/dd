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
  const attacks = await prisma.attack.findMany({ select: { tier: true } });
  const items = await prisma.inventoryItem.findMany({ select: { tier: true } });

  const uniqueAttackTiers = new Set(attacks.map(a => a.tier));
  const uniqueItemTiers = new Set(items.map(i => i.tier));

  console.log('Unique Attack Tiers in DB:', Array.from(uniqueAttackTiers));
  console.log('Unique Item Tiers in DB:', Array.from(uniqueItemTiers));
}

main().catch(console.error).finally(() => prisma.$disconnect());
