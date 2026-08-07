"use client";

import { useState, useRef } from 'react';
import { Upload, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useAgenda } from '@/context/AgendaContext';

export default function CierresImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [importStatus, setImportStatus] = useState<{type: 'idle' | 'success' | 'error', message: string}>({type: 'idle', message: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { events, fetchData } = useAgenda();

  const handleDownloadTemplate = () => {
    const validEvents = events.filter(ev => ev.type === 'Agencia Móvil' || ev.type === 'Unidad Móvil');

    if (validEvents.length === 0) {
      showToast('No hay eventos válidos (Agencia Móvil o Unidad Móvil) para exportar.', 'error');
      return;
    }

    const exportData = validEvents.map(ev => ({
      'ID del Evento (NO MODIFICAR)': ev.id,
      'Fecha': ev.startDate,
      'Nombre del Evento / Empresa': ev.eventName,
      'Código Agencia': ev.agencyCode,
      'Saldo Fin Mes (Bs)': ev.saldoFinMesBs || 0,
      'Tasa BCV Rentabilidad': ev.tasaBcvRentabilidad || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cierres");
    XLSX.writeFile(wb, "Plantilla_Cierres_Operativos.xlsx");
    showToast('Plantilla descargada exitosamente', 'success');
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setImportStatus({ type: 'idle', message: '' });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        throw new Error('El archivo está vacío.');
      }

      const parsedRecords: any[] = [];
      const errors: string[] = [];

      for (let index = 0; index < jsonData.length; index++) {
        const row = jsonData[index];
        try {
          const idKey = Object.keys(row).find(k => k.toLowerCase().includes('id del evento')) || 'ID del Evento (NO MODIFICAR)';
          const id = row[idKey]?.toString().trim();

          if (!id || id.length === 0) {
            throw new Error(`El ID del Evento es obligatorio.`);
          }

          const parseNumber = (val: any) => {
            if (val === null || val === undefined || val === '') return 0;
            const parsed = Number(val);
            return isNaN(parsed) ? 0 : parsed;
          };

          const findKey = (searchStr: string, defaultKey: string) => {
            return Object.keys(row).find(k => k.toLowerCase().includes(searchStr)) || defaultKey;
          };

          parsedRecords.push({
            event_id: id,
            saldo_fin_mes_bs: parseNumber(row[findKey('saldo fin', 'Saldo Fin Mes (Bs)')]),
            tasa_bcv_rentabilidad: parseNumber(row[findKey('tasa bcv', 'Tasa BCV Rentabilidad')]),
            updated_at: new Date().toISOString()
          });

        } catch (err: any) {
          const errMsg = `Fila ${index + 2}: ${err.message}`;
          console.error(errMsg, row);
          errors.push(errMsg);
        }
      }

      if (parsedRecords.length === 0) {
        throw new Error(`No se procesó ningún cierre. Errores: ${errors.join(' | ')}`);
      }

      const { error } = await supabase.from('event_closings').upsert(parsedRecords as any, { onConflict: 'event_id' });

      if (error) {
        throw new Error(error.message || JSON.stringify(error));
      }

      await fetchData();

      setImportStatus({ 
        type: 'success', 
        message: `Se actualizaron cierres de ${parsedRecords.length} eventos.`
      });
      showToast(`${parsedRecords.length} cierres procesados exitosamente`, 'success');
      
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      console.error("Error en processFile (Cierres):", err);
      setImportStatus({ 
        type: 'error', 
        message: err.message || 'Error procesando el archivo.'
      });
      showToast('Error al importar cierres', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setImportStatus({ type: 'error', message: 'Por favor selecciona un Excel (.xlsx o .xls)' });
      return;
    }

    processFile(file);
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />

      <div className="flex bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-10">
        <button 
          onClick={handleDownloadTemplate}
          className="flex items-center justify-center px-4 hover:bg-gray-50 border-r border-gray-200 transition-colors text-gray-700 font-medium text-sm gap-2"
          title="Descargar Plantilla Cierres"
        >
          <Download className="w-4 h-4 text-[#009639]" />
          <span className="hidden sm:inline">Exportar Cierres</span>
        </button>

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center px-4 bg-[#009639] text-white hover:bg-[#007a2e] transition-colors disabled:opacity-50 text-sm font-medium gap-2"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">{isUploading ? 'Procesando...' : 'Importar'}</span>
        </button>
      </div>

      {importStatus.type === 'success' && (
        <span className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1.5 rounded-lg border border-green-100">
          <CheckCircle2 className="w-4 h-4" />
          Actualizado
        </span>
      )}
      {importStatus.type === 'error' && (
        <span className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2 py-1.5 rounded-lg border border-red-100 max-w-[150px] truncate" title={importStatus.message}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Error
        </span>
      )}
    </div>
  );
}
