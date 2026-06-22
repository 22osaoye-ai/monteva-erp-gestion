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
  try {
    const name = formData.get('name') as string
    if (!name || name.trim() === "") {
      return { success: false, error: "El nombre del producto es obligatorio." }
    }
    const icon = formData.get('icon') as string
    
    const unitCostStr = (formData.get('unitCost') as string || '').replace(',', '.')
    const unitCost = parseFloat(unitCostStr)
    if (isNaN(unitCost) || unitCost < 0) {
      return { success: false, error: "El costo unitario debe ser un número válido mayor o igual a 0." }
    }
    
    const marginStr = (formData.get('margin') as string || '').replace(',', '.')
    const margin = parseFloat(marginStr) / 100
    if (isNaN(margin)) {
      return { success: false, error: "El margen debe ser un número válido." }
    }
    
    const stock = parseInt((formData.get('stock') as string) || "0")
    if (isNaN(stock) || stock < 0) {
      return { success: false, error: "El stock debe ser un número válido mayor o igual a 0." }
    }
    
    // Fórmula automatizada: Margen Comercial (PVP = Costo / (1 - Margen))
    const salePrice = margin >= 1 ? unitCost + (unitCost * margin) : unitCost / (1 - margin)
    
    const created = await prisma.product.create({
      data: {
        name: name.trim(),
        icon: icon || null,
        unitCost,
        margin,
        salePrice,
        stock
      }
    })
    
    revalidatePath('/')
    return { success: true, data: created }
  } catch (err: any) {
    console.error("Error in createProduct Server Action:", err)
    if (err.code === 'P2002') {
      return { success: false, error: "Ya existe un producto con este nombre. Por favor, elige otro." }
    }
    return { success: false, error: err.message || "Error al crear el producto." }
  }
}

export async function createSale(formData: FormData) {
  try {
    const productId = parseInt(formData.get('productId') as string)
    if (isNaN(productId)) {
      return { success: false, error: "Producto no válido." }
    }
    const quantity = parseInt(formData.get('quantity') as string)
    if (isNaN(quantity) || quantity <= 0) {
      return { success: false, error: "La cantidad debe ser mayor que 0." }
    }
    
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return { success: false, error: "Producto no encontrado." }
    }
    
    if (product.stock < quantity) {
      return { success: false, error: "No hay suficiente stock para esta venta." }
    }
    
    const orderProfit = (product.salePrice - product.unitCost) * quantity
    
    const newSale = await prisma.sale.create({
      data: { productId, quantity, orderProfit },
      include: { product: true }
    })
    
    await prisma.product.update({
      where: { id: productId },
      data: { stock: product.stock - quantity }
    })
    
    revalidatePath('/')
    return { success: true, data: newSale }
  } catch (err: any) {
    console.error("Error in createSale Server Action:", err)
    return { success: false, error: err.message || "Error al registrar la venta." }
  }
}

export async function updateProduct(formData: FormData) {
  try {
    const id = parseInt(formData.get('id') as string)
    if (!id || isNaN(id)) {
      return { success: false, error: "El ID del producto no es válido o no se ha seleccionado ningún producto." }
    }
    const name = formData.get('name') as string
    if (!name || name.trim() === "") {
      return { success: false, error: "El nombre del producto es obligatorio." }
    }
    const icon = formData.get('icon') as string
    
    const unitCostStr = (formData.get('unitCost') as string || '').replace(',', '.')
    const unitCost = parseFloat(unitCostStr)
    if (isNaN(unitCost) || unitCost < 0) {
      return { success: false, error: "El costo unitario debe ser un número válido mayor o igual a 0." }
    }
    
    const marginStr = (formData.get('margin') as string || '').replace(',', '.')
    const margin = parseFloat(marginStr) / 100
    if (isNaN(margin)) {
      return { success: false, error: "El margen debe ser un número válido." }
    }
    
    const stock = parseInt((formData.get('stock') as string) || "0")
    if (isNaN(stock) || stock < 0) {
      return { success: false, error: "El stock debe ser un número válido mayor o igual a 0." }
    }
    
    // Fórmula automatizada: Margen Comercial
    const salePrice = margin >= 1 ? unitCost + (unitCost * margin) : unitCost / (1 - margin)
    
    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        icon: icon || null,
        unitCost,
        margin,
        salePrice,
        stock
      }
    })
    
    revalidatePath('/')
    return { success: true, data: updated }
  } catch (err: any) {
    console.error("Error in updateProduct Server Action:", err)
    if (err.code === 'P2002') {
      return { success: false, error: "Ya existe un producto con este nombre. Por favor, elige otro." }
    }
    return { success: false, error: err.message || "Error al actualizar el producto." }
  }
}

export interface ImportProductRow {
  name: string
  icon?: string
  unitCost: number
  margin: number   // porcentaje, ej: 30 → se convierte a 0.3
  stock: number
}

export async function importProducts(rows: ImportProductRow[]) {
  try {
    if (!rows.length) {
      return { success: false, error: "No hay filas para importar." }
    }
    
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
    return { success: true, imported: data.length }
  } catch (err: any) {
    console.error("Error in importProducts Server Action:", err)
    return { success: false, error: err.message || "Error al importar productos." }
  }
}

export async function deleteSale(saleId: number) {
  try {
    await prisma.sale.delete({ where: { id: saleId } })
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error("Error in deleteSale Server Action:", err)
    return { success: false, error: err.message || "Error al eliminar la venta." }
  }
}

export async function clearSalesHistory() {
  try {
    await prisma.sale.deleteMany({})
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error("Error in clearSalesHistory Server Action:", err)
    return { success: false, error: err.message || "Error al vaciar el historial." }
  }
}

export async function deleteProduct(productId: number) {
  try {
    await prisma.sale.deleteMany({ where: { productId } })
    await prisma.product.delete({ where: { id: productId } })
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error("Error in deleteProduct Server Action:", err)
    return { success: false, error: err.message || "Error al eliminar el producto." }
  }
}
