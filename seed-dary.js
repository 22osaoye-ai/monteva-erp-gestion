const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  "Taza blanca empacada para regalo",
  "Taza con caja blíster",
  "Puzle 120 piezas",
  "Llavero polipiel",
  "Caja especial regalo",
  "Caja de madera",
  "Cuaderno + boli",
  "Cajita flor eterna",
  "Cojín",
  "Hucha doble",
  "Imanes sueltos",
  "Imanes pack",
  "Llavero + tarjeta",
  "Taza mágica",
  "Caja cumpleaños",
  "Caja revelación/ padrinos",
  "Marcos",
  "Marcos de sombras",
  "Taza diseño estándar"
];

async function main() {
  for (const name of products) {
    // Generar un coste base realista entre 2 y 15 euros/dólares aleatoriamente
    const unitCost = Math.round((Math.random() * 13 + 2) * 100) / 100;
    const margin = 0.35; // 35% de margen predeterminado
    const salePrice = Math.round((unitCost + (unitCost * margin)) * 100) / 100;
    
    await prisma.product.upsert({
      where: { name: name },
      update: {}, // Si ya existe no lo tocamos
      create: {
        name,
        unitCost,
        margin,
        salePrice
      }
    });
  }
  console.log("✅ ¡Catálogo inyectado con éxito!");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
