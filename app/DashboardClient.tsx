'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { generateProfessionalReport } from '@/utils/exportUtils'

import { TopNav } from '@/components/dashboard/TopNav'
import { SummaryTab } from '@/components/dashboard/SummaryTab'
import { InventoryTab } from '@/components/dashboard/InventoryTab'
import { AnalyticsTab } from '@/components/dashboard/AnalyticsTab'
import { Modals } from '@/components/dashboard/Modals'

export default function DashboardClient({ initialData }: { initialData: any }) {
  const { products, sales, totalProfit, totalRevenue, monthlyProfit, monthlyRevenue, annualProfit } = initialData

  const [activeModal, setActiveModal] = useState<'sale' | 'product' | 'editProduct' | null>(null)
  const [selectedEditId, setSelectedEditId] = useState<number | string>("")
  const [activeTab, setActiveTab] = useState<'resumen' | 'inventario' | 'analiticas'>('resumen')
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_month' | 'this_year'>('this_month')

  const filteredSales = useMemo(() => {
    const now = new Date()
    return sales.filter((s: any) => {
      const d = new Date(s.date)
      if (dateFilter === 'this_month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      if (dateFilter === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear()
      }
      if (dateFilter === 'this_year') return d.getFullYear() === now.getFullYear()
      return true
    })
  }, [sales, dateFilter])

  const dynamicRevenue = filteredSales.reduce((acc: number, s: any) => acc + (s.product.salePrice * s.quantity), 0)
  const dynamicProfit = filteredSales.reduce((acc: number, s: any) => acc + s.orderProfit, 0)

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      
      {/* NAVEGACIÓN SUPERIOR MINIMALISTA */}
      <TopNav />

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
                onClick={() => setActiveTab('inventario')}
                className={`font-medium text-sm pb-4 -mb-[17px] cursor-pointer transition-colors ${activeTab === 'inventario' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                Inventario
              </span>
              <span 
                onClick={() => setActiveTab('analiticas')}
                className={`font-medium text-sm pb-4 -mb-[17px] cursor-pointer transition-colors ${activeTab === 'analiticas' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                Analíticas Avanzadas
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="h-8 text-xs rounded-md border border-neutral-200 px-2 font-medium bg-white focus:outline-none focus:border-neutral-900"
              >
                <option value="this_month">Este Mes</option>
                <option value="last_month">Mes Pasado</option>
                <option value="this_year">Este Año</option>
                <option value="all">Historico Total</option>
              </select>
              
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
            <SummaryTab 
              monthlyRevenue={dynamicRevenue} 
              monthlyProfit={dynamicProfit} 
              annualProfit={annualProfit} 
              productsCount={products.length} 
              sales={filteredSales} 
              periodName={dateFilter === 'this_month' ? 'Este Mes' : dateFilter === 'last_month' ? 'Mes Pasado' : dateFilter === 'this_year' ? 'Este Año' : 'Total'}
            />
          )}

          {activeTab === 'inventario' && (
            <InventoryTab 
              products={products} 
              onEditCatalog={() => setActiveModal('editProduct')} 
            />
          )}

          {activeTab === 'analiticas' && (
            <AnalyticsTab sales={filteredSales} />
          )}
          
          <div className="h-10"></div> {/* Bottom Padding */}
        </div>
      </main>

      {/* MODALES REUTILIZABLES */}
      <Modals 
        activeModal={activeModal} 
        setActiveModal={setActiveModal} 
        products={products} 
        selectedEditId={selectedEditId} 
        setSelectedEditId={setSelectedEditId} 
      />
    </div>
  )
}
