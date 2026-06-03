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
  black: [15, 15, 15] as [number, number, number],
  darkGray: [45, 45, 45] as [number, number, number],
  midGray: [110, 110, 110] as [number, number, number],
  lightGray: [210, 210, 210] as [number, number, number],
  ultraLight: [248, 248, 248] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

export const generateProfessionalReport = async (sales: any[], stats: any) => {
  try {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()

    // ── HEADER BAND ─────────────────────────────────────────────────────────
    doc.setFillColor(...BRAND.black)
    doc.rect(0, 0, pageW, 48, 'F')

    // Logo / Brand
    doc.setFontSize(26)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.white)
    doc.text('Monteva', 14, 24)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.lightGray)
    doc.text('REPORTE FINANCIERO', 14, 33)

    // Fecha y periodo
    const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    const periodStr = stats.periodName ?? 'Histórico'
    doc.setFontSize(8)
    doc.setTextColor(...BRAND.lightGray)
    doc.text(`Generado: ${dateStr}`, pageW - 14, 22, { align: 'right' })
    doc.text(`Período: ${periodStr}`, pageW - 14, 30, { align: 'right' })

    // ── KPI CARDS ROW ────────────────────────────────────────────────────────
    const kpis = [
      { label: 'INGRESOS', value: `${(stats.totalRevenue ?? stats.monthlyRevenue ?? 0).toFixed(2)} €` },
      { label: 'GANANCIA NETA', value: `${(stats.totalProfit ?? stats.monthlyProfit ?? 0).toFixed(2)} €` },
      { label: 'VENTAS', value: `${sales.length}` },
    ]

    const cardY = 58
    const cardH = 28
    const cardGap = 4
    const cardW = (pageW - 28 - cardGap * (kpis.length - 1)) / kpis.length

    kpis.forEach((kpi, i) => {
      const x = 14 + i * (cardW + cardGap)
      doc.setFillColor(...BRAND.ultraLight)
      doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'F')

      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BRAND.midGray)
      doc.text(kpi.label, x + 8, cardY + 9)

      doc.setFontSize(15)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BRAND.black)
      doc.text(kpi.value, x + 8, cardY + 22)
    })

    // ── TABLA DE VENTAS ──────────────────────────────────────────────────────
    const tableY = cardY + cardH + 14

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.darkGray)
    doc.text('DETALLE DE VENTAS', 14, tableY - 4)

    autoTable(doc, {
      startY: tableY,
      head: [['Fecha', 'Producto', 'Cant.', 'Precio Unit.', 'Ingreso', 'Ganancia']],
      body: sales.slice(0, 40).map((s: any) => [
        new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }),
        s.product.name.length > 32 ? s.product.name.slice(0, 32) + '…' : s.product.name,
        s.quantity.toString(),
        `${s.product.salePrice.toFixed(2)} €`,
        `${(s.product.salePrice * s.quantity).toFixed(2)} €`,
        `${s.orderProfit.toFixed(2)} €`,
      ]),
      theme: 'plain',
      headStyles: {
        fillColor: BRAND.black,
        textColor: BRAND.white,
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
      },
      bodyStyles: {
        fontSize: 8,
        textColor: BRAND.darkGray,
        cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
      },
      alternateRowStyles: { fillColor: BRAND.ultraLight },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 26, halign: 'right' },
        4: { cellWidth: 26, halign: 'right' },
        5: { cellWidth: 26, halign: 'right', textColor: [22, 163, 74] },
      },
      didDrawPage: (data: any) => {
        // Footer en cada página
        doc.setFillColor(...BRAND.ultraLight)
        doc.rect(0, pageH - 14, pageW, 14, 'F')
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...BRAND.midGray)
        doc.text('Monteva ERP — Confidencial', 14, pageH - 5)
        doc.text(`Página ${data.pageNumber}`, pageW - 14, pageH - 5, { align: 'right' })
      }
    })

    // ── RESUMEN FINAL ────────────────────────────────────────────────────────
    const finalY = (doc as any).lastAutoTable.finalY || tableY + 80

    if (finalY + 30 < pageH - 20) {
      doc.setDrawColor(...BRAND.lightGray)
      doc.setLineWidth(0.3)
      doc.line(14, finalY + 8, pageW - 14, finalY + 8)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BRAND.darkGray)
      doc.text('TOTAL GANANCIA:', 14, finalY + 18)
      doc.setFontSize(13)
      doc.setTextColor(22, 163, 74)
      doc.text(`${sales.reduce((a: number, s: any) => a + s.orderProfit, 0).toFixed(2)} €`, pageW - 14, finalY + 18, { align: 'right' })
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
