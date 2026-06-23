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

// ─── Colores corporativos (minimalistas y premium matching con la plataforma) ───
const BRAND = {
  primary: [17, 24, 39] as [number, number, number], // neutral-900 (slate-900 / dark text)
  textDark: [38, 38, 38] as [number, number, number], // neutral-800
  textMuted: [115, 115, 115] as [number, number, number], // neutral-400
  bgLight: [248, 250, 252] as [number, number, number], // slate-50 / neutral-50
  border: [229, 229, 229] as [number, number, number], // neutral-200
  white: [255, 255, 255] as [number, number, number],
  success: [5, 150, 105] as [number, number, number], // emerald-600
}

// Dibuja el logo de la montaña corporativo para la cabecera del informe
const drawMountainLogo = (doc: any, x: number, y: number) => {
  doc.setDrawColor(...BRAND.primary)
  doc.setLineWidth(1.2)
  
  // Montaña grande: pico en (x+6, y), base izquierda (x, y+10), base derecha (x+12, y+10)
  doc.line(x, y + 10, x + 6, y)
  doc.line(x + 6, y, x + 12, y + 10)
  
  // Montaña pequeña: pico en (x+11, y+4), base izquierda (x+7, y+10), base derecha (x+15, y+10)
  doc.line(x + 7, y + 10, x + 11, y + 4)
  doc.line(x + 11, y + 4, x + 15, y + 10)
}

