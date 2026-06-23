'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Printer, FileUp } from 'lucide-react'
import { generateProfessionalReport } from '@/utils/exportUtils'

import { TopNav } from '@/components/dashboard/TopNav'
import { SummaryTab } from '@/components/dashboard/SummaryTab'
import { InventoryTab } from '@/components/dashboard/InventoryTab'
import { AnalyticsTab } from '@/components/dashboard/AnalyticsTab'
import { Modals } from '@/components/dashboard/Modals'
import { deleteSale, clearSalesHistory, getDashboardData } from '@/app/actions'
import { useQuery, useMutation, useQueryClient } from '@/lib/react-query'

export default function DashboardClient({ initialData }: { initialData: any }) {
  const queryClient = useQueryClient()

  // Gestión de estado mediante react-query
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: getDashboardData,
    initialData: initialData
  })

  const sales = dashboardData?.sales ?? initialData.sales
  const products = dashboardData?.products ?? initialData.products

  const [activeModal, setActiveModal] = useState<'sale' | 'product' | 'editProduct' | 'importExcel' | null>(null)
  const [selectedEditId, setSelectedEditId] = useState<number | string>("")
  const [activeTab, setActiveTab] = useState<'resumen' | 'inventario' | 'analiticas'>('resumen')
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_month' | 'this_year'>('this_month')

  const DATE_LABELS: Record<string, string> = {
    this_month: 'Este Mes',
    last_month: 'Mes Pasado',
    this_year: 'Este Año',
    all: 'Histórico Total'
  }

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
  const annualProfit = sales.filter((s: any) => new Date(s.date).getFullYear() === new Date().getFullYear())
    .reduce((acc: number, s: any) => acc + s.orderProfit, 0)

  // ── Mutaciones react-query ───────────────────────────────────────────────
  const deleteSaleMutation = useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    }
  })

  const clearHistoryMutation = useMutation({
    mutationFn: clearSalesHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    }
  })

  async function handleDeleteSale(saleId: number) {
    // Optimistic cache update
    queryClient.setQueryData(['dashboardData'], (old: any) => {
      if (!old) return old
      return {
        ...old,
        sales: old.sales.filter((s: any) => s.id !== saleId)
      }
    })
    try {
      await deleteSaleMutation.mutateAsync(saleId)
    } catch {
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    }
  }

  async function handleClearHistory() {
    // Optimistic cache update
    queryClient.setQueryData(['dashboardData'], (old: any) => {
      if (!old) return old
      return {
        ...old,
        sales: []
      }
    })
    try {
      await clearHistoryMutation.mutateAsync()
    } catch {
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    }
  }

  // Callback para refrescar usando react-query al cerrar modales
  function handleModalClose() {
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    setActiveModal(null)
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      
      <TopNav />

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
              <Select value={dateFilter} onValueChange={(val: any) => setDateFilter(val)}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-white shadow-none focus:ring-0 focus:ring-offset-0 border-neutral-200">
                  <SelectValue placeholder="Selecciona">
                    {DATE_LABELS[dateFilter]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month" className="text-xs">Este Mes</SelectItem>
                  <SelectItem value="last_month" className="text-xs">Mes Pasado</SelectItem>
                  <SelectItem value="this_year" className="text-xs">Este Año</SelectItem>
                  <SelectItem value="all" className="text-xs">Histórico Total</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={() => setActiveModal('sale')} className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs h-8 px-4 font-medium shadow-none">
                Registrar Venta
              </Button>
              <Button onClick={() => setActiveModal('product')} className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs h-8 px-4 font-medium shadow-none">
                Nuevo Producto
              </Button>
              <Button onClick={() => setActiveModal('importExcel')} variant="outline" className="rounded-md text-xs h-8 px-3 border-neutral-200 shadow-none font-medium">
                <FileUp size={14} className="mr-2" /> Importar
              </Button>
              <Button onClick={() => generateProfessionalReport(filteredSales, { totalRevenue: dynamicRevenue, totalProfit: dynamicProfit, monthlyRevenue: dynamicRevenue, monthlyProfit: dynamicProfit, periodName: DATE_LABELS[dateFilter] })} variant="outline" className="rounded-md text-xs h-8 px-3 border-neutral-200 shadow-none font-medium">
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
              allSales={sales}
              periodName={dateFilter === 'this_month' ? 'Este Mes' : dateFilter === 'last_month' ? 'Mes Pasado' : dateFilter === 'this_year' ? 'Este Año' : 'Total'}
              onDeleteSale={handleDeleteSale}
              onClearHistory={handleClearHistory}
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
          
          <div className="h-10"></div>
        </div>
      </main>

      <Modals 
        activeModal={activeModal} 
        setActiveModal={setActiveModal}
        onModalClose={handleModalClose}
        products={products}
        selectedEditId={selectedEditId} 
        setSelectedEditId={setSelectedEditId} 
      />
    </div>
  )
}
