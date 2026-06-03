export const exportToCSV = (sales: any[]) => {
  const headers = ['ID,Fecha,Producto,Costo Unitario,Cantidad,Precio Venta,Ganancia']
  const rows = sales.map(s => 
    `${s.id},${new Date(s.date).toLocaleDateString()},"${s.product.name}",${s.product.unitCost},${s.quantity},${s.product.salePrice},${s.orderProfit}`
  )
  const csv = headers.concat(rows).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'Ventas_ERP.csv'
  a.click()
}

export const generateProfessionalReport = async (sales: any[], stats: any) => {
  try {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()
    
    doc.setFontSize(22)
    doc.setTextColor(40, 40, 40)
    doc.text("Monteva", 14, 20)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Reporte Financiero - ${new Date().toLocaleDateString()}`, 14, 28)
    
    autoTable(doc, {
      startY: 40,
      head: [['Métrica', 'Valor (€)']],
      body: [
        ['Ingresos Totales', stats.totalRevenue.toFixed(2)],
        ['Ganancia Neta', stats.totalProfit.toFixed(2)],
        ['Ingresos Mes Actual', stats.monthlyRevenue.toFixed(2)],
        ['Ganancia Mes Actual', stats.monthlyProfit.toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] }
    })
    
    const finalY = (doc as any).lastAutoTable.finalY || 100
    doc.setFontSize(12)
    doc.text("Últimas Ventas", 14, finalY + 15)
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Fecha', 'Producto', 'Cant.', 'Precio', 'Ganancia']],
      body: sales.slice(0, 30).map((s: any) => [
        new Date(s.date).toLocaleDateString(),
        s.product.name,
        s.quantity.toString(),
        `${s.product.salePrice.toFixed(2)} €`,
        `${s.orderProfit.toFixed(2)} €`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [80, 80, 80] }
    })
    
    doc.save('Monteva_Reporte.pdf')
  } catch (error) {
    alert("Instala jspdf: npm install jspdf jspdf-autotable")
  }
}

export const generateReceiptPDF = async (sale: any) => {
  try {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ format: 'a5' })
    
    doc.setFontSize(24)
    doc.setTextColor(20, 20, 20)
    doc.text("Monteva", 14, 25)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("TICKET DE COMPRA / FACTURA", 14, 35)
    
    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)
    doc.text(`Nº Venta: #${sale.id.toString().padStart(6, '0')}`, 14, 45)
    doc.text(`Fecha: ${new Date(sale.date).toLocaleString('es-ES')}`, 14, 52)
    
    autoTable(doc, {
      startY: 65,
      head: [['Producto', 'Cant.', 'Precio Unit.', 'Total']],
      body: [
        [
          sale.product.name,
          sale.quantity.toString(),
          `${sale.product.salePrice.toFixed(2)} €`,
          `${(sale.product.salePrice * sale.quantity).toFixed(2)} €`
        ]
      ],
      theme: 'plain',
      headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold' },
      styles: { cellPadding: 5 }
    })
    
    const finalY = (doc as any).lastAutoTable.finalY || 100
    
    doc.setDrawColor(220, 220, 220)
    doc.line(14, finalY + 10, 134, finalY + 10)
    
    doc.setFontSize(14)
    doc.text("TOTAL PAGADO:", 14, finalY + 22)
    doc.setFontSize(16)
    doc.text(`${(sale.product.salePrice * sale.quantity).toFixed(2)} €`, 134, finalY + 22, { align: 'right' })
    
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text("Gracias por su compra.", 74, 190, { align: 'center' })
    
    doc.save(`Factura_${sale.id}_Monteva.pdf`)
  } catch (error) {
    alert("Error generando el ticket. Asegúrate de tener jspdf instalado.")
  }
}
