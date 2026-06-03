'use client'

import { useState } from 'react'
import { createProduct, createSale, updateProduct } from './actions'
import { Button } from '@/components/ui/button'
import { Plus, Package, Download, Printer, X, Mountain, LayoutDashboard, Edit2, ArrowUpRight, ArrowDownRight, Settings, LogOut, CheckCircle2 } from 'lucide-react'

const exportToCSV = (sales: any[]) => {
  const headers = ['ID,Fecha,Producto,Costo Unitario,Cantidad,Precio Venta,Ganancia']
  const rows = sales.map(s => 
    `${s.id},${new Date(s.date).toLocaleDateString()},"${s.product.name}",${s.product.unitCost},${s.quantity},${s.product.salePrice},${s.orderProfit}`
  )
  const csv = headers.concat(rows).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'Ventas_ERP.csv'
  a.click()
}

const generateProfessionalReport = async (sales: any[], stats: any) => {
  try {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()
    
    doc.setFontSize(22)
    doc.setTextColor(40, 40, 40)
    doc.text("monteva", 14, 20)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Reporte Financiero - ${new Date().toLocaleDateString()}`, 14, 28)
    
    autoTable(doc, {
      startY: 40,
      head: [['Métrica', 'Valor (€)']],
      body: [
        ['Ingresos Totales', stats.totalRevenue.toFixed(2)],
        ['Ganancia Neta', stats.totalProfit.toFixed(2)],
        ['Ingresos Mes Actual', stats.monthlyRevenue.toFixed(2)],
        ['Ganancia Mes Actual', stats.monthlyProfit.toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] }
    })
    
    const finalY = (doc as any).lastAutoTable.finalY || 100
    doc.setFontSize(12)
    doc.text("Últimas Ventas", 14, finalY + 15)
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Fecha', 'Producto', 'Cant.', 'Precio', 'Ganancia']],
      body: sales.slice(0, 30).map((s: any) => [
        new Date(s.date).toLocaleDateString(),
        s.product.name,
        s.quantity.toString(),
        `${s.product.salePrice.toFixed(2)} €`,
        `${s.orderProfit.toFixed(2)} €`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [80, 80, 80] }
    })
    
    doc.save('Monteva_Reporte.pdf')
  } catch (error) {
    alert("Instala jspdf: npm install jspdf jspdf-autotable")
  }
}

export default function DashboardClient({ initialData }: { initialData: any }) {
  const { products, sales, totalProfit, totalRevenue, monthlyProfit, monthlyRevenue, annualProfit } = initialData

  const [activeModal, setActiveModal] = useState<'sale' | 'product' | 'editProduct' | null>(null)
  const [selectedEditId, setSelectedEditId] = useState<number | string>("")
  const [activeTab, setActiveTab] = useState<'resumen' | 'analiticas'>('resumen')
  
  const [salesPage, setSalesPage] = useState(1)
  const [inventoryPage, setInventoryPage] = useState(1)
  const ITEMS_PER_PAGE = 7

  const productToEdit = products.find((p: any) => p.id.toString() === selectedEditId.toString())

  const totalSalesPages = Math.ceil(sales.length / ITEMS_PER_PAGE) || 1
  const paginatedSales = sales.slice((salesPage - 1) * ITEMS_PER_PAGE, salesPage * ITEMS_PER_PAGE)

  const totalInventoryPages = Math.ceil(products.length / ITEMS_PER_PAGE) || 1
  const paginatedProducts = products.slice((inventoryPage - 1) * ITEMS_PER_PAGE, inventoryPage * ITEMS_PER_PAGE)

  // Datos para gráficos
  const salesByDate: Record<string, number> = {}
  sales.forEach((s: any) => {
    const d = new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    salesByDate[d] = (salesByDate[d] || 0) + (s.product.salePrice * s.quantity)
  })
  const salesTrendData = Object.keys(salesByDate).reverse().map(date => ({
    date,
    ingresos: salesByDate[date]
  })) // Asumiendo que sales viene ordenado desc, reverse lo pone cronológico

  const productPerformance: Record<string, number> = {}
  sales.forEach((s: any) => {
    productPerformance[s.product.name] = (productPerformance[s.product.name] || 0) + s.quantity
  })
  const productPerformanceData = Object.keys(productPerformance).map(name => ({
    name,
    cantidad: productPerformance[name]
  })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5) // Top 5

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      
      {/* NAVEGACIÓN SUPERIOR MINIMALISTA */}
      <nav className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-neutral-900 text-white p-1.5 rounded-md">
              <Mountain size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-neutral-900">monteva</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
              <span className="text-xs font-bold text-neutral-600">A</span>
            </div>
            <div className="text-sm hidden sm:block">
              <p className="font-medium text-neutral-900 leading-none">Admin</p>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="bg-white">
        <div className="p-8 md:p-12 max-w-[1400px] mx-auto space-y-10">
          
          {/* HEADER NAV / TABS */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-100 pb-4 gap-4">
            <div className="flex gap-6">
              <span 
                onClick={() => setActiveTab('resumen')}
                className={`font-medium text-sm pb-4 -mb-[17px] cursor-pointer transition-colors ${activeTab === 'resumen' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                Resumen General
              </span>
              <span 
                onClick={() => setActiveTab('analiticas')}
                className={`font-medium text-sm pb-4 -mb-[17px] cursor-pointer transition-colors ${activeTab === 'analiticas' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                Analíticas Avanzadas
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={() => setActiveModal('sale')} className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs h-8 px-4 font-medium shadow-none">
                Registrar Venta
              </Button>
              <Button onClick={() => setActiveModal('product')} className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs h-8 px-4 font-medium shadow-none">
                Nuevo Producto
              </Button>
              <Button onClick={() => generateProfessionalReport(sales, initialData)} variant="outline" className="rounded-md text-xs h-8 px-3 border-neutral-200 shadow-none font-medium">
                <Printer size={14} className="mr-2" /> PDF
              </Button>
            </div>
          </div>

          {activeTab === 'resumen' && (
            <>
              {/* KPIS (SHAKURO STYLE) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="border-r border-neutral-100 last:border-0 pr-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-medium text-neutral-600">Ingresos (Mes)</span>
                    <ArrowUpRight size={14} className="text-green-500" />
                  </div>
                  <p className="text-4xl font-normal text-neutral-900 tracking-tight">{monthlyRevenue.toFixed(2)} €</p>
                  <div className="w-full bg-neutral-100 h-1 mt-4 rounded-full overflow-hidden">
                    <div className="bg-neutral-900 w-3/4 h-full rounded-full"></div>
                  </div>
                </div>

                <div className="border-r border-neutral-100 last:border-0 pr-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-medium text-neutral-600">Ganancia (Mes)</span>
                    <ArrowUpRight size={14} className="text-green-500" />
                  </div>
                  <p className="text-4xl font-normal text-neutral-900 tracking-tight">{monthlyProfit.toFixed(2)} €</p>
                  <div className="w-full bg-neutral-100 h-1 mt-4 rounded-full overflow-hidden">
                    <div className="bg-neutral-900 w-2/3 h-full rounded-full"></div>
                  </div>
                </div>
                
                <div className="border-r border-neutral-100 last:border-0 pr-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-medium text-neutral-600">Ganancia (Año)</span>
                  </div>
                  <p className="text-4xl font-normal text-neutral-900 tracking-tight">{annualProfit.toFixed(2)} €</p>
                  <div className="w-full bg-neutral-100 h-1 mt-4 rounded-full overflow-hidden flex gap-0.5">
                     {/* Mini bars effect */}
                     {[...Array(20)].map((_, i) => (
                        <div key={i} className={`h-full flex-1 rounded-sm ${i < 12 ? 'bg-neutral-300' : 'bg-neutral-100'}`}></div>
                     ))}
                  </div>
                </div>

                <div className="border-r border-neutral-100 last:border-0 pr-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-medium text-neutral-600">Productos en Catálogo</span>
                  </div>
                  <p className="text-4xl font-normal text-neutral-900 tracking-tight">{products.length}</p>
                  <div className="w-full h-1 mt-4 flex items-center justify-between text-[10px] text-neutral-400">
                    <span>0</span>
                    <span>Max Capacity</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-12 mb-6">
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest">Historial de Ventas</h3>
                <Button onClick={() => exportToCSV(sales)} variant="ghost" className="text-xs h-7 px-2 text-neutral-500 hover:text-neutral-900">Descargar CSV</Button>
              </div>

              {/* TABLA ULTRA LIMPIA */}
              <div className="w-full mb-12">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3 pb-4">Fecha</th>
                      <th className="px-4 py-3 pb-4">Producto</th>
                      <th className="px-4 py-3 pb-4">Cantidad</th>
                      <th className="px-4 py-3 pb-4">Precio</th>
                      <th className="px-4 py-3 pb-4 text-right">Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {paginatedSales.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">Sin datos de ventas.</td>
                      </tr>
                    ) : (
                      paginatedSales.map((sale: any) => (
                        <tr key={sale.id} className="group hover:bg-neutral-50/50 transition-colors">
                          <td className="px-4 py-3.5 text-neutral-500 text-[13px]">
                            {new Date(sale.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-4 py-3.5 text-neutral-900 text-[13px]">
                            <div className="flex items-center gap-2">
                              <span className="opacity-50 group-hover:opacity-100 transition-opacity text-base">{sale.product.icon}</span>
                              <span className="font-medium">{sale.product.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-neutral-600 text-[13px]">{sale.quantity}</td>
                          <td className="px-4 py-3.5 text-neutral-600 text-[13px]">{sale.product.salePrice.toFixed(2)} €</td>
                          <td className="px-4 py-3.5 text-right font-medium text-emerald-600 text-[13px]">
                            +{sale.orderProfit.toFixed(2)} €
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                
                {sales.length > 0 && (
                  <div className="flex items-center justify-between py-4 text-xs text-neutral-500">
                    <span>{sales.length} registros</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSalesPage(p => Math.max(1, p - 1))} disabled={salesPage === 1} className="hover:text-neutral-900 disabled:opacity-30 uppercase font-semibold tracking-wider">Anterior</button>
                      <button onClick={() => setSalesPage(p => Math.min(totalSalesPages, p + 1))} disabled={salesPage === totalSalesPages} className="hover:text-neutral-900 disabled:opacity-30 uppercase font-semibold tracking-wider">Siguiente</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-12 mb-6">
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest">Estado de Inventario</h3>
                <Button onClick={() => setActiveModal('editProduct')} variant="ghost" className="text-xs h-7 px-2 text-neutral-500 hover:text-neutral-900"><Edit2 size={12} className="mr-1"/> Editar</Button>
              </div>

              <div className="w-full">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3 pb-4">Producto</th>
                      <th className="px-4 py-3 pb-4">Costo Base</th>
                      <th className="px-4 py-3 pb-4">Margen</th>
                      <th className="px-4 py-3 pb-4">PVP</th>
                      <th className="px-4 py-3 pb-4 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {paginatedProducts.map((p: any) => (
                      <tr key={p.id} className="group hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-3.5 text-neutral-900 text-[13px]">
                          <div className="flex items-center gap-2">
                            <span className="opacity-50 group-hover:opacity-100 transition-opacity text-base">{p.icon}</span>
                            <span className="font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-neutral-600 text-[13px]">{p.unitCost.toFixed(2)} €</td>
                        <td className="px-4 py-3.5 text-neutral-600 text-[13px]">{(p.margin * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3.5 text-neutral-600 text-[13px]">{p.salePrice.toFixed(2)} €</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${p.stock > 10 ? 'bg-[#eefcf3] text-emerald-700' : p.stock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                            {p.stock > 10 ? 'Active' : p.stock > 0 ? 'Low' : 'Empty'} · {p.stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {products.length > 0 && (
                  <div className="flex items-center justify-between py-4 text-xs text-neutral-500">
                    <span>{products.length} productos</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setInventoryPage(p => Math.max(1, p - 1))} disabled={inventoryPage === 1} className="hover:text-neutral-900 disabled:opacity-30 uppercase font-semibold tracking-wider">Anterior</button>
                      <button onClick={() => setInventoryPage(p => Math.min(totalInventoryPages, p + 1))} disabled={inventoryPage === totalInventoryPages} className="hover:text-neutral-900 disabled:opacity-30 uppercase font-semibold tracking-wider">Siguiente</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'analiticas' && (
            <div className="space-y-12 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Gráfico de Productos Más Vendidos (Native HTML) */}
                <div className="col-span-1 lg:col-span-2">
                  <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest mb-6">Top 5 Productos Vendidos</h3>
                  <div className="w-full border border-neutral-100 rounded-xl p-8 space-y-6">
                    {productPerformanceData.length > 0 ? (
                      productPerformanceData.map((prod, idx) => {
                        const max = Math.max(...productPerformanceData.map(p => p.cantidad))
                        const percentage = (prod.cantidad / max) * 100
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold text-neutral-600">
                              <span>{prod.name}</span>
                              <span>{prod.cantidad} uds</span>
                            </div>
                            <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-neutral-900 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-neutral-400">Sin datos suficientes</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="h-10"></div> {/* Bottom Padding */}
        </div>
      </main>

      {/* MODALES SIMPLES */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/20 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-neutral-100">
            <div className="px-6 py-4 flex justify-between items-center border-b border-neutral-100">
              <h2 className="text-[15px] font-semibold text-neutral-900">
                {activeModal === 'product' ? 'Nuevo Producto' : activeModal === 'sale' ? 'Registrar Venta' : 'Editar Producto'}
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-neutral-400 hover:text-neutral-900 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* FORMS */}
            {activeModal === 'product' && (
              <form action={async (fd) => {
                await createProduct(fd)
                setActiveModal(null)
              }} className="p-6 space-y-4">
                <div className="space-y-3">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Nombre e Icono</label>
                  <div className="flex gap-3">
                    <input name="icon" className="w-16 h-9 rounded-md border border-neutral-200 px-2 text-center text-sm focus:border-neutral-900 focus:outline-none" placeholder="Emoji ☕" maxLength={2} title="Añade un emoji para representar el producto" />
                    <input required name="name" className="flex-1 h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" placeholder="Nombre del producto" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Costo</label>
                    <input required name="unitCost" type="number" step="0.01" className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Margen %</label>
                    <input required name="margin" type="number" className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" placeholder="30" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Stock</label>
                    <input required name="stock" type="number" defaultValue="0" className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs h-8 px-6">Guardar</Button>
                </div>
              </form>
            )}

            {activeModal === 'sale' && (
              <form action={async (fd) => {
                await createSale(fd)
                setActiveModal(null)
              }} className="p-6 space-y-4">
                {products.length === 0 ? (
                  <div className="py-4 text-center text-sm text-neutral-500">Debes crear un producto primero.</div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Seleccionar Producto</label>
                      <select required name="productId" className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none bg-white">
                        {products.map((p: any) => (
                          <option key={p.id} value={p.id} disabled={p.stock < 1}>
                            {p.icon ? p.icon + ' ' : ''}{p.name} ({p.salePrice.toFixed(2)} €) - {p.stock} uds
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Cantidad</label>
                      <input required name="quantity" type="number" min="1" defaultValue="1" className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" />
                    </div>
                    <div className="pt-4 flex justify-end">
                      <Button type="submit" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs h-8 px-6">Confirmar</Button>
                    </div>
                  </>
                )}
              </form>
            )}

            {activeModal === 'editProduct' && (
              <form action={async (fd) => {
                await updateProduct(fd)
                setActiveModal(null)
              }} className="p-6 space-y-4">
                {products.length === 0 ? (
                  <div className="py-4 text-center text-sm text-neutral-500">No hay productos.</div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Producto a Editar</label>
                      <select required name="id" value={selectedEditId || ""} onChange={(e) => setSelectedEditId(e.target.value)} className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none bg-white">
                        <option value="" disabled>Selecciona...</option>
                        {products.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.icon ? p.icon + ' ' : ''}{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {productToEdit && (
                      <>
                        <div className="space-y-3">
                          <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Nombre e Icono</label>
                          <div className="flex gap-3">
                            <input name="icon" defaultValue={productToEdit.icon || ""} className="w-16 h-9 rounded-md border border-neutral-200 px-2 text-center text-sm focus:border-neutral-900 focus:outline-none" placeholder="Emoji ☕" maxLength={2} title="Añade un emoji para representar el producto" />
                            <input required name="name" defaultValue={productToEdit.name} className="flex-1 h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <input required name="unitCost" type="number" step="0.01" defaultValue={productToEdit.unitCost} className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" title="Costo" />
                          <input required name="margin" type="number" defaultValue={productToEdit.margin * 100} className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" title="Margen %" />
                          <input required name="stock" type="number" defaultValue={productToEdit.stock} className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" title="Stock" />
                        </div>
                      </>
                    )}
                    
                    <div className="pt-4 flex justify-end">
                      <Button type="submit" disabled={!productToEdit} className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs h-8 px-6">Actualizar</Button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
