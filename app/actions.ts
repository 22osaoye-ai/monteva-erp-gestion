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
  
  // Fórmula automatizada
  const salePrice = unitCost + (unitCost * margin)
  
  await prisma.product.create({
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
  await prisma.sale.create({
    data: {
      productId,
      quantity,
      orderProfit
    }
  })
  
  await prisma.product.update({
    where: { id: productId },
    data: { stock: product.stock - quantity }
  })
  
  revalidatePath('/')
}

export async function updateProduct(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const name = formData.get('name') as string
  const icon = formData.get('icon') as string
  const unitCost = parseFloat(formData.get('unitCost') as string)
  const marginStr = formData.get('margin') as string
  const margin = parseFloat(marginStr) / 100
  const stock = parseInt((formData.get('stock') as string) || "0")
  
  const salePrice = unitCost + (unitCost * margin)
  
  await prisma.product.update({
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
}
