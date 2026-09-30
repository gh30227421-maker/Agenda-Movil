"use client";

import { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useAgenda } from '@/context/AgendaContext';

interface EventsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EventsImportModal({ isOpen, onClose }: EventsImportModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [importStatus, setImportStatus] = useState<{type: 'idle' | 'success' | 'error', message: string}>({type: 'idle', message: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { fetchData, agencies } = useAgenda(); // useAgenda provides agencies and a way to refetch
  const [agenciesList, setAgenciesList] = useState<any[]>([]);

  useEffect(() => {
    // If agencies are not loaded correctly from context, fetch them directly for robustness
    const fetchAgencies = async () => {
      const { data } = await supabase.from('agencies').select('id, code, name');
      if (data) setAgenciesList(data);
    };
    fetchAgencies();
  }, []);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 
        'Nombre del Evento': 'Operativo Especial Navidad', 
        'Tipo': 'Unidad Móvil', // 'Unidad Móvil', 'Agencia Móvil', 'Red de Agencias'
        'Código Agencia': '001', 
        'Ubicación': 'Plaza Central', 
        'Estado': 'Distrito Capital', 
        'Fecha Inicio (YYYY-MM-DD)': '2026-12-01', 
        'Fecha Fin (YYYY-MM-DD)': '2026-12-15', 
        'Estatus': 'Culminado', // 'Planificado', 'En Curso', 'Culminado', 'Cancelado'
        'VP Solicitante': 'VP Negocios', 
        'Responsable': 'Juan Perez'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Eventos");
    XLSX.writeFile(wb, "Plantilla_Eventos_BNC.xlsx");
    showToast('Plantilla descargada con éxito', 'success');
  };

  const parseExcelDate = (dateValue: any): string | null => {
    if (!dateValue) return null;
    if (typeof dateValue === 'string' && dateValue.includes('-')) return dateValue.trim();
    if (!isNaN(Number(dateValue))) {
      const serial = Number(dateValue);
      const excelEpoch = new Date(1899, 11, 30);
      const dateObj = new Date(excelEpoch.getTime() + serial * 86400000);
      return dateObj.toISOString().split('T')[0];
    }
    return dateValue.toString().trim();
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

      const parsedRecords = jsonData.map((row, index) => {
        const eventName = row['Nombre del Evento']?.toString()?.trim() || null;
        const type = row['Tipo']?.toString()?.trim() || 'Unidad Móvil';
        
        // Handle code: remove leading zeros (e.g. '052' -> '52', '001' -> '1')
        let code = row['Código Agencia']?.toString()?.trim() || null;
        if (code && !isNaN(Number(code))) {
          code = Number(code).toString();
        }

        const location = row['Ubicación']?.toString()?.trim() || null;
        const estadoOperativo = row['Estado']?.toString()?.trim() || null;
        const startDate = parseExcelDate(row['Fecha Inicio (YYYY-MM-DD)']);
        const endDate = parseExcelDate(row['Fecha Fin (YYYY-MM-DD)']);
        const status = row['Estatus']?.toString()?.trim() || 'Planificado';

        const vpSolicitante = row['VP Solicitante']?.toString()?.trim() || null;
        const responsable = row['Responsable']?.toString()?.trim() || null;

        if (!eventName || !startDate || !endDate) {
          throw new Error(`Faltan datos requeridos en la fila ${index + 2}. Verifica Nombre del Evento, Fecha Inicio y Fecha Fin.`);
        }

        // Validate date format simply
        if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
          throw new Error(`Formato de fecha inválido en la fila ${index + 2}. Usa YYYY-MM-DD.`);
        }

        // Resolve agency_id from code if provided
        let agency_id = null;
        if (code) {
          const activeAgencies = agencies && agencies.length > 0 ? agencies : agenciesList;
          const match = activeAgencies.find(a => a.code === code);
          if (match) {
            // DEBUG: Ensure match.id is a UUID
            if (typeof match.id === 'string' && match.id.length < 10) {
              throw new Error(`DEBUG: Found agency but its ID is "${match.id}" instead of a UUID.`);
            }
            agency_id = match.id;
          } else {
            throw new Error(`El código de agencia "${code}" en la fila ${index + 2} no existe en el sistema.`);
          }
        }

        return {
          event_type: type,
          agency_id: agency_id,
          event_name: eventName,
          location: location,
          estado_operativo: estadoOperativo,
          start_date: startDate,
          end_date: endDate,
          status: status,
          vp_solicitante: vpSolicitante,
          responsable: responsable
        };
      }) as any[];

      // Inyectar a la base de datos
      const { error } = await supabase
        .from('events')
        .insert(parsedRecords);

      if (error) throw error;

      setImportStatus({ type: 'success', message: `¡Se han importado ${parsedRecords.length} eventos exitosamente!` });
      showToast('Importación masiva completada', 'success');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload global data
      if (fetchData) {
        await fetchData();
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

    } catch (err: any) {
      console.error('Error importing:', err);
      setImportStatus({ type: 'error', message: err.message || 'Ocurrió un error al procesar el archivo.' });
      showToast('Error en la importación', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl relative overflow-hidden my-auto border border-gray-100">
        
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00205B]/10 flex items-center justify-center text-[#00205B]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#00205B]">Importación Masiva de Eventos</h2>
              <p className="text-sm text-gray-500 font-medium">Carga múltiples eventos simultáneamente mediante Excel</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Step 1: Download */}
            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex flex-col items-center justify-center text-center transition-all hover:bg-blue-50 hover:shadow-md">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#00205B] shadow-sm mb-4">
                <span className="font-bold">1</span>
              </div>
              <h3 className="text-lg font-bold text-[#00205B] mb-2">Descargar Plantilla</h3>
              <p className="text-sm text-gray-600 mb-6">
                Obtén el archivo base con todas las columnas necesarias (Nombre, Tipo, Fechas, Estado).
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 bg-white border-2 border-[#00205B] text-[#00205B] px-6 py-2.5 rounded-xl font-bold hover:bg-[#00205B] hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar Plantilla
              </button>
            </div>

            {/* Step 2: Upload */}
            <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100 flex flex-col items-center justify-center text-center transition-all hover:bg-orange-50 hover:shadow-md">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#FE5000] shadow-sm mb-4">
                <span className="font-bold">2</span>
              </div>
              <h3 className="text-lg font-bold text-[#FE5000] mb-2">Subir Archivo</h3>
              <p className="text-sm text-gray-600 mb-6">
                Sube tu archivo completado para registrar los eventos operativos automáticamente.
              </p>
              
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 bg-[#FE5000] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#e04700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploading ? 'Procesando...' : 'Seleccionar Archivo'}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {importStatus.type !== 'idle' && (
            <div className={`mt-8 p-4 rounded-xl flex items-start gap-3 border ${
              importStatus.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
              )}
              <div className="text-sm font-medium">{importStatus.message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
