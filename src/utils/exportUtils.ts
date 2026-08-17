import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportConfig {
  title: string;
  filename: string;
  headers: string[];
  data: any[][];
  filters?: string;
}

export const exportToExcel = ({ filename, headers, data }: ExportConfig) => {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = ({ title, filename, headers, data, filters }: ExportConfig) => {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // 1. Formateo Estricto de Datos
  const formattedData = data.map(row => {
    return row.map((cell, index) => {
      if (cell === null || cell === undefined) return '';
      if (typeof cell !== 'number') return String(cell);
      
      const header = headers[index] || '';
      const headerLower = header.toLowerCase();
      
      // Si es un porcentaje
      if (headerLower.includes('%') || headerLower.includes('rentab')) {
        return Number(cell).toFixed(2) + '%';
      }
      
      // Si es moneda o monto (Cierre, Costo, Margen, Bs, USD, Tasa)
      if (
        headerLower.includes('bs') || 
        headerLower.includes('usd') || 
        headerLower.includes('costo') || 
        headerLower.includes('cierre') ||
        headerLower.includes('margen') ||
        headerLower.includes('tasa')
      ) {
        return cell.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      
      // Si es un número entero simple
      return cell.toLocaleString('es-VE');
    });
  });

  // 2. Estructura de Encabezado (Membrete corporativo)
  
  // Título del Reporte
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, 20, { align: 'center' });

  // Fecha y hora
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-VE');
  const timeStr = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado: ${dateStr} ${timeStr}`, pageWidth - 14, 20, { align: 'right' });

  // Cintillo de Filtros
  let startY = 32;
  if (filters) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    doc.text(`Filtro activo: ${filters}`, pageWidth / 2, 26, { align: 'center' });
    startY = 35;
  }

  // Validar si hay datos
  if (!formattedData || formattedData.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text('No hay registros disponibles para exportar con los filtros actuales.', pageWidth / 2, startY + 20, { align: 'center' });
    doc.save(`${filename}.pdf`);
    return;
  }

  // 3. Generación de Tabla Dinámica (AutoTable)
  autoTable(doc, {
    head: [headers],
    body: formattedData,
    startY: startY,
    theme: 'grid',
    styles: { 
      fontSize: 8,
      cellPadding: 3,
      valign: 'middle',
      cellWidth: 'wrap' // Ajuste automático de celdas
    },
    headStyles: { 
      fillColor: [0, 32, 91], // Azul Corporativo BNC
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Para asegurar que textos largos fluyan bien
    },
    didDrawPage: (dataObj) => {
      const totalPages = (doc.internal as any).getNumberOfPages();
      const currentPage = dataObj.pageNumber;
      const footerY = pageHeight - 15;

      // Paginación limpia sin firmas ni totales que pisen la tabla
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
    }
  });
  
  doc.save(`${filename}.pdf`);
};
