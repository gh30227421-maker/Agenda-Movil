"use client";

import React, { useState, useMemo } from 'react';
import { Filter, Calendar, MapPin, BarChart3, CalendarRange, XCircle } from 'lucide-react';
import { useAgenda } from '@/context/AgendaContext';
import ComboBox from '@/components/ui/ComboBox';
import KpiCards from './KpiCards';
import VenezuelaMap from './VenezuelaMap';
import VolumenChart from './VolumenChart';
import CostosParticipacionChart from './CostosParticipacionChart';
import CostosCategoriasChart from './CostosCategoriasChart';
import MatrizRentabilidad from './MatrizRentabilidad';
import HistorialMetrics from './HistorialMetrics';
import AgenciaRankingChart from './AgenciaRankingChart';
import AgenciaDistribucionChart from './AgenciaDistribucionChart';
import UnidadRankingChart from './UnidadRankingChart';
import UnidadDistribucionChart from './UnidadDistribucionChart';

const isEventInPeriod = (evStartDate: string | undefined, period: string) => {
  if (period === 'todos') return true;
  if (!evStartDate) return false;
  
  const [evYear, evMonthStr] = evStartDate.split('-');
  const evMonth = parseInt(evMonthStr, 10);
  const [selYear, selPeriod] = period.split('-');
  
  if (evYear !== selYear) return false;
  
  if (selPeriod === 'H1') return evMonth >= 1 && evMonth <= 6;
  if (selPeriod === 'H2') return evMonth >= 7 && evMonth <= 12;
  
  if (selPeriod === 'Q1') return evMonth >= 1 && evMonth <= 3;
  if (selPeriod === 'Q2') return evMonth >= 4 && evMonth <= 6;
  if (selPeriod === 'Q3') return evMonth >= 7 && evMonth <= 9;
  if (selPeriod === 'Q4') return evMonth >= 10 && evMonth <= 12;
  
  return selPeriod === evMonthStr;
};

