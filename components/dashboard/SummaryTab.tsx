import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { exportToCSV } from '@/utils/exportUtils'

interface SummaryTabProps {
  monthlyRevenue: number
  monthlyProfit: number
  annualProfit: number
  productsCount: number
  sales: any[]
}

export function SummaryTab({ monthlyRevenue, monthlyProfit, annualProfit, productsCount, sales }: SummaryTabProps) {
  const [salesPage, setSalesPage] = useState(1)
  const ITEMS_PER_PAGE = 7

  const totalSalesPages = Math.ceil(sales.length / ITEMS_PER_PAGE) || 1
  const paginatedSales = sales.slice((salesPage - 1) * ITEMS_PER_PAGE, salesPage * ITEMS_PER_PAGE)

  return (
    <div className="animate-in fade-in duration-300">
      {/* KPIS */}
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
            <span>Max Capacity</span>
          </div>
        </div>
      </div>

      {/* TABLA DE VENTAS INTEGRADA AL RESUMEN */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest">Historial de Ventas</h3>
          <Button onClick={() => exportToCSV(sales)} variant="ghost" className="text-xs h-7 px-2 text-neutral-500 hover:text-neutral-900">Descargar CSV</Button>
        </div>

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
              <div className="flex items-center gap-2">
                <button onClick={() => setSalesPage(p => Math.max(1, p - 1))} disabled={salesPage === 1} className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={16} />
                </button>
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
