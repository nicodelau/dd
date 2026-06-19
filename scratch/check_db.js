import { PrismaClient } from '../prisma/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.character.count();
  console.log(`Total characters in database: ${count}`);
  const users = await prisma.user.count();
  console.log(`Total users in database: ${users}`);
  
  if (count > 0) {
    const chars = await prisma.character.findMany({ take: 5 });
    console.log('Sample characters:', chars.map(c => ({ id: c.id, name: c.name, class: c.class, level: c.level, inspiration: c.inspiration })));
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
