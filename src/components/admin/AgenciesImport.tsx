"use client";

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export default function AgenciesImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [importStatus, setImportStatus] = useState<{type: 'idle' | 'success' | 'error', message: string}>({type: 'idle', message: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Agencia': 'Caracas Central', 'Centro de Costos (COD)': '001', 'Región': 'Capital', 'Estado': 'Distrito Capital', 'Zona': 'Centro' },
      { 'Agencia': 'Maracaibo Norte', 'Centro de Costos (COD)': '002', 'Región': 'Occidente', 'Estado': 'Zulia', 'Zona': 'Norte' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agencias");
    XLSX.writeFile(wb, "Plantilla_Agencias_BNC.xlsx");
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

      const parsedRecords = jsonData.map((row, index) => {
        const code = row['Centro de Costos (COD)']?.toString().trim();
        const name = row['Agencia']?.toString().trim();
        const region = row['Región']?.toString().trim();
        const state = row['Estado']?.toString().trim();
        const zone = row['Zona']?.toString().trim();

        if (!code || !name || !region || !state || !zone || code.length === 0 || name.length === 0) {
          throw new Error(`Faltan datos requeridos en la fila ${index + 2}. Verifica las cabeceras.`);
        }

        return { code, name, region, state, zone, is_active: true };
      }) as any[];

      const { error } = await (supabase as any)
        .from('agencies')
        .upsert(parsedRecords, { onConflict: 'code' });

      if (error) throw error;

      setImportStatus({ type: 'success', message: `¡Se han importado/actualizado ${parsedRecords.length} agencias exitosamente!` });
      showToast('Importación completada', 'success');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6 border-b border-gray-100 pb-6">
        <h2 className="text-xl font-black text-[#00205B] flex items-center gap-2">
          <FileSpreadsheet className="text-[#FE5000] w-6 h-6" />
          Importación Masiva de Agencias
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Descarga la plantilla, completa los datos y súbela para registrar múltiples agencias a la vez.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Step 1: Download */}
        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#00205B] shadow-sm mb-4">
            <span className="font-bold">1</span>
          </div>
          <h3 className="font-bold text-[#00205B] mb-2">Descargar Plantilla</h3>
          <p className="text-sm text-gray-600 mb-6">
            Utiliza nuestra plantilla Excel con el formato exacto requerido por el sistema.
          </p>
          <button 
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-6 py-3 bg-white text-[#00205B] font-bold rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm w-full justify-center"
          >
            <Download className="w-5 h-5" />
            Descargar Plantilla
          </button>
        </div>

        {/* Step 2: Upload */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 flex flex-col items-center justify-center text-center relative">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm mb-4">
            <span className="font-bold">2</span>
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Subir Excel</h3>
          <p className="text-sm text-gray-600 mb-6">
            Sube el archivo modificado. Las agencias existentes se actualizarán automáticamente.
          </p>
          
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-6 py-3 bg-[#FE5000] text-white font-bold rounded-xl hover:bg-[#e04700] transition-colors shadow-sm w-full justify-center disabled:opacity-50"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Upload className="w-5 h-5" />
            )}
            {isUploading ? 'Procesando...' : 'Importar Catálogo'}
          </button>
        </div>
      </div>

      {importStatus.type !== 'idle' && (
        <div className={`mt-8 p-4 rounded-xl flex items-start gap-3 border ${importStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {importStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
          <div>
            <h4 className="font-bold">{importStatus.type === 'success' ? 'Éxito' : 'Error'}</h4>
            <p className="text-sm mt-1">{importStatus.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
