'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, AlertCircle, Upload, FileSpreadsheet, CheckCircle2, Download, TriangleAlert } from 'lucide-react'
import { createProduct, createSale, updateProduct, importProducts, deleteProduct } from '@/app/actions'
import { parseImportFile, downloadTemplate, type ImportedProductRow } from '@/utils/importUtils'

type ModalType = 'sale' | 'product' | 'editProduct' | 'importExcel' | null

interface ModalsProps {
  activeModal: ModalType
  setActiveModal: (val: ModalType) => void
  onModalClose: (newSale?: any, newProduct?: any, updatedProduct?: any, removedProductId?: number) => void
  products: any[]
  selectedEditId: number | string
  setSelectedEditId: (val: number | string) => void
}

export function Modals({ activeModal, setActiveModal, onModalClose, products, selectedEditId, setSelectedEditId }: ModalsProps) {
  const productToEdit = products.find((p: any) => p.id.toString() === selectedEditId.toString())

  const [iconInput, setIconInput] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [saleError, setSaleError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Import state
  const [importRows, setImportRows] = useState<ImportedProductRow[]>([])
  const [importFormat, setImportFormat] = useState<'csv' | 'xlsx'>('csv')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeModal === 'editProduct' && productToEdit) {
      setIconInput(productToEdit.icon || '')
    } else if (activeModal === 'product') {
      setIconInput('')
    } else if (activeModal === 'sale') {
      setSelectedProductId('')
      setSaleError('')
    } else if (activeModal === 'importExcel') {
      setImportRows([])
      setImportError('')
      setImportSuccess('')
      setIsDragging(false)
    }
  }, [activeModal, productToEdit])

  function closeModal(newSale?: any, newProduct?: any, updatedProduct?: any, removedProductId?: number) {
    onModalClose(newSale, newProduct, updatedProduct, removedProductId)
    setSelectedProductId('')
    setSaleError('')
    setIsSubmitting(false)
    setIsDeleting(false)
    setImportRows([])
    setImportError('')
    setImportSuccess('')
  }

  async function handleImportFile(file: File) {
    if (!file) return
    setImportError('')
    setImportRows([])
    try {
      const result = await parseImportFile(file)
      setImportFormat(result.format)
      if (result.rows.length === 0) {
        setImportError('El archivo no contiene filas válidas. Revisa que las columnas tengan los nombres correctos.')
        return
      }
      setImportRows(result.rows)
    } catch (e: any) {
      setImportError(e?.message || 'Error al leer el archivo.')
    }
  }

  async function handleConfirmImport() {
    const validRows = importRows.filter(r => r._valid)
    if (!validRows.length) {
      setImportError('No hay filas válidas para importar.')
      return
    }
    setIsSubmitting(true)
    setImportError('')
    try {
      const result = await importProducts(validRows)
      setImportSuccess(`✅ ${result.imported} producto${result.imported !== 1 ? 's' : ''} importado${result.imported !== 1 ? 's' : ''} correctamente.`)
      setImportRows([])
      setTimeout(() => closeModal(), 2000)
    } catch (e: any) {
      setImportError(e?.message || 'Error al importar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!activeModal) return null

  const SUGGESTED_ICONS = ['📦', '👕', '☕', '🍔', '📱', '🚗', '🔧', '🎮', '🪴', '📚', '💄', '💊']
  const selectedProductForSale = products.find((p: any) => p.id.toString() === selectedProductId)
  const validCount = importRows.filter(r => r._valid).length
  const invalidCount = importRows.filter(r => !r._valid).length

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/20 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div className={`bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-neutral-100 ${activeModal === 'importExcel' ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="px-6 py-4 flex justify-between items-center border-b border-neutral-100">
          <h2 className="text-[15px] font-semibold text-neutral-900">
            {activeModal === 'product' ? 'Nuevo Producto'
              : activeModal === 'sale' ? 'Registrar Venta'
              : activeModal === 'editProduct' ? 'Editar Producto'
              : 'Importar Productos desde Excel / CSV'}
          </h2>
          <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-900 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ── NUEVO PRODUCTO ─────────────────────────────── */}
        {activeModal === 'product' && (
          <form action={async (fd) => {
            const newProduct = await createProduct(fd)
            closeModal(undefined, newProduct)
          }} className="p-6 space-y-4">
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Nombre e Icono</label>
              <div className="flex gap-3">
                <input name="icon" value={iconInput} onChange={(e) => setIconInput(e.target.value)} className="w-16 h-9 rounded-md border border-neutral-200 px-2 text-center text-sm focus:border-neutral-900 focus:outline-none bg-white" placeholder="Emoji ☕" maxLength={2} />
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

        {/* ── REGISTRAR VENTA ───────────────────────────── */}
        {activeModal === 'sale' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setSaleError('')
              if (!selectedProductId) { setSaleError('Debes seleccionar un producto.'); return }
              const fd = new FormData(e.currentTarget)
              fd.set('productId', selectedProductId)
              setIsSubmitting(true)
              try {
                const newSale = await createSale(fd)
                closeModal(newSale)
              } catch (err: any) {
                setSaleError(err?.message || 'Error al registrar la venta.')
              } finally {
                setIsSubmitting(false)
              }
            }}
            className="p-6 space-y-4"
          >
            {products.length === 0 ? (
              <div className="py-4 text-center text-sm text-neutral-500">Debes crear un producto primero.</div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Seleccionar Producto</label>
                  <Select value={selectedProductId} onValueChange={(val: string | null) => {
                    setSelectedProductId(val ?? '')
                    setSaleError('')
                  }}>
                    <SelectTrigger className="w-full h-9 rounded-md border-neutral-200 text-sm bg-white shadow-none focus:ring-0">
                      <SelectValue placeholder="Selecciona un producto...">
                        {selectedProductForSale
                          ? `${selectedProductForSale.icon ? selectedProductForSale.icon + ' ' : ''}${selectedProductForSale.name} (${selectedProductForSale.salePrice.toFixed(2)} €)`
                          : 'Selecciona un producto...'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()} disabled={p.stock < 1}>
                          {p.icon ? p.icon + ' ' : ''}{p.name} ({p.salePrice.toFixed(2)} €) — {p.stock} uds
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProductForSale && (
                  <div className="rounded-md bg-neutral-50 border border-neutral-100 px-3 py-2 text-xs text-neutral-500">
                    Stock disponible: <span className="font-semibold text-neutral-800">{selectedProductForSale.stock} uds</span>
                    {' · '}Precio venta: <span className="font-semibold text-neutral-800">{selectedProductForSale.salePrice.toFixed(2)} €</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Cantidad</label>
                  <input required name="quantity" type="number" min="1" max={selectedProductForSale?.stock ?? undefined} defaultValue="1" className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" />
                </div>

                {saleError && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                    <AlertCircle size={13} />{saleError}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={isSubmitting || !selectedProductId} className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs h-8 px-6 disabled:opacity-50">
                    {isSubmitting ? 'Guardando...' : 'Confirmar Venta'}
                  </Button>
                </div>
              </>
            )}
          </form>
        )}

        {/* ── EDITAR PRODUCTO ───────────────────────────── */}
        {activeModal === 'editProduct' && (
          <form action={async (fd) => {
            const updated = await updateProduct(fd)
            closeModal(undefined, undefined, updated)
          }} className="p-6 space-y-4">
            {products.length === 0 ? (
              <div className="py-4 text-center text-sm text-neutral-500">No hay productos.</div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Producto a Editar</label>
                  <input type="hidden" name="id" value={selectedEditId || ""} />
                  <Select value={selectedEditId.toString()} onValueChange={(val: string | null) => setSelectedEditId(val ?? '')}>
                    <SelectTrigger className="w-full h-9 rounded-md border-neutral-200 text-sm bg-white shadow-none focus:ring-0">
                      <SelectValue placeholder="Selecciona...">
                        {(() => {
                          const p = products.find((x: any) => x.id.toString() === selectedEditId.toString())
                          return p ? `${p.icon ? p.icon + ' ' : ''}${p.name}` : 'Selecciona...'
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
                        <input name="icon" value={iconInput} onChange={(e) => setIconInput(e.target.value)} className="w-16 h-9 rounded-md border border-neutral-200 px-2 text-center text-sm focus:border-neutral-900 focus:outline-none bg-white" placeholder="Emoji ☕" maxLength={2} />
                        <input required name="name" defaultValue={productToEdit.name} key={productToEdit.id + '-name'} className="flex-1 h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none bg-white" />
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
                        <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Costo</label>
                        <input required name="unitCost" type="number" step="0.01" defaultValue={productToEdit.unitCost} key={productToEdit.id + '-cost'} className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Margen %</label>
                        <input required name="margin" type="number" defaultValue={productToEdit.margin * 100} key={productToEdit.id + '-margin'} className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Stock</label>
                        <input required name="stock" type="number" defaultValue={productToEdit.stock} key={productToEdit.id + '-stock'} className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none" />
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 flex justify-between items-center">
                  <Button 
                    type="button" 
                    onClick={async () => {
                      if (!productToEdit) return;
                      if (!confirm('¿Estás seguro de que deseas eliminar este producto y todo su historial de ventas?')) return;
                      setIsDeleting(true);
                      try {
                        await deleteProduct(productToEdit.id);
                        closeModal(undefined, undefined, undefined, productToEdit.id);
                      } catch (e: any) {
                        alert(e.message || 'Error al eliminar producto');
                        setIsDeleting(false);
                      }
                    }}
                    disabled={!productToEdit || isSubmitting || isDeleting} 
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md text-xs h-8 px-4"
                  >
                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                  <Button type="submit" disabled={!productToEdit || isSubmitting || isDeleting} className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs h-8 px-6 disabled:opacity-50">
                    Actualizar
                  </Button>
                </div>
              </>
            )}
          </form>
        )}

        {/* ── IMPORTAR EXCEL / CSV ──────────────────────── */}
        {activeModal === 'importExcel' && (
          <div className="p-6 space-y-4">

            {/* Zona de drop / selección de archivo */}
            {importRows.length === 0 && !importSuccess && (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    const file = e.dataTransfer.files[0]
                    if (file) handleImportFile(file)
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                    isDragging ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center">
                    <FileSpreadsheet size={22} className="text-neutral-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-neutral-700">Arrastra tu archivo aquí</p>
                    <p className="text-xs text-neutral-400 mt-0.5">o haz clic para seleccionar · .xlsx, .xls, .csv</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImportFile(file)
                    }}
                  />
                </div>

                {/* Plantilla descargable */}
                <div className="flex items-center justify-between rounded-lg bg-neutral-50 border border-neutral-100 px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-neutral-700">¿No tienes plantilla?</p>
                    <p className="text-[11px] text-neutral-400">Descarga el CSV de ejemplo con las columnas correctas</p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-200 rounded-md px-3 py-1.5 hover:bg-white transition-colors"
                  >
                    <Download size={13} /> Plantilla CSV
                  </button>
                </div>

                <div className="rounded-md bg-neutral-50 border border-neutral-100 px-4 py-3 text-xs text-neutral-500 space-y-1">
                  <p className="font-medium text-neutral-700">Columnas aceptadas:</p>
                  <p><span className="font-mono bg-neutral-100 rounded px-1">nombre</span> · <span className="font-mono bg-neutral-100 rounded px-1">icono</span> (opcional) · <span className="font-mono bg-neutral-100 rounded px-1">costo</span> · <span className="font-mono bg-neutral-100 rounded px-1">margen</span> (%) · <span className="font-mono bg-neutral-100 rounded px-1">stock</span></p>
                  <p className="text-[11px] text-neutral-400">Para Excel (.xlsx) ejecuta primero: <span className="font-mono">pnpm add xlsx</span></p>
                </div>
              </>
            )}

            {/* Error al leer el archivo */}
            {importError && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-600">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Éxito */}
            {importSuccess && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-100 px-3 py-3 text-sm text-green-700">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            {/* Preview de filas */}
            {importRows.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-500">
                    <span className="font-medium text-green-600">{validCount} válido{validCount !== 1 ? 's' : ''}</span>
                    {invalidCount > 0 && <span className="ml-2 text-amber-500 font-medium">{invalidCount} con errores</span>}
                  </div>
                  <button onClick={() => setImportRows([])} className="text-[11px] text-neutral-400 hover:text-neutral-600 underline">
                    Cambiar archivo
                  </button>
                </div>

                <div className="border border-neutral-100 rounded-lg overflow-hidden">
                  <div className="overflow-auto max-h-64">
                    <table className="w-full text-xs">
                      <thead className="bg-neutral-50 text-neutral-500 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="text-left px-3 py-2">Producto</th>
                          <th className="text-right px-3 py-2">Costo</th>
                          <th className="text-right px-3 py-2">Margen</th>
                          <th className="text-right px-3 py-2">Stock</th>
                          <th className="px-3 py-2 text-center w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50">
                        {importRows.map((row, i) => (
                          <tr key={i} className={row._valid ? 'bg-white' : 'bg-amber-50'}>
                            <td className="px-3 py-2 font-medium text-neutral-800">
                              {row.icon && <span className="mr-1">{row.icon}</span>}
                              {row.name || <span className="text-neutral-300 italic">sin nombre</span>}
                            </td>
                            <td className="px-3 py-2 text-right text-neutral-600">{row.unitCost.toFixed(2)} €</td>
                            <td className="px-3 py-2 text-right text-neutral-600">{row.margin}%</td>
                            <td className="px-3 py-2 text-right text-neutral-600">{row.stock}</td>
                            <td className="px-3 py-2 text-center">
                              {row._valid
                                ? <CheckCircle2 size={13} className="text-green-500 mx-auto" />
                                : <span title={row._errors.join(', ')}><TriangleAlert size={13} className="text-amber-500 mx-auto" /></span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {invalidCount > 0 && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <TriangleAlert size={11} />
                    Las filas con errores no se importarán. Solo se importarán las {validCount} filas válidas.
                  </p>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button onClick={() => setImportRows([])} className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
                    ← Volver
                  </button>
                  <Button
                    onClick={handleConfirmImport}
                    disabled={isSubmitting || validCount === 0}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs h-8 px-6 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Importando...' : `Importar ${validCount} producto${validCount !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
