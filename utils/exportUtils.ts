export const exportToCSV = (sales: any[]) => {
  const headers = ['ID,Fecha,Producto,Costo Unitario,Cantidad,Precio Venta,Ganancia']
  const rows = sales.map(s => 
    `${s.id},${new Date(s.date).toLocaleDateString()},\"${s.product.name}\",${s.product.unitCost},${s.quantity},${s.product.salePrice},${s.orderProfit}`
  )
  const csv = headers.concat(rows).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'Ventas_ERP.csv'
  a.click()
}

// ─── Colores corporativos ────────────────────────────────────────────────────
const BRAND = {
  primary: [15, 23, 42] as [number, number, number], // slate-900
  accent: [59, 130, 246] as [number, number, number], // blue-500
  textDark: [30, 41, 59] as [number, number, number], // slate-800
  textMuted: [100, 116, 139] as [number, number, number], // slate-500
  bgLight: [248, 250, 252] as [number, number, number], // slate-50
  border: [226, 232, 240] as [number, number, number], // slate-200
  white: [255, 255, 255] as [number, number, number],
  success: [16, 185, 129] as [number, number, number], // emerald-500
}

export const generateProfessionalReport = async (sales: any[], stats: any) => {
  try {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()

    // ── HEADER BAND ─────────────────────────────────────────────────────────
    doc.setFillColor(...BRAND.primary)
    doc.rect(0, 0, pageW, 55, 'F')
    
    // Accent line
    doc.setFillColor(...BRAND.accent)
    doc.rect(0, 55, pageW, 2, 'F')

    // Logo / Brand
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.white)
    doc.text('MONTEVA', 20, 30)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184) // slate-400
    doc.text('ERP SYSTEM', 20, 40)

    // Report Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.white)
    doc.text('Reporte Financiero', pageW - 20, 26, { align: 'right' })

    const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    const periodStr = stats.periodName ?? 'Histórico'
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text(`Período: ${periodStr}`, pageW - 20, 36, { align: 'right' })
    doc.text(`Generado: ${dateStr}`, pageW - 20, 44, { align: 'right' })

    // ── KPI CARDS ROW ────────────────────────────────────────────────────────
    const kpis = [
      { label: 'INGRESOS TOTALES', value: `${(stats.totalRevenue ?? stats.monthlyRevenue ?? 0).toFixed(2)} €` },
      { label: 'GANANCIA NETA', value: `${(stats.totalProfit ?? stats.monthlyProfit ?? 0).toFixed(2)} €`, highlight: true },
      { label: 'VENTAS REGISTRADAS', value: `${sales.length}` },
    ]

    const cardY = 70
    const cardH = 32
    const cardGap = 8
    const cardW = (pageW - 40 - cardGap * (kpis.length - 1)) / kpis.length

    kpis.forEach((kpi, i) => {
      const x = 20 + i * (cardW + cardGap)
      
      // Card background
      doc.setFillColor(...BRAND.bgLight)
      doc.setDrawColor(...BRAND.border)
      doc.setLineWidth(0.3)
      doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'FD')

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BRAND.textMuted)
      doc.text(kpi.label, x + 10, cardY + 12)

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...(kpi.highlight ? BRAND.success : BRAND.textDark))
      doc.text(kpi.value, x + 10, cardY + 24)
    })

    // ── TABLA DE VENTAS ──────────────────────────────────────────────────────
    const tableY = cardY + cardH + 16

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.textDark)
    doc.text('Detalle de Movimientos', 20, tableY - 6)

    autoTable(doc, {
      startY: tableY,
      head: [['Fecha', 'Producto', 'Cant.', 'Precio Unit.', 'Ingreso', 'Ganancia']],
      body: sales.slice(0, 50).map((s: any) => [
        new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        s.product.name.length > 35 ? s.product.name.slice(0, 35) + '…' : s.product.name,
        s.quantity.toString(),
        `${s.product.salePrice.toFixed(2)} €`,
        `${(s.product.salePrice * s.quantity).toFixed(2)} €`,
        `${s.orderProfit.toFixed(2)} €`,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: BRAND.primary,
        textColor: BRAND.white,
        fontSize: 8.5,
        fontStyle: 'bold',
        cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
        lineColor: BRAND.primary,
        lineWidth: 0.1,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: BRAND.textDark,
        cellPadding: { top: 5, bottom: 5, left: 8, right: 8 },
        lineColor: BRAND.border,
        lineWidth: 0.1,
      },
      alternateRowStyles: { fillColor: BRAND.bgLight },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 26, halign: 'right' },
        4: { cellWidth: 26, halign: 'right' },
        5: { cellWidth: 26, halign: 'right', textColor: BRAND.success, fontStyle: 'bold' },
      },
      margin: { left: 20, right: 20 },
      didDrawPage: (data: any) => {
        // Footer en cada página
        doc.setFillColor(...BRAND.bgLight)
        doc.rect(0, pageH - 16, pageW, 16, 'F')
        
        doc.setDrawColor(...BRAND.border)
        doc.setLineWidth(0.3)
        doc.line(0, pageH - 16, pageW, pageH - 16)
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...BRAND.textMuted)
        doc.text('Monteva ERP — Documento Confidencial', 20, pageH - 6)
        doc.text(`Página ${data.pageNumber}`, pageW - 20, pageH - 6, { align: 'right' })
      }
    })

    // ── RESUMEN FINAL ────────────────────────────────────────────────────────
    const finalY = (doc as any).lastAutoTable.finalY || tableY + 80

    if (finalY + 40 < pageH - 20) {
      doc.setFillColor(...BRAND.bgLight)
      doc.setDrawColor(...BRAND.border)
      doc.setLineWidth(0.3)
      doc.roundedRect(pageW - 90, finalY + 12, 70, 24, 3, 3, 'FD')

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BRAND.textMuted)
      doc.text('TOTAL GANANCIA NETA', pageW - 28, finalY + 22, { align: 'right' })
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BRAND.success)
      doc.text(`${sales.reduce((a: number, s: any) => a + s.orderProfit, 0).toFixed(2)} €`, pageW - 28, finalY + 30, { align: 'right' })
    }

    doc.save(`Monteva_Reporte_${new Date().toISOString().slice(0, 10)}.pdf`)
  } catch (error) {
    console.error(error)
    alert('Error generando el PDF.')
  }
}

