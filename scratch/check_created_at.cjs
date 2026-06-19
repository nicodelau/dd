const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

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
    c.attacks.forEach(a => console.log(`    - ${a.name}: ${a.createdAt}`));
    console.log('  Inventory:');
    c.inventory.forEach(i => console.log(`    - ${i.name}: ${i.createdAt}`));
  }
  await prisma.$disconnect();
}

main().catch(console.error);
