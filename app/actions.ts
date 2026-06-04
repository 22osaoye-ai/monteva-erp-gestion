'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getDashboardData() {
  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })
  const sales = await prisma.sale.findMany({
    include: { product: true },
    orderBy: { date: 'desc' },
    take: 50
  })

  const totalProfit = sales.reduce((acc, sale) => acc + sale.orderProfit, 0)
  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.product.salePrice * sale.quantity), 0)

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let monthlyProfit = 0
  let monthlyRevenue = 0
  let annualProfit = 0
  let annualRevenue = 0

  sales.forEach(sale => {
    const d = new Date(sale.date)
    const revenue = sale.product.salePrice * sale.quantity
    
    if (d.getFullYear() === currentYear) {
      annualProfit += sale.orderProfit
      annualRevenue += revenue
      
      if (d.getMonth() === currentMonth) {
        monthlyProfit += sale.orderProfit
        monthlyRevenue += revenue
      }
    }
  })

  return { 
    products, 
    sales, 
    totalProfit, 
    totalRevenue,
    monthlyProfit,
    monthlyRevenue,
    annualProfit,
    annualRevenue
  }
}

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string
  const icon = formData.get('icon') as string
  const unitCost = parseFloat(formData.get('unitCost') as string)
  const marginStr = formData.get('margin') as string
  const margin = parseFloat(marginStr) / 100 // convert 30 to 0.3
  const stock = parseInt((formData.get('stock') as string) || "0")
  
  // Fórmula automatizada: Margen Comercial (PVP = Costo / (1 - Margen))
  // Si el margen es mayor o igual a 1 (100% o más), se hace un recargo directo (markup) para evitar errores matemáticos.
  const salePrice = margin >= 1 ? unitCost + (unitCost * margin) : unitCost / (1 - margin)
  
  const created = await prisma.product.create({
    data: {
      name,
      icon: icon || null,
      unitCost,
      margin,
      salePrice,
      stock
    }
  })
  
  revalidatePath('/')
  return created
}

export async function createSale(formData: FormData) {
  const productId = parseInt(formData.get('productId') as string)
  const quantity = parseInt(formData.get('quantity') as string)
  
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new Error("Producto no encontrado")
  
  const orderProfit = (product.salePrice - product.unitCost) * quantity
  
  if (product.stock < quantity) {
    throw new Error("No hay suficiente stock para esta venta")
  }
  
  // Registrar venta y actualizar stock al mismo tiempo usando una transacción si quisieramos, 
  // pero lo hacemos secuencial para simplicidad:
  const newSale = await prisma.sale.create({
    data: { productId, quantity, orderProfit },
    include: { product: true }
  })
  
  await prisma.product.update({
    where: { id: productId },
    data: { stock: product.stock - quantity }
  })
  
  revalidatePath('/')
  return newSale
}

export async function updateProduct(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const name = formData.get('name') as string
  const icon = formData.get('icon') as string
  const unitCost = parseFloat(formData.get('unitCost') as string)
  const marginStr = formData.get('margin') as string
  const margin = parseFloat(marginStr) / 100
  const stock = parseInt((formData.get('stock') as string) || "0")
  
  // Fórmula automatizada: Margen Comercial
  const salePrice = margin >= 1 ? unitCost + (unitCost * margin) : unitCost / (1 - margin)
  
  const updated = await prisma.product.update({
    where: { id },
    data: {
      name,
      icon: icon || null,
      unitCost,
      margin,
      salePrice,
      stock
    }
  })
  
  revalidatePath('/')
  return updated
}

export interface ImportProductRow {
  name: string
  icon?: string
  unitCost: number
  margin: number   // porcentaje, ej: 30 → se convierte a 0.3
  stock: number
}

export async function importProducts(rows: ImportProductRow[]) {
  if (!rows.length) throw new Error('No hay filas para importar')

  const data = rows.map(r => {
    const margin = r.margin / 100
    return {
      name: r.name.trim(),
      icon: r.icon?.trim() || null,
      unitCost: r.unitCost,
      margin,
      salePrice: margin >= 1 ? r.unitCost + (r.unitCost * margin) : r.unitCost / (1 - margin),
      stock: Math.max(0, r.stock),
    }
  })

  await prisma.product.createMany({ data })
  revalidatePath('/')
  return { imported: data.length }
}

export async function deleteSale(saleId: number) {
  await prisma.sale.delete({ where: { id: saleId } })
  revalidatePath('/')
}

export async function clearSalesHistory() {
  await prisma.sale.deleteMany({})
  revalidatePath('/')
}

export async function deleteProduct(productId: number) {
  await prisma.sale.deleteMany({ where: { productId } })
  await prisma.product.delete({ where: { id: productId } })
  revalidatePath('/')
  return { success: true }
}
