interface AnalyticsTabProps {
  sales: any[]
}

export function AnalyticsTab({ sales }: AnalyticsTabProps) {
  // Aggregate data
  const productPerformance: Record<string, number> = {}
  sales.forEach((s: any) => {
    productPerformance[s.product.name] = (productPerformance[s.product.name] || 0) + s.quantity
  })
  
  const productPerformanceData = Object.keys(productPerformance)
    .map(name => ({ name, cantidad: productPerformance[name] }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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
                      <div 
                        className="bg-neutral-900 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center py-10 text-sm text-neutral-400">
                Sin datos suficientes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
