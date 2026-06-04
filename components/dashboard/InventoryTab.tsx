import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit2, ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface InventoryTabProps {
  products: any[]
  onEditCatalog: () => void
}

export function InventoryTab({ products, onEditCatalog }: InventoryTabProps) {
  const [inventoryPage, setInventoryPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const ITEMS_PER_PAGE = 7

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      let matchesStock = true
      if (stockFilter === 'active') matchesStock = p.stock > 10
      else if (stockFilter === 'low') matchesStock = p.stock > 0 && p.stock <= 10
      else if (stockFilter === 'empty') matchesStock = p.stock === 0
      return matchesSearch && matchesStock
    })
  }, [products, searchTerm, stockFilter])

  const totalInventoryPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1
  const paginatedProducts = filteredProducts.slice((inventoryPage - 1) * ITEMS_PER_PAGE, inventoryPage * ITEMS_PER_PAGE)

  useEffect(() => {
    setInventoryPage(1)
  }, [searchTerm, stockFilter])

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-widest whitespace-nowrap">Estado de Inventario</h3>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
            <Input
              type="text"
              placeholder="Buscar producto..."
              className="pl-9 h-9 text-xs shadow-none border-neutral-200 focus-visible:ring-1 focus-visible:ring-neutral-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={stockFilter} onValueChange={(val: any) => setStockFilter(val || 'all')}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-white shadow-none focus:ring-0 focus:ring-offset-0 border-neutral-200">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todos los estados</SelectItem>
              <SelectItem value="active" className="text-xs">Stock Activo</SelectItem>
              <SelectItem value="low" className="text-xs">Stock Bajo</SelectItem>
              <SelectItem value="empty" className="text-xs">Sin Stock</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={onEditCatalog} variant="ghost" className="text-xs h-9 px-3 border border-transparent text-neutral-600 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 whitespace-nowrap">
            <Edit2 size={13} className="mr-1.5"/> Editar Catálogo
          </Button>
        </div>
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
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-neutral-400">No se encontraron productos.</td>
              </tr>
            ) : (
              paginatedProducts.map((p: any) => (
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
              ))
            )}
          </tbody>
        </table>

        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between py-4 text-xs text-neutral-500">
            <span>{filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setInventoryPage(p => Math.max(1, p - 1))} disabled={inventoryPage === 1} className="p-1 rounded-md hover:bg-neutral-100 disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-neutral-400">{inventoryPage} / {totalInventoryPages}</span>
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
