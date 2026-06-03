import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Edit2, ChevronLeft, ChevronRight } from 'lucide-react'

interface InventoryTabProps {
  products: any[]
  onEditCatalog: () => void
}

export function InventoryTab({ products, onEditCatalog }: InventoryTabProps) {
  const [inventoryPage, setInventoryPage] = useState(1)
  const ITEMS_PER_PAGE = 7

  const totalInventoryPages = Math.ceil(products.length / ITEMS_PER_PAGE) || 1
  const paginatedProducts = products.slice((inventoryPage - 1) * ITEMS_PER_PAGE, inventoryPage * ITEMS_PER_PAGE)

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest">Estado de Inventario</h3>
        <Button onClick={onEditCatalog} variant="ghost" className="text-xs h-7 px-2 text-neutral-500 hover:text-neutral-900">
          <Edit2 size={12} className="mr-1"/> Editar Catálogo
        </Button>
      </div>

      <div className="w-full mb-12">
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
            <div className="flex items-center gap-2">
              <button onClick={() => setInventoryPage(p => Math.max(1, p - 1))} disabled={inventoryPage === 1} className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setInventoryPage(p => Math.min(totalInventoryPages, p + 1))} disabled={inventoryPage === totalInventoryPages} className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-30 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
