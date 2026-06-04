const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  let updated = 0;

  for (const product of products) {
    // Calculamos el nuevo PVP con la fórmula del Margen Comercial
    const margin = product.margin; // e.g. 0.3 for 30%
    const unitCost = product.unitCost;
    
    const newSalePrice = margin >= 1 
      ? unitCost + (unitCost * margin) 
      : unitCost / (1 - margin);
    
    // Solo actualizamos si hay diferencia (redondeando a 2 decimales para comparar)
    if (Math.abs(product.salePrice - newSalePrice) > 0.01) {
      await prisma.product.update({
        where: { id: product.id },
        data: { salePrice: newSalePrice }
      });
      updated++;
    }
  }

  console.log(`Precios actualizados: ${updated} productos corregidos.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