export const generateReceiptPDF = async (sale: any) => {
  try {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ format: 'a5' })
    const pageW = doc.internal.pageSize.getWidth()

    // Header
    doc.setFillColor(15, 15, 15)
    doc.rect(0, 0, pageW, 38, 'F')
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Monteva', 12, 18)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 180, 180)
    doc.text('TICKET DE COMPRA', 12, 27)
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text(`#${sale.id.toString().padStart(6, '0')}`, pageW - 12, 18, { align: 'right' })
    doc.text(new Date(sale.date).toLocaleString('es-ES'), pageW - 12, 27, { align: 'right' })

    autoTable(doc, {
      startY: 48,
      head: [['Producto', 'Cant.', 'P. Unit.', 'Total']],
      body: [[
        sale.product.name,
        sale.quantity.toString(),
        `${sale.product.salePrice.toFixed(2)} €`,
        `${(sale.product.salePrice * sale.quantity).toFixed(2)} €`
      ]],
      theme: 'plain',
      headStyles: { fillColor: [245, 245, 245], textColor: [80, 80, 80], fontSize: 7.5, fontStyle: 'bold', cellPadding: 5 },
      bodyStyles: { fontSize: 9, textColor: [30, 30, 30], cellPadding: 6 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 14, halign: 'center' },
        2: { cellWidth: 24, halign: 'right' },
        3: { cellWidth: 26, halign: 'right' },
      }
    })

    const finalY = (doc as any).lastAutoTable.finalY || 90

    // Total box
    doc.setFillColor(15, 15, 15)
    doc.roundedRect(12, finalY + 8, pageW - 24, 22, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 180, 180)
    doc.text('TOTAL PAGADO', 20, finalY + 18)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(`${(sale.product.salePrice * sale.quantity).toFixed(2)} €`, pageW - 20, finalY + 22, { align: 'right' })

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 180, 180)
    doc.text('Gracias por su compra · Monteva', pageW / 2, finalY + 44, { align: 'center' })

    doc.save(`Ticket_${sale.id.toString().padStart(6, '0')}_Monteva.pdf`)
  } catch (error) {
    console.error(error)
    alert('Error generando el ticket.')
  }
}