export const generateProfessionalReport = async (sales: any[], stats: any) => {
  try {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()

    // ── CABECERA PRINCIPAL (Estilo Limpio & Premium) ─────────────────────────
    drawMountainLogo(doc, 20, 18)

    // Nombre de marca
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.primary)
    doc.text('Monteva', 40, 24)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.textMuted)
    doc.text('ERP SYSTEM', 40, 28)

    // Título del reporte (Alineado a la derecha)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.primary)
    doc.text('Reporte Financiero', pageW - 20, 22, { align: 'right' })

    const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    const periodStr = stats.periodName ?? 'Histórico'
    
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.textMuted)
    doc.text(`Período: ${periodStr}`, pageW - 20, 28, { align: 'right' })
    doc.text(`Generado: ${dateStr}`, pageW - 20, 33, { align: 'right' })

    // Línea divisoria minimalista
    doc.setDrawColor(243, 244, 246) // neutral-100
    doc.setLineWidth(0.8)
    doc.line(20, 38, pageW - 20, 38)

    // ── TARJETAS KPI (Diseño de la Plataforma) ────────────────────────────────
    const kpis = [
      { label: 'INGRESOS TOTALES', value: `${(stats.totalRevenue ?? stats.monthlyRevenue ?? 0).toFixed(2)} €` },
      { label: 'GANANCIA NETA', value: `${(stats.totalProfit ?? stats.monthlyProfit ?? 0).toFixed(2)} €`, highlight: true },
      { label: 'VENTAS REGISTRADAS', value: `${sales.length}` },
    ]

    const cardY = 46
    const cardH = 26
    const cardGap = 6
    const cardW = (pageW - 40 - cardGap * (kpis.length - 1)) / kpis.length

    kpis.forEach((kpi, i) => {
      const x = 20 + i * (cardW + cardGap)
      
      // Fondo e indicador de tarjeta
      doc.setFillColor(...BRAND.white)
      doc.setDrawColor(...BRAND.border)
      doc.setLineWidth(0.4)
      doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'FD')

      // Barra vertical de acento en el borde izquierdo
      doc.setFillColor(...(kpi.highlight ? BRAND.success : BRAND.primary))
      doc.rect(x, cardY, 2.5, cardH, 'F')

      // Etiquetas y valores
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BRAND.textMuted)
      doc.text(kpi.label, x + 8, cardY + 9)

      doc.setFontSize(13.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...(kpi.highlight ? BRAND.success : BRAND.primary))
      doc.text(kpi.value, x + 8, cardY + 19)
    })

    // ── TABLA DE DETALLES (Minimalista y Estilizada) ──────────────────────────
    const tableY = cardY + cardH + 14

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.primary)
    doc.text('Detalle de Movimientos', 20, tableY - 4)

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
      theme: 'plain',
      headStyles: {
        fillColor: [248, 250, 252], // slate-50
        textColor: BRAND.primary,
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
        lineColor: [229, 229, 229], // neutral-200
        lineWidth: 0.1,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: BRAND.textDark,
        cellPadding: { top: 5, bottom: 5, left: 8, right: 8 },
        lineColor: [245, 245, 245], // neutral-100
        lineWidth: 0.1,
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
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
        // Línea divisoria del pie de página
        doc.setDrawColor(243, 244, 246)
        doc.setLineWidth(0.8)
        doc.line(20, pageH - 16, pageW - 20, pageH - 16)
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...BRAND.textMuted)
        doc.text('Monteva ERP — Documento de Uso Interno', 20, pageH - 8)
        doc.text(`Página ${data.pageNumber}`, pageW - 20, pageH - 8, { align: 'right' })
      }
    })

    // ── RESUMEN FINAL (Estilo de la Plataforma) ───────────────────────────────
    const finalY = (doc as any).lastAutoTable.finalY || tableY + 80

    if (finalY + 36 < pageH - 20) {
      doc.setFillColor(248, 250, 252) // slate-50
      doc.setDrawColor(...BRAND.border)
      doc.setLineWidth(0.4)
      doc.roundedRect(pageW - 90, finalY + 8, 70, 20, 3, 3, 'FD')

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BRAND.textMuted)
      doc.text('TOTAL GANANCIA NETA', pageW - 28, finalY + 15, { align: 'right' })
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BRAND.success)
      doc.text(`${sales.reduce((a: number, s: any) => a + s.orderProfit, 0).toFixed(2)} €`, pageW - 28, finalY + 23, { align: 'right' })
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
    const pageH = doc.internal.pageSize.getHeight()

    // Cabecera limpia con el logo Mountain
    drawMountainLogo(doc, 12, 12)
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.primary)
    doc.text('Monteva', 30, 18)
    
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.textMuted)
    doc.text('TICKET DE VENTA', 30, 22)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.textMuted)
    doc.text(`#${sale.id.toString().padStart(6, '0')}`, pageW - 12, 18, { align: 'right' })
    doc.text(new Date(sale.date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), pageW - 12, 23, { align: 'right' })

    // Línea divisoria
    doc.setDrawColor(241, 245, 249)
    doc.setLineWidth(0.8)
    doc.line(12, 28, pageW - 12, 28)

    autoTable(doc, {
      startY: 34,
      head: [['Producto', 'Cant.', 'P. Unit.', 'Total']],
      body: [[
        sale.product.name,
        sale.quantity.toString(),
        `${sale.product.salePrice.toFixed(2)} €`,
        `${(sale.product.salePrice * sale.quantity).toFixed(2)} €`
      ]],
      theme: 'plain',
      headStyles: { 
        fillColor: [248, 250, 252], 
        textColor: BRAND.primary, 
        fontSize: 7.5, 
        fontStyle: 'bold', 
        cellPadding: 5,
        lineColor: [229, 229, 229],
        lineWidth: 0.1
      },
      bodyStyles: { 
        fontSize: 8, 
        textColor: BRAND.textDark, 
        cellPadding: 5 
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 14, halign: 'center' },
        2: { cellWidth: 24, halign: 'right' },
        3: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: BRAND.primary },
      },
      margin: { left: 12, right: 12 }
    })

    const finalY = (doc as any).lastAutoTable.finalY || 60

    // Caja de total (Fondo gris claro, borde fino de la plataforma)
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(...BRAND.border)
    doc.setLineWidth(0.4)
    doc.roundedRect(12, finalY + 6, pageW - 24, 16, 2, 2, 'FD')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.textMuted)
    doc.text('TOTAL COBRADO', 20, finalY + 16)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND.primary)
    doc.text(`${(sale.product.salePrice * sale.quantity).toFixed(2)} €`, pageW - 20, finalY + 16, { align: 'right' })

    // Pie de ticket
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.textMuted)
    doc.text('¡Gracias por su compra!', pageW / 2, finalY + 34, { align: 'center' })
    doc.text('Monteva ERP System', pageW / 2, finalY + 39, { align: 'center' })

    doc.save(`Ticket_${sale.id.toString().padStart(6, '0')}_Monteva.pdf`)
  } catch (error) {
    console.error(error)
    alert('Error generando el ticket.')
  }
}
