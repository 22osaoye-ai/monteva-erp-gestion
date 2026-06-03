import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'
import { createProduct, createSale, updateProduct } from '@/app/actions'

interface ModalsProps {
  activeModal: 'sale' | 'product' | 'editProduct' | null
  setActiveModal: (val: 'sale' | 'product' | 'editProduct' | null) => void
  products: any[]
  selectedEditId: number | string
  setSelectedEditId: (val: number | string) => void
}

export function Modals({ activeModal, setActiveModal, products, selectedEditId, setSelectedEditId }: ModalsProps) {
  const productToEdit = products.find((p: any) => p.id.toString() === selectedEditId.toString())

  const [iconInput, setIconInput] = useState('')

  useEffect(() => {
    if (activeModal === 'editProduct' && productToEdit) {
      setIconInput(productToEdit.icon || '')
    } else if (activeModal === 'product') {
      setIconInput('')
    }
  }, [activeModal, productToEdit])

  if (!activeModal) return null

  const SUGGESTED_ICONS = ['📦', '👕', '☕', '🍔', '📱', '🚗', '🔧', '🎮', '🪴', '📚', '💄', '💊']

  return (
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
                <input name="icon" value={iconInput} onChange={(e) => setIconInput(e.target.value)} className="w-16 h-9 rounded-md border border-neutral-200 px-2 text-center text-sm focus:border-neutral-900 focus:outline-none bg-white" placeholder="Emoji ☕" maxLength={2} title="Añade un emoji para representar el producto" />
                <input required name="name" className="flex-1 h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none bg-white" placeholder="Nombre del producto" />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {SUGGESTED_ICONS.map(emoji => (
                  <button key={emoji} type="button" onClick={() => setIconInput(emoji)} className="w-7 h-7 rounded hover:bg-neutral-100 flex items-center justify-center text-sm transition-colors border border-transparent hover:border-neutral-200">
                    {emoji}
                  </button>
                ))}
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
                  <input type="hidden" name="productId" id="hiddenProductIdSale" />
                  <Select onValueChange={(val: string | null) => {
                    const el = document.getElementById('hiddenProductIdSale') as HTMLInputElement;
                    if (el) el.value = val || '';
                  }}>
                    <SelectTrigger className="w-full h-9 rounded-md border-neutral-200 text-sm bg-white shadow-none focus:ring-0">
                      <SelectValue placeholder="Selecciona...">
                        {(() => {
                          const el = document.getElementById('hiddenProductIdSale') as HTMLInputElement;
                          const selId = el?.value;
                          const p = products.find((x: any) => x.id.toString() === selId);
                          return p ? `${p.icon ? p.icon + ' ' : ''}${p.name} (${p.salePrice.toFixed(2)} €)` : 'Selecciona...';
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()} disabled={p.stock < 1}>
                          {p.icon ? p.icon + ' ' : ''}{p.name} ({p.salePrice.toFixed(2)} €) - {p.stock} uds
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <input type="hidden" name="id" value={selectedEditId || ""} />
                  <Select value={selectedEditId.toString()} onValueChange={(val: string | null) => setSelectedEditId(val || '')}>
                    <SelectTrigger className="w-full h-9 rounded-md border-neutral-200 text-sm bg-white shadow-none focus:ring-0">
                      <SelectValue placeholder="Selecciona...">
                        {(() => {
                          const p = products.find((x: any) => x.id.toString() === selectedEditId.toString());
                          return p ? `${p.icon ? p.icon + ' ' : ''}${p.name}` : 'Selecciona...';
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.icon ? p.icon + ' ' : ''}{p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {productToEdit && (
                  <>
                    <div className="space-y-3">
                      <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Nombre e Icono</label>
                      <div className="flex gap-3">
                        <input name="icon" value={iconInput} onChange={(e) => setIconInput(e.target.value)} className="w-16 h-9 rounded-md border border-neutral-200 px-2 text-center text-sm focus:border-neutral-900 focus:outline-none bg-white" placeholder="Emoji ☕" maxLength={2} title="Añade un emoji para representar el producto" />
                        <input required name="name" defaultValue={productToEdit.name} className="flex-1 h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none bg-white" />
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {SUGGESTED_ICONS.map(emoji => (
                          <button key={emoji} type="button" onClick={() => setIconInput(emoji)} className="w-7 h-7 rounded hover:bg-neutral-100 flex items-center justify-center text-sm transition-colors border border-transparent hover:border-neutral-200">
                            {emoji}
                          </button>
                        ))}
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
  )
}
