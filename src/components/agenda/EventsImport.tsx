"use client";

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useAgenda } from '@/context/AgendaContext';

export default function EventsImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [importStatus, setImportStatus] = useState<{type: 'idle' | 'success' | 'error', message: string}>({type: 'idle', message: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { agencies, fetchData } = useAgenda();

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Fecha Inicio (YYYY-MM-DD)': '2026-08-01', 'Fecha Fin (YYYY-MM-DD)': '2026-08-03', 'Nombre del Evento': 'NÓMINA - CONSTRUCTORA ABC', 'Tipo de Evento': 'Agencia Móvil', 'Ubicación': 'Caracas, Edo. Miranda', 'Código de Agencia / C.C.': '001' },
      { 'Fecha Inicio (YYYY-MM-DD)': '2026-08-02', 'Fecha Fin (YYYY-MM-DD)': '2026-08-02', 'Nombre del Evento': 'ATENCIÓN PÚBLICO', 'Tipo de Evento': 'Unidad Móvil', 'Ubicación': 'Plaza Central', 'Código de Agencia / C.C.': '002' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Eventos");
    XLSX.writeFile(wb, "Plantilla_Eventos_BNC.xlsx");
    showToast('Plantilla descargada con éxito', 'success');
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
          // Obtenemos las posibles llaves
          const fechaInicioKey = Object.keys(row).find(k => k.toLowerCase().includes('fecha inicio') || (k.toLowerCase().includes('fecha') && !k.toLowerCase().includes('fin'))) || 'Fecha Inicio';
          const fechaFinKey = Object.keys(row).find(k => k.toLowerCase().includes('fecha fin') || k.toLowerCase().includes('fecha final')) || 'Fecha Fin';
          const nombreKey = Object.keys(row).find(k => k.toLowerCase().includes('nombre')) || 'Nombre del Evento';
          const tipoKey = Object.keys(row).find(k => k.toLowerCase().includes('tipo')) || 'Tipo de Evento';
          const ubicacionKey = Object.keys(row).find(k => k.toLowerCase().includes('ubicaci')) || 'Ubicación';
          const ccKey = Object.keys(row).find(k => k.toLowerCase().includes('código') || k.toLowerCase().includes('agencia')) || 'Código de Agencia / C.C.';

          // Función para parsear fechas de Excel
          const parseDate = (rawDate: any) => {
            let parsedStr = '';
            if (typeof rawDate === 'number') {
               const excelEpoch = new Date(1899, 11, 30);
               const dateObj = new Date(excelEpoch.getTime() + rawDate * 86400000);
               parsedStr = dateObj.toISOString().split('T')[0];
            } else if (rawDate) {
               parsedStr = String(rawDate).trim();
               if (parsedStr.includes('/')) {
                 const parts = parsedStr.split('/');
                 if (parts.length === 3) {
                   parsedStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                 }
               }
            }
            return parsedStr;
          };

          let dateStrInicio = parseDate(row[fechaInicioKey]);
          let dateStrFin = parseDate(row[fechaFinKey]);

          if (!dateStrInicio || dateStrInicio.trim() === '') {
             dateStrInicio = new Date().toISOString().split('T')[0];
          }
          if (!dateStrFin || dateStrFin.trim() === '') {
             dateStrFin = dateStrInicio;
          }

          const name = (row[nombreKey] || '').toString().trim();
          let rawType = (row[tipoKey] || '').toString().trim();
          let type = 'Unidad Móvil'; // Valor por defecto seguro para la BD

          // Normalizar el tipo para evitar fallos del CHECK constraint en Supabase ('Unidad Móvil', 'Agencia Móvil', 'Red de Agencias')
          const rawTypeLower = rawType.toLowerCase();
          if (rawTypeLower.includes('agencia') && rawTypeLower.includes('red')) {
            type = 'Red de Agencias';
          } else if (rawTypeLower.includes('agencia')) {
            type = 'Agencia Móvil';
          }

          const location = (row[ubicacionKey] || '').toString().trim() || 'Por definir';
          const codeStr = (row[ccKey] || '').toString().trim();

          if (!name || name.length === 0) {
            throw new Error(`Falta el Nombre del Evento.`);
          }

          let agencyId = null;
          if (codeStr && codeStr.length > 0) {
             const match = agencies.find(a => a.code === codeStr || `${a.code} - ${a.name}` === codeStr);
             if (match) {
               agencyId = match.id;
             }
          }

          if (!agencyId && agencies.length > 0) {
            agencyId = agencies[0].id; 
          }

          parsedRecords.push({
            event_type: type,
            agency_id: agencyId,
            event_name: name,
            location: location,
            start_date: dateStrInicio,
            end_date: dateStrFin,
            status: 'Planificado'
          });
        } catch (err: any) {
          const errMsg = `Fila ${index + 2}: ${err.message}`;
          console.error(errMsg, row);
          errors.push(errMsg);
        }
      }

      if (parsedRecords.length === 0) {
        throw new Error(`No se pudo extraer ningún evento válido. Errores: ${errors.join(' | ')}`);
      }

      // Insertar en Supabase
      const { error } = await supabase.from('events').insert(parsedRecords);

      if (error) {
        throw new Error(error.message || JSON.stringify(error));
      }

      // Refrescar el estado global de la Agenda
      await fetchData();

      setImportStatus({ 
        type: 'success', 
        message: `Se importaron ${parsedRecords.length} eventos correctamente.`
      });
      showToast(`${parsedRecords.length} eventos importados exitosamente`, 'success');
      
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      console.error("Error capturado en processFile:", err);
      setImportStatus({ 
        type: 'error', 
        message: err.message || 'Error procesando el archivo Excel.'
      });
      showToast('Error al importar eventos', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setImportStatus({ type: 'error', message: 'Por favor selecciona un archivo Excel (.xlsx o .xls)' });
      return;
    }

    processFile(file);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between gap-4 h-full">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 hidden sm:flex">
          <FileSpreadsheet className="w-6 h-6 text-[#00205B]" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 leading-tight">Importar Eventos</h3>
          <p className="text-xs text-gray-500 hidden sm:block">Formato Excel (.xlsx)</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {importStatus.type === 'success' && (
          <span className="hidden md:flex items-center gap-1.5 text-sm font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            Éxito
          </span>
        )}
        {importStatus.type === 'error' && (
          <span className="hidden md:flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg max-w-[150px] truncate" title={importStatus.message}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Error
          </span>
        )}

        <button 
          onClick={handleDownloadTemplate}
          className="p-2.5 text-gray-500 hover:text-[#FE5000] hover:bg-orange-50 rounded-xl transition-colors"
          title="Descargar Plantilla"
        >
          <Download className="w-5 h-5" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls"
          className="hidden"
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 bg-[#00205B] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#001740] transition-colors disabled:opacity-50 shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">{isUploading ? 'Procesando...' : 'Subir Excel'}</span>
        </button>
      </div>
    </div>
  );
}
