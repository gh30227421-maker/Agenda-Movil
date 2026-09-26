"use client";

import React, { useState, useEffect } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { supabase } from '@/lib/supabase';
import { Search, Link as LinkIcon, ExternalLink, Activity, Copy, CheckCircle2, Navigation, Power, Download } from 'lucide-react';
import Link from 'next/link';
import ComboBox from '@/components/ui/ComboBox';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminGestionEnVivoPage() {
  const { events, isLoading } = useAgenda();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingActivation, setLoadingActivation] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  const fetchRegistrosForExport = async (eventId: string) => {
    const { data, error } = await supabase
      .from('registros_en_vivo')
      .select('*')
      .eq('event_id', eventId)
      .order('fecha_registro', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const handleExportExcel = async () => {
    if (!selectedEventId) return;
    setLoadingExport(true);
    try {
      const registros = await fetchRegistrosForExport(selectedEventId);
      if (registros.length === 0) {
        alert("No hay registros para este evento.");
        return;
      }
      const event = events.find(e => e.id === selectedEventId);
      const exportData = registros.map(r => ({
        'Fecha y Hora': new Date(r.fecha_registro).toLocaleString(),
        'Cédula de Identidad': r.cedula_identidad,
        'Tipo de Solicitud': r.tipo_solicitud,
        'Cuentas': r.modulo_cuenta || '-',
        'TDD': r.modulo_tdd || '-',
        'TDC': r.modulo_tdc_opcional || '-',
        'Otras Operaciones': r.modulo_otras_operaciones || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
      
      const filename = `Reporte_${event?.eventName || 'Evento'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error(err);
      alert("Error al exportar a Excel.");
    } finally {
      setLoadingExport(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedEventId) return;
    setLoadingExport(true);
    try {
      const registros = await fetchRegistrosForExport(selectedEventId);
      if (registros.length === 0) {
        alert("No hay registros para este evento.");
        return;
      }
      const event = events.find(e => e.id === selectedEventId);
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(18);
      doc.text(`Reporte de Jornada: ${event?.eventName || 'Evento'}`, 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Fecha de exportación: ${new Date().toLocaleDateString()}`, 14, 30);
      
      const tableColumn = ["Fecha/Hora", "Cédula", "Solicitud", "Cuentas", "TDD", "Otras Operaciones"];
      const tableRows = registros.map(r => [
        new Date(r.fecha_registro).toLocaleString(),
        r.cedula_identidad,
        r.tipo_solicitud,
        r.modulo_cuenta || '-',
        r.modulo_tdd || '-',
        r.modulo_otras_operaciones || '-'
      ]);

      // @ts-ignore
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 32, 91] }
      });
      
      const filename = `Reporte_${event?.eventName || 'Evento'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error(err);
      alert("Error al exportar a PDF.");
    } finally {
      setLoadingExport(false);
    }
  };

  useEffect(() => {
    // Fetch currently active event
    const fetchActive = async () => {
      const { data } = await supabase.from('live_config').select('active_event_id').eq('id', 1).maybeSingle();
      if (data && data.active_event_id) {
        setActiveEventId(data.active_event_id);
      }
    };
    fetchActive();
  }, []);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const activeEvent = events.find(e => e.id === activeEventId);
  const eventOptions = events.map(e => ({ value: e.id, label: `${e.eventName} - ${e.state} (${e.startDate})` }));

  const captureLink = typeof window !== 'undefined' && activeEventId
    ? `${window.location.origin}/captura/${activeEventId}`
    : '';

  const handleCopy = () => {
    if (captureLink) {
      navigator.clipboard.writeText(captureLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleActivate = async () => {
    if (!selectedEventId) return;
    setLoadingActivation(true);
    try {
      await supabase.from('live_config').update({ active_event_id: selectedEventId, updated_at: new Date().toISOString() }).eq('id', 1);
      setActiveEventId(selectedEventId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivation(false);
    }
  };

  const handleDeactivate = async () => {
    setLoadingActivation(true);
    try {
      await supabase.from('live_config').update({ active_event_id: null, updated_at: new Date().toISOString() }).eq('id', 1);
      setActiveEventId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivation(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 p-6 md:p-8 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-slate-400" />
            <h1 className="text-3xl font-black text-[#00205B] tracking-tight">Admin: Gestión en Vivo</h1>
          </div>
          <p className="text-slate-500">Panel de configuración para activar eventos en tiempo real y generar enlaces.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
          <h2 className="text-lg font-bold text-[#00205B] mb-6 flex items-center gap-2">
            <Power className={`w-5 h-5 ${activeEventId ? 'text-green-500' : 'text-slate-400'}`} />
            Estado de Sesión en Vivo
          </h2>
          
          {activeEvent ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Evento Activo Actualmente</p>
                <h3 className="text-xl font-black text-[#00205B]">{activeEvent.eventName}</h3>
                <p className="text-sm text-slate-500">{activeEvent.state} - {activeEvent.startDate}</p>
              </div>
              <button 
                onClick={handleDeactivate}
                disabled={loadingActivation}
                className="px-6 py-2 bg-white border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {loadingActivation ? 'Desactivando...' : 'Desactivar Sesión'}
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <p className="text-slate-500 font-medium">No hay ningún evento activo en tiempo real.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-lg font-bold text-[#00205B] mb-6 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[#FE5000]" />
            Activar un Nuevo Evento
          </h2>
          
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Buscar Jornada Operativa</label>
            <div className="max-w-2xl flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <ComboBox
                  options={eventOptions}
                  value={selectedEventId || ''}
                  onChange={setSelectedEventId}
                  placeholder="Seleccionar evento..."
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Link
                  href={selectedEventId ? `/gestion-en-vivo?historical_id=${selectedEventId}` : '#'}
                  target="_blank"
                  className={`flex items-center justify-center px-6 py-2.5 font-bold rounded-xl transition-colors border ${!selectedEventId ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed pointer-events-none' : 'border-[#00205B] text-[#00205B] bg-white hover:bg-slate-50'}`}
                >
                  Consultar Histórico
                </Link>
                <button
                  onClick={handleActivate}
                  disabled={!selectedEventId || loadingActivation}
                  className="px-6 py-2.5 bg-[#FE5000] text-white font-bold rounded-xl hover:bg-[#CC4000] transition-colors disabled:opacity-50 disabled:hover:bg-[#FE5000]"
                >
                  {loadingActivation ? 'Activando...' : 'Establecer como Activo'}
                </button>
              </div>
            </div>

            <div className={`mt-6 pt-5 border-t border-slate-100 transition-opacity duration-300 ${selectedEventId ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Exportar Reporte de la Jornada Seleccionada</p>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={handleExportExcel}
                  disabled={!selectedEventId || loadingExport}
                  className="px-5 py-2.5 bg-[#107C41]/10 text-[#107C41] hover:bg-[#107C41]/20 border border-[#107C41]/20 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {loadingExport ? 'Generando...' : 'Descargar Excel'}
                </button>
                <button 
                  onClick={handleExportPDF}
                  disabled={!selectedEventId || loadingExport}
                  className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {loadingExport ? 'Generando...' : 'Descargar PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {activeEventId && captureLink && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 mt-8 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-lg font-bold text-[#00205B] mb-6 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-[#FE5000]" />
              Enlace Público de Captura
            </h2>
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <p className="text-sm text-slate-600 mb-4">
                Comparte este enlace con el equipo en campo. Cualquier promotor con este link podrá registrar datos para el evento activo.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex-1 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium truncate select-all">
                  {captureLink}
                </div>
                <button 
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all w-full sm:w-auto ${
                    copied ? 'bg-green-500 text-white shadow-md' : 'bg-[#00205B] text-white hover:bg-[#00153B] shadow-md'
                  }`}
                >
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? '¡Copiado!' : 'Copiar Link'}
                </button>
                <Link href={`/captura/${activeEventId}`} target="_blank" className="flex items-center justify-center p-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#FE5000] hover:border-[#FE5000] transition-colors w-full sm:w-auto">
                  <ExternalLink className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
