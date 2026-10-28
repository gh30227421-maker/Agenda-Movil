"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import GlobalMonitoreoKPIs from '@/components/rutas/GlobalMonitoreoKPIs';
import RutasUnidadMovil from '@/components/rutas/RutasUnidadMovil';
import RutasAgenciaMovil from '@/components/rutas/RutasAgenciaMovil';
import RutasPresentationSlides from '@/components/rutas/RutasPresentationSlides';
import { useAgenda } from '@/context/AgendaContext';
import { Calendar, XCircle, Filter, Tv } from 'lucide-react';

export default function RutasDashboardClient() {
  const { events, dashboardFilters, setDashboardFilters } = useAgenda();
  const { selectedMonths } = dashboardFilters;
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterBar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthClick = (mValue: string, e: React.MouseEvent) => {
    if (mValue === 'todos') {
      setDashboardFilters(prev => ({ ...prev, selectedMonths: [] }));
      setShowFilterBar(false);
      return;
    }
    
    if (e.ctrlKey || e.metaKey) {
      setDashboardFilters(prev => {
        if (prev.selectedMonths.includes(mValue)) {
          return { ...prev, selectedMonths: prev.selectedMonths.filter(v => v !== mValue) };
        }
        return { ...prev, selectedMonths: [...prev.selectedMonths, mValue] };
      });
    } else {
      setDashboardFilters(prev => ({ ...prev, selectedMonths: [mValue] }));
      setShowFilterBar(false);
    }
  };

  // Extraer meses únicos a partir de la data
  const availableMonths = useMemo(() => {
    const rawMonths = new Set<string>();
    events.forEach(ev => {
      if (ev.type !== 'Agencia Móvil' && ev.type !== 'Unidad Móvil' && ev.type !== 'Red de Agencias') return;
      if (ev.startDate) {
        rawMonths.add(ev.startDate.substring(0, 7)); // YYYY-MM
      }
    });

    const sorted = Array.from(rawMonths).sort().reverse(); // Mas recientes primero
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return sorted.map(m => {
      const [year, month] = m.split('-');
      return {
        value: m,
        label: `${monthNames[parseInt(month) - 1]} ${year}`
      };
    });
  }, [events]);

  const getActiveLabel = () => {
    if (selectedMonths.length === 0) return 'Todos los Períodos';
    const labels = selectedMonths.map(m => availableMonths.find(am => am.value === m)?.label || m);
    return labels.join(', ');
  };

  return (
    <div className="w-full flex flex-col relative z-10 gap-3">
      
      {/* Etiqueta de Filtro Activo (Resumen) */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 flex justify-start items-center">
        {!showFilterBar ? (
          <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs rounded-full px-3.5 py-1 animate-in fade-in slide-in-from-top-2 duration-300">
            <Calendar className="w-3.5 h-3.5 text-[#00205B]" />
            <span className="text-[11px] font-black text-[#00205B] uppercase tracking-wider">{getActiveLabel()}</span>
            
            {selectedMonths.length > 0 && (
              <button 
                onClick={() => setDashboardFilters(prev => ({ ...prev, selectedMonths: [] }))}
                className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                title="Limpiar filtro"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
            
            <div className="w-px h-3.5 bg-slate-300 mx-1"></div>
            
            <button 
              onClick={() => setShowFilterBar(true)}
              className="text-[9px] font-bold text-[#FE5000] hover:text-[#CC4000] uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              <Filter className="w-2.5 h-2.5" /> Modificar
            </button>
          </div>
        ) : (
          <div ref={filterRef} className="w-full flex flex-col md:flex-row gap-3 md:items-center bg-white/95 backdrop-blur-xl border border-slate-200 shadow-lg rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0 md:pr-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Filtrar Periodo:</span>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-auto md:ml-0">Usa Ctrl para selección múltiple</span>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={(e) => handleMonthClick('todos', e)}
                className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
                  selectedMonths.length === 0 
                    ? 'bg-[#00205B] text-white border border-[#00205B]' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-[#00205B]/30'
                }`}
              >
                Todos
              </button>
              {availableMonths.map(m => (
                <button
                  key={m.value}
                  onClick={(e) => handleMonthClick(m.value, e)}
                  className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
                    selectedMonths.includes(m.value) 
                      ? 'bg-[#00205B] text-white border border-[#00205B] shadow-sm' 
                      : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-[#00205B]/30'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPIs Globales Consolidados */}
      <GlobalMonitoreoKPIs selectedMonths={selectedMonths} />
      
      {/* Bloque 1: Unidad Móvil */}
      <section className="w-full pt-2 relative">
        <RutasUnidadMovil selectedMonths={selectedMonths} />
      </section>

      {/* Línea divisoria recta entre Unidad Móvil y Agencia Móvil */}
      <div className="w-full max-w-[1920px] mx-auto my-10 sm:my-14 px-4 sm:px-6 md:px-8" aria-hidden="true">
        <div className="w-full border-t border-slate-300"></div>
      </div>

      {/* Bloque 2: Agencia Móvil */}
      <section className="w-full pb-8 relative">
        <RutasAgenciaMovil selectedMonths={selectedMonths} />
      </section>

      {/* Botón Flotante para Activar Modo Presentación */}
      {!isPresentationOpen && (
        <button
          onClick={() => setIsPresentationOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#00205B] hover:bg-[#FE5000] text-white px-4 py-2.5 rounded-full shadow-2xl transition-all duration-300 font-bold text-xs group border border-white/20 hover:scale-105 active:scale-95"
          title="Modo Presentación TV (Diapositivas Ejecutivas)"
        >
          <Tv className="w-4 h-4 text-orange-400 group-hover:text-white transition-colors animate-pulse" />
          <span className="hidden sm:inline tracking-wider">MODO PRESENTACIÓN</span>
        </button>
      )}

      {/* Modal/Pantalla Completa de Diapositivas Ejecutivas */}
      <RutasPresentationSlides 
        selectedMonths={selectedMonths}
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
      />
    </div>
  );
}