export default function DashboardSection() {
  const { events, agencies } = useAgenda();

  // Estados de filtros
  const [selectedEventId, setSelectedEventId] = useState<string>('todos');
  const [selectedMonth, setSelectedMonth] = useState<string>('todos');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('todos');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('todos');

  // Lógica de cascada reactiva para opciones
  const availableMonths = useMemo(() => {
    const rawMonths = new Set<string>();
    events.forEach(ev => {
      if (selectedEventId !== 'todos' && ev.id !== selectedEventId) return;
      if (selectedRegionFilter !== 'todos') {
        const ag = agencies.find(a => a.state === ev.state);
        if (!ag || ag.region !== selectedRegionFilter) return;
      }
      if (selectedStateFilter !== 'todos' && ev.state !== selectedStateFilter) return;
      
      if (ev.startDate) rawMonths.add(ev.startDate.substring(0, 7));
    });
    
    const sortedRaw = Array.from(rawMonths).sort();
    
    const byYear: Record<string, string[]> = {};
    sortedRaw.forEach(m => {
      const [year, month] = m.split('-');
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(month);
    });

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const semestres: any[] = [];
    const trimestres: any[] = [];
    const meses: any[] = [];

    Object.keys(byYear).sort().reverse().forEach(year => {
      const mths = byYear[year];
      
      const hasH1 = mths.some(m => parseInt(m) <= 6);
      const hasH2 = mths.some(m => parseInt(m) >= 7);
      if (hasH1) semestres.push({ value: `${year}-H1`, label: `I Semestre ${year}`, group: 'Semestres' });
      if (hasH2) semestres.push({ value: `${year}-H2`, label: `II Semestre ${year}`, group: 'Semestres' });

      const hasQ1 = mths.some(m => parseInt(m) >= 1 && parseInt(m) <= 3);
      const hasQ2 = mths.some(m => parseInt(m) >= 4 && parseInt(m) <= 6);
      const hasQ3 = mths.some(m => parseInt(m) >= 7 && parseInt(m) <= 9);
      const hasQ4 = mths.some(m => parseInt(m) >= 10 && parseInt(m) <= 12);
      if (hasQ1) trimestres.push({ value: `${year}-Q1`, label: `I Trimestre ${year}`, group: 'Trimestres' });
      if (hasQ2) trimestres.push({ value: `${year}-Q2`, label: `II Trimestre ${year}`, group: 'Trimestres' });
      if (hasQ3) trimestres.push({ value: `${year}-Q3`, label: `III Trimestre ${year}`, group: 'Trimestres' });
      if (hasQ4) trimestres.push({ value: `${year}-Q4`, label: `IV Trimestre ${year}`, group: 'Trimestres' });
      
      mths.forEach(m => {
        meses.push({ value: `${year}-${m}`, label: `${monthNames[parseInt(m) - 1]} ${year}`, group: 'Meses' });
      });
    });

    return [...semestres, ...trimestres, ...meses];
  }, [events, agencies, selectedEventId, selectedRegionFilter, selectedStateFilter]);

  const availableRegions = useMemo(() => {
    const regions = new Set<string>();
    events.forEach(ev => {
      if (selectedEventId !== 'todos' && ev.id !== selectedEventId) return;
      if (!isEventInPeriod(ev.startDate, selectedMonth)) return;
      if (selectedStateFilter !== 'todos' && ev.state !== selectedStateFilter) return;
      
      const ag = agencies.find(a => a.state === ev.state);
      if (ag && ag.region) regions.add(ag.region);
    });
    return Array.from(regions).sort().map(r => ({ value: r, label: r }));
  }, [events, agencies, selectedEventId, selectedMonth, selectedStateFilter]);

  const availableStates = useMemo(() => {
    const states = new Set<string>();
    events.forEach(ev => {
      if (selectedEventId !== 'todos' && ev.id !== selectedEventId) return;
      if (!isEventInPeriod(ev.startDate, selectedMonth)) return;
      if (selectedRegionFilter !== 'todos') {
        const ag = agencies.find(a => a.state === ev.state);
        if (!ag || ag.region !== selectedRegionFilter) return;
      }
      
      if (ev.state) states.add(ev.state);
    });
    return Array.from(states).sort().map(s => ({ value: s, label: s }));
  }, [events, agencies, selectedEventId, selectedMonth, selectedRegionFilter]);

  const availableEvents = useMemo(() => {
    const evs: { value: string, label: string }[] = [];
    events.forEach(ev => {
      if (!isEventInPeriod(ev.startDate, selectedMonth)) return;
      if (selectedRegionFilter !== 'todos') {
        const ag = agencies.find(a => a.state === ev.state);
        if (!ag || ag.region !== selectedRegionFilter) return;
      }
      if (selectedStateFilter !== 'todos' && ev.state !== selectedStateFilter) return;
      
      evs.push({ value: ev.id, label: `${ev.eventName} (${ev.state || 'N/A'})` });
    });
    return evs;
  }, [events, agencies, selectedMonth, selectedRegionFilter, selectedStateFilter]);

  // Filtrado reactivo de eventos
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      // Filtro por Operativo específico
      if (selectedEventId !== 'todos' && ev.id !== selectedEventId) {
        return false;
      }
      // Filtro por Mes / Periodo (Jerárquico)
      if (!isEventInPeriod(ev.startDate, selectedMonth)) {
        return false;
      }
      // Filtro por Región
      if (selectedRegionFilter !== 'todos') {
        const agencyMatch = agencies.find(a => a.state === ev.state);
        if (!agencyMatch || agencyMatch.region !== selectedRegionFilter) {
          return false;
        }
      }
      // Filtro por Estado
      if (selectedStateFilter !== 'todos' && ev.state !== selectedStateFilter) {
        return false;
      }
      return true;
    });
  }, [events, agencies, selectedEventId, selectedMonth, selectedRegionFilter, selectedStateFilter]);

  const formatNumber = (num: number) => num.toLocaleString('es-VE');

  const totalOperaciones = filteredEvents.reduce((acc, ev) => {
    if (ev.cifras) {
      return acc + (ev.cifras.cuentasAbiertas || 0) + (ev.cifras.tdd || 0) + (ev.cifras.reclamos || 0);
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-6 w-full px-4 sm:px-8 mx-auto pb-10">
      {/* Cabecera Principal y Barra de Filtros Dinámicos */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#00205B]">Panel de Control Operativo y Financiero</h1>
            <p className="text-sm text-gray-500">Gestión de jornadas, despliegue de unidades y control de rentabilidad a nivel nacional</p>
          </div>
          
          <div className="flex items-center gap-4 overflow-x-auto pb-2 sm:pb-0">
            {/* KPIs Compactos Integrados */}
            <div className="flex items-center gap-6 border-r border-gray-200 pr-6 mr-2">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3 className="w-3.5 h-3.5 text-[#FE5000]" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Ops</span>
                </div>
                <span className="text-xl font-black text-[#00205B]">{formatNumber(totalOperaciones)}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <CalendarRange className="w-3.5 h-3.5 text-[#009639]" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Jornadas</span>
                </div>
                <span className="text-xl font-black text-[#00205B]">{formatNumber(filteredEvents.length)}</span>
              </div>
            </div>

            <span className="text-xs bg-blue-50 text-[#00205B] font-bold px-3 py-1.5 rounded-xl border border-blue-100 w-fit whitespace-nowrap">
              Mostrando {filteredEvents.length} de {events.length} jornadas
            </span>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          {/* Selector 1: Operativo Específico */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
              Operativo / Evento:
            </label>
            <ComboBox
              options={[{ value: 'todos', label: 'Todos los Operativos' }, ...availableEvents]}
              value={selectedEventId}
              onChange={(val) => {
                setSelectedEventId(val);
                // Si eligen un operativo específico, forzamos los otros filtros para que coincidan (opcional, pero mejora UX)
                if (val !== 'todos') {
                  const ev = events.find(e => e.id === val);
                  if (ev) {
                    if (ev.startDate) setSelectedMonth(ev.startDate.substring(0, 7));
                    if (ev.state) {
                      setSelectedStateFilter(ev.state);
                      const ag = agencies.find(a => a.state === ev.state);
                      if (ag && ag.region) setSelectedRegionFilter(ag.region);
                    }
                  }
                }
              }}
              icon={<Filter className="w-3.5 h-3.5" />}
              emptyText="No se encontraron operativos"
            />
          </div>

          {/* Selector 2: Mes Específico */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
              Mes / Periodo:
            </label>
            <ComboBox
              options={[{ value: 'todos', label: 'Todos los Meses' }, ...availableMonths]}
              value={selectedMonth}
              onChange={(val) => {
                setSelectedMonth(val);
                // Limpiar operativo si no está en este mes
                if (val !== 'todos' && selectedEventId !== 'todos') {
                  const ev = events.find(e => e.id === selectedEventId);
                  if (ev && (!ev.startDate || !ev.startDate.startsWith(val))) {
                    setSelectedEventId('todos');
                  }
                }
              }}
              icon={<Calendar className="w-3.5 h-3.5" />}
              emptyText="No hay meses disponibles"
            />
          </div>

          {/* Selector 3: Región */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
              Región:
            </label>
            <ComboBox
              options={[{ value: 'todos', label: 'Todas las Regiones' }, ...availableRegions]}
              value={selectedRegionFilter}
              onChange={(val) => {
                setSelectedRegionFilter(val);
                // Reset state and event when region changes to avoid orphaned selections
                setSelectedStateFilter('todos');
                setSelectedEventId('todos');
              }}
              icon={<MapPin className="w-3.5 h-3.5" />}
              emptyText="No hay regiones"
            />
          </div>

          {/* Selector 4: Estado / Ubicación */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
              Estado:
            </label>
            <ComboBox
              options={[{ value: 'todos', label: 'Todos los Estados' }, ...availableStates]}
              value={selectedStateFilter}
              onChange={(val) => {
                setSelectedStateFilter(val);
                setSelectedEventId('todos'); // Limpiar operativo específico
              }}
              icon={<MapPin className="w-3.5 h-3.5 text-[#00205B]" />}
              emptyText="No hay estados"
            />
          </div>
        </div>

        {/* Limpiar Filtros */}
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setSelectedEventId('todos');
              setSelectedMonth('todos');
              setSelectedRegionFilter('todos');
              setSelectedStateFilter('todos');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#FE5000] transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Bloque 1: Tarjetas KPI Consolidadas (Filtradas) */}
      <KpiCards events={filteredEvents} />

      {/* Bloque 2: Georreferenciación & Volumen Operativo (Filtrados) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VenezuelaMap 
          events={filteredEvents} 
          agencies={agencies}
          selectedState={selectedStateFilter}
          onStateClick={(stateName) => {
            setSelectedStateFilter(selectedStateFilter === stateName ? 'todos' : stateName);
          }}
        />
        <VolumenChart events={filteredEvents} />
      </div>

      {/* Bloque 3: Estructura de Costos Globales */}
      <div className="pt-2">
        <h2 className="text-xl font-black text-[#00205B] mb-6">Análisis de Costos Globales</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CostosParticipacionChart events={filteredEvents} />
          <CostosCategoriasChart events={filteredEvents} />
        </div>
      </div>

      {/* Bloque 4: Evolución Temporal */}
      <HistorialMetrics events={filteredEvents} />

      {/* SECCIÓN: Análisis Detallado por Canal */}
      <div className="pt-6 mt-6 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#00205B] mb-6">Análisis Detallado por Canal (Agencia Móvil)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AgenciaRankingChart events={filteredEvents} />
          <AgenciaDistribucionChart events={filteredEvents} />
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#00205B] mb-6">Análisis Detallado por Canal (Unidad Móvil)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UnidadRankingChart events={filteredEvents} />
          <UnidadDistribucionChart events={filteredEvents} />
        </div>
      </div>

      {/* Bloque 5: Matriz de Rentabilidad (Ubicado al final por su extenso detalle) */}
      <div className="pt-6 mt-6 border-t border-gray-200">
        <MatrizRentabilidad events={filteredEvents} />
      </div>
    </div>
  );
}
