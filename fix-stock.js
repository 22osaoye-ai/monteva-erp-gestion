const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.product.updateMany({
    where: {
      stock: 0
    },
    data: {
      stock: 50
    }
  });
  console.log(`✅ ¡Se actualizaron ${result.count} productos a 50 unidades de stock!`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
