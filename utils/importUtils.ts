/**
 * importUtils.ts
 * Parsea archivos Excel (.xlsx, .xls) o CSV y devuelve filas normalizadas
 * para importar productos al ERP.
 *
 * Columnas esperadas (en cualquier orden, nombres flexibles):
 *   nombre / name
 *   icono / icon (opcional)
 *   costo / coste / unitcost / cost / precio_costo
 *   margen / margin (en %, ej: 30 → 30%)
 *   stock / existencias / cantidad
 */

export interface ImportedProductRow {
  name: string
  icon: string
  unitCost: number
  margin: number   // porcentaje, ej: 30
  stock: number
  _valid: boolean
  _errors: string[]
}

// Normaliza clave de cabecera para mapeo flexible
function normalizeKey(k: string): string {
  return k.toLowerCase().trim()
    .replace(/[áà]/g, 'a').replace(/[éè]/g, 'e')
    .replace(/[íì]/g, 'i').replace(/[óò]/g, 'o').replace(/[úù]/g, 'u')
    .replace(/\s+/g, '_')
}

const KEY_MAP: Record<string, keyof ImportedProductRow | null> = {
  nombre: 'name', name: 'name', producto: 'name',
  icono: 'icon', icon: 'icon', emoji: 'icon',
  costo: 'unitCost', coste: 'unitCost', unitcost: 'unitCost',
  cost: 'unitCost', precio_costo: 'unitCost', precio_compra: 'unitCost',
  margen: 'margin', margin: 'margin', margen_porcentaje: 'margin',
  stock: 'stock', existencias: 'stock', cantidad: 'stock', inventory: 'stock',
}

function mapHeaders(headers: string[]): Record<string, keyof ImportedProductRow | null> {
  const map: Record<string, keyof ImportedProductRow | null> = {}
  headers.forEach(h => {
    const nk = normalizeKey(h)
    map[h] = KEY_MAP[nk] ?? null
  })
  return map
}

function parseRow(raw: Record<string, string>, headerMap: Record<string, keyof ImportedProductRow | null>): ImportedProductRow {
  const row: any = { name: '', icon: '', unitCost: 0, margin: 0, stock: 0, _valid: true, _errors: [] }

  for (const [col, field] of Object.entries(headerMap)) {
    if (!field) continue
    const val = (raw[col] ?? '').toString().trim()

    if (field === 'name' || field === 'icon') {
      row[field] = val
    } else {
      // numeric
      const num = parseFloat(val.replace(',', '.'))
      row[field] = isNaN(num) ? 0 : num
    }
  }

  // Validaciones
  if (!row.name) row._errors.push('Nombre vacío')
  if (row.unitCost <= 0) row._errors.push('Costo inválido')
  if (row.margin < 0 || row.margin > 10000) row._errors.push('Margen fuera de rango')
  if (row.stock < 0) row._errors.push('Stock negativo')

  row._valid = row._errors.length === 0
  return row as ImportedProductRow
}

// ── CSV parser (sin dependencias) ────────────────────────────────────────────
function parseCSV(text: string): ImportedProductRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  // Detectar separador: ; o ,
  const sep = lines[0].includes(';') ? ';' : ','

  const headers = lines[0].split(sep).map(h => h.replace(/^"|"$/g, '').trim())
  const headerMap = mapHeaders(headers)

  return lines.slice(1).map(line => {
    const cols = line.split(sep).map(c => c.replace(/^"|"$/g, '').trim())
    const raw: Record<string, string> = {}
    headers.forEach((h, i) => { raw[h] = cols[i] ?? '' })
    return parseRow(raw, headerMap)
  }).filter(r => r.name || r.unitCost > 0)
}

// ── XLSX parser (requiere pnpm add xlsx) ─────────────────────────────────────
async function parseXLSX(buffer: ArrayBuffer): Promise<ImportedProductRow[]> {
  // Carga dinámica para no romper si no está instalado
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – xlsx is an optional peer dependency (pnpm add xlsx)
  const XLSX = await import('xlsx').catch(() => null)
  if (!XLSX) throw new Error('La librería xlsx no está instalada. Ejecuta: pnpm add xlsx')

  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const json: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })

  if (!json.length) return []
  const headers = Object.keys(json[0])
  const headerMap = mapHeaders(headers)

  return json
    .map(raw => parseRow(raw, headerMap))
    .filter(r => r.name || r.unitCost > 0)
}

// ── Exporta la función principal ─────────────────────────────────────────────
export async function parseImportFile(file: File): Promise<{
  rows: ImportedProductRow[]
  format: 'csv' | 'xlsx'
  totalValid: number
  totalInvalid: number
}> {
  const isCSV = file.name.endsWith('.csv')

  let rows: ImportedProductRow[]

  if (isCSV) {
    const text = await file.text()
    rows = parseCSV(text)
  } else {
    const buffer = await file.arrayBuffer()
    rows = await parseXLSX(buffer)
  }

  return {
    rows,
    format: isCSV ? 'csv' : 'xlsx',
    totalValid: rows.filter(r => r._valid).length,
    totalInvalid: rows.filter(r => !r._valid).length,
  }
}

// ── Genera plantilla CSV descargable ─────────────────────────────────────────
export function downloadTemplate() {
  const header = 'nombre,icono,costo,margen,stock'
  const example = [
    'Café Americano,☕,1.20,80,100',
    'Camiseta Básica,👕,8.00,50,30',
    'Auriculares BT,🎮,25.00,40,15',
  ].join('\n')

  const blob = new Blob([header + '\n' + example], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla_productos.csv'
  a.click()
  URL.revokeObjectURL(url)
}
