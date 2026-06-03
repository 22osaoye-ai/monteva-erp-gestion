'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, ChevronLeft, ChevronRight, FileText, Trash2, AlertTriangle } from 'lucide-react'
import { exportToCSV, generateReceiptPDF } from '@/utils/exportUtils'

interface SummaryTabProps {
  monthlyRevenue: number
  monthlyProfit: number
  annualProfit: number
  productsCount: number
  sales: any[]
  allSales: any[]
  periodName: string
  onDeleteSale: (id: number) => Promise<void>
  onClearHistory: () => Promise<void>
}

export function SummaryTab({
  monthlyRevenue, monthlyProfit, annualProfit, productsCount,
  sales, allSales, periodName, onDeleteSale, onClearHistory
}: SummaryTabProps) {
  const [salesPage, setSalesPage] = useState(1)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [clearingAll, setClearingAll] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const ITEMS_PER_PAGE = 8

  const totalSalesPages = Math.ceil(sales.length / ITEMS_PER_PAGE) || 1
  const paginatedSales = sales.slice((salesPage - 1) * ITEMS_PER_PAGE, salesPage * ITEMS_PER_PAGE)

  async function handleDelete(id: number) {
    setDeletingId(id)
    await onDeleteSale(id)
    setDeletingId(null)
    // Ajustar página si se queda vacía
    if (paginatedSales.length === 1 && salesPage > 1) setSalesPage(p => p - 1)
  }

  async function handleClearAll() {
    setClearingAll(true)
    await onClearHistory()
    setClearingAll(false)
    setShowClearConfirm(false)
    setSalesPage(1)
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* KPIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="border-r border-neutral-100 last:border-0 pr-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[13px] font-medium text-neutral-600">Ingresos ({periodName})</span>
            <ArrowUpRight size={14} className="text-green-500" />
          </div>
          <p className="text-4xl font-normal text-neutral-900 tracking-tight">{monthlyRevenue.toFixed(2)} €</p>
          <div className="w-full bg-neutral-100 h-1 mt-4 rounded-full overflow-hidden">
            <div className="bg-neutral-900 w-3/4 h-full rounded-full"></div>
          </div>
        </div>

        <div className="border-r border-neutral-100 last:border-0 pr-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[13px] font-medium text-neutral-600">Ganancia ({periodName})</span>
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
              {[...Array(20)].map((_, i) => (
                <div key={i} className={`h-full flex-1 rounded-sm ${i < 12 ? 'bg-neutral-300' : 'bg-neutral-100'}`}></div>
              ))}
          </div>
        </div>

        <div className="border-r border-neutral-100 last:border-0 pr-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[13px] font-medium text-neutral-600">Productos en Catálogo</span>
          </div>
          <p className="text-4xl font-normal text-neutral-900 tracking-tight">{productsCount}</p>
          <div className="w-full h-1 mt-4 flex items-center justify-between text-[10px] text-neutral-400">
            <span>0</span>
            <span>Catálogo</span>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE VENTAS */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest">Historial de Ventas</h3>
          <div className="flex items-center gap-2">
            <Button onClick={() => exportToCSV(sales)} variant="ghost" className="text-xs h-7 px-2 text-neutral-500 hover:text-neutral-900">
              Descargar CSV
            </Button>
            {sales.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-500 transition-colors px-2 h-7 rounded-md hover:bg-red-50"
              >
                <Trash2 size={13} />
                Borrar historial
              </button>
            )}
          </div>
        </div>

        {/* Modal de confirmación borrar todo */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 bg-neutral-900/20 flex items-center justify-center p-4" onClick={() => setShowClearConfirm(false)}>
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full max-w-sm p-6 border border-neutral-100 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">¿Borrar todo el historial?</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Se eliminarán {allSales.length} ventas. Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowClearConfirm(false)} className="text-xs h-8 px-4 rounded-md border border-neutral-200 hover:bg-neutral-50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={clearingAll}
                  className="text-xs h-8 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                >
                  {clearingAll ? 'Borrando...' : 'Sí, borrar todo'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full mb-12">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 pb-4">Fecha</th>
                <th className="px-4 py-3 pb-4">Producto</th>
                <th className="px-4 py-3 pb-4">Cantidad</th>
                <th className="px-4 py-3 pb-4">Precio</th>
                <th className="px-4 py-3 pb-4 text-right">Ganancia</th>
                <th className="px-4 py-3 pb-4 text-center w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-neutral-400">Sin ventas en este período.</td>
                </tr>
              ) : (
                paginatedSales.map((sale: any) => (
                  <tr
                    key={sale.id}
                    className={`group hover:bg-neutral-50/50 transition-all ${deletingId === sale.id ? 'opacity-40 scale-95' : ''}`}
                  >
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
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => generateReceiptPDF(sale)} 
                          title="Generar Recibo PDF"
                          className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                        >
                          <FileText size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          disabled={deletingId === sale.id}
                          title="Eliminar venta"
                          className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {sales.length > 0 && (
            <div className="flex items-center justify-between py-4 text-xs text-neutral-500">
              <span>{sales.length} registro{sales.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setSalesPage(p => Math.max(1, p - 1))} disabled={salesPage === 1} className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-neutral-400">{salesPage} / {totalSalesPages}</span>
                <button onClick={() => setSalesPage(p => Math.min(totalSalesPages, p + 1))} disabled={salesPage === totalSalesPages} className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-30 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
