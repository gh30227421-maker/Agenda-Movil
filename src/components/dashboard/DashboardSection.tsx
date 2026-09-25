"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Calendar, MapPin, BarChart3, CalendarRange, XCircle, Grid, Truck, Building2, Store } from 'lucide-react';
import { useAgenda } from '@/context/AgendaContext';
import ComboBox from '@/components/ui/ComboBox';
import KpiCards from './KpiCards';
import VenezuelaMap from './VenezuelaMap';
import VolumenChart from './VolumenChart';
import CostosParticipacionChart from './CostosParticipacionChart';
import CostosCategoriasChart from './CostosCategoriasChart';
import HistorialMetrics from './HistorialMetrics';
import AgenciaRankingChart from './AgenciaRankingChart';
import AgenciaDistribucionChart from './AgenciaDistribucionChart';
import UnidadRankingChart from './UnidadRankingChart';
import UnidadDistribucionChart from './UnidadDistribucionChart';
import RentabilidadRegionChart from './RentabilidadRegionChart';
import RentabilidadTopEventosChart from './RentabilidadTopEventosChart';
import RentabilidadVsCostosChart from './RentabilidadVsCostosChart';
import RankingEventosOperativoChart from './RankingEventosOperativoChart';
const isEventInPeriod = (evStartDate: string | undefined, periods: string[]) => {
  if (periods.length === 0 || periods.includes('todos')) return true;
  if (!evStartDate) return false;
  
  return periods.some(period => {
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
  });
};

export default function DashboardSection() {
  const { events, agencies } = useAgenda();

  // Estados de filtros
  const [activeTab, setActiveTab] = useState<'operativo' | 'financiero'>('operativo');
  const [selectedEventType, setSelectedEventType] = useState<string>('Todas');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  const getButtonClass = (type: string, activeClass: string, inactiveClass: string) => {
    return `flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
      selectedEventType === type ? activeClass : inactiveClass
    }`;
  };
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedRegionFilters, setSelectedRegionFilters] = useState<string[]>([]);
  const [selectedStateFilters, setSelectedStateFilters] = useState<string[]>([]);

  // Lógica de cascada reactiva para opciones
  const availableMonths = useMemo(() => {
    const rawMonths = new Set<string>();
    events.forEach(ev => {
      if (selectedEventType !== 'Todas' && ev.type !== selectedEventType) return;
      if (selectedEventIds.length > 0 && !selectedEventIds.includes(ev.id)) return;
      if (selectedRegionFilters.length > 0) {
        const ag = agencies.find(a => a.state === ev.state);
        if (!ag || !selectedRegionFilters.includes(ag.region)) return;
      }
      if (selectedStateFilters.length > 0 && !selectedStateFilters.includes(ev.state || '')) return;
      
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
  }, [events, agencies, selectedEventType, selectedEventIds, selectedRegionFilters, selectedStateFilters]);

  const availableRegions = useMemo(() => {
    const regions = new Set<string>();
    events.forEach(ev => {
      if (selectedEventType !== 'Todas' && ev.type !== selectedEventType) return;
      if (selectedEventIds.length > 0 && !selectedEventIds.includes(ev.id)) return;
      if (!isEventInPeriod(ev.startDate, selectedMonths)) return;
      if (selectedStateFilters.length > 0 && !selectedStateFilters.includes(ev.state || '')) return;
      
      const ag = agencies.find(a => a.state === ev.state);
      if (ag && ag.region) regions.add(ag.region);
    });
    return Array.from(regions).sort().map(r => ({ value: r, label: r }));
  }, [events, agencies, selectedEventType, selectedEventIds, selectedMonths, selectedStateFilters]);

  const availableStates = useMemo(() => {
    const states = new Set<string>();
    events.forEach(ev => {
      if (selectedEventType !== 'Todas' && ev.type !== selectedEventType) return;
      if (selectedEventIds.length > 0 && !selectedEventIds.includes(ev.id)) return;
      if (!isEventInPeriod(ev.startDate, selectedMonths)) return;
      if (selectedRegionFilters.length > 0) {
        const ag = agencies.find(a => a.state === ev.state);
        if (!ag || !selectedRegionFilters.includes(ag.region)) return;
      }
      
      if (ev.state) states.add(ev.state);
    });
    return Array.from(states).sort().map(s => ({ value: s, label: s }));
  }, [events, agencies, selectedEventType, selectedEventIds, selectedMonths, selectedRegionFilters]);

  const availableEvents = useMemo(() => {
    const evs: { value: string, label: string }[] = [];
    events.forEach(ev => {
      if (selectedEventType !== 'Todas' && ev.type !== selectedEventType) return;
      if (!isEventInPeriod(ev.startDate, selectedMonths)) return;
      if (selectedRegionFilters.length > 0) {
        const ag = agencies.find(a => a.state === ev.state);
        if (!ag || !selectedRegionFilters.includes(ag.region)) return;
      }
      if (selectedStateFilters.length > 0 && !selectedStateFilters.includes(ev.state || '')) return;
      
      evs.push({ value: ev.id, label: `${ev.eventName} (${ev.state || 'N/A'})` });
    });
    return evs;
  }, [events, agencies, selectedEventType, selectedMonths, selectedRegionFilters, selectedStateFilters]);

  // Filtrado reactivo de eventos
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      // Filtro por Tipo
      if (selectedEventType !== 'Todas' && ev.type !== selectedEventType) return false;
      // Filtro por Operativo específico
      if (selectedEventIds.length > 0 && !selectedEventIds.includes(ev.id)) {
        return false;
      }
      // Filtro por Mes / Periodo (Jerárquico)
      if (!isEventInPeriod(ev.startDate, selectedMonths)) {
        return false;
      }
      // Filtro por Región
      if (selectedRegionFilters.length > 0) {
        const agencyMatch = agencies.find(a => a.state === ev.state);
        if (!agencyMatch || !selectedRegionFilters.includes(agencyMatch.region)) {
          return false;
        }
      }
      // Filtro por Estado
      if (selectedStateFilters.length > 0 && !selectedStateFilters.includes(ev.state || '')) {
        return false;
      }
      return true;
    });
  }, [events, agencies, selectedEventType, selectedEventIds, selectedMonths, selectedRegionFilters, selectedStateFilters]);

  const formatNumber = (num: number) => num.toLocaleString('es-VE');

  const totalOperaciones = filteredEvents.reduce((acc, ev) => {
    if (ev.cifras) {
      return acc + (ev.cifras.cuentasAbiertas || 0) + (ev.cifras.tdd || 0) + (ev.cifras.reclamos || 0);
    }
    return acc;
  }, 0);

  // Limpieza dinámica bidireccional: si un filtro seleccionado ya no es válido tras cambiar otro, se limpia automáticamente
  useEffect(() => {
    if (selectedEventIds.length > 0) {
      const validEventIds = selectedEventIds.filter(id => availableEvents.some(ev => ev.value === id));
      if (validEventIds.length !== selectedEventIds.length) {
        setSelectedEventIds(validEventIds);
      }
    }
  }, [availableEvents, selectedEventIds]);

  useEffect(() => {
    if (selectedStateFilters.length > 0) {
      const validStates = selectedStateFilters.filter(st => availableStates.some(s => s.value === st));
      if (validStates.length !== selectedStateFilters.length) {
        setSelectedStateFilters(validStates);
      }
    }
  }, [availableStates, selectedStateFilters]);

  useEffect(() => {
    if (selectedRegionFilters.length > 0) {
      const validRegions = selectedRegionFilters.filter(rg => availableRegions.some(r => r.value === rg));
      if (validRegions.length !== selectedRegionFilters.length) {
        setSelectedRegionFilters(validRegions);
      }
    }
  }, [availableRegions, selectedRegionFilters]);

  return (
    <div className="space-y-6 w-full px-4 sm:px-8 mx-auto pb-10">
      {/* Cabecera Principal y Barra de Filtros Dinámicos */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
        {/* Fila 1: Cabecera Unificada (Título, Pestañas, KPIs) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#00205B] leading-tight">Panel Operativo Financiero</h1>
              <p className="text-xs text-gray-500 mt-0.5">Gestión de jornadas, despliegue y control de efectividad</p>
            </div>
            
            {/* Pestañas de Navegación Principal (Integradas arriba) */}
            <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-lg w-fit border border-gray-200 shrink-0">
              <button
                onClick={() => setActiveTab('operativo')}
                className={`px-5 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all duration-200 ${
                  activeTab === 'operativo' 
                    ? 'bg-white text-[#00205B] shadow-sm ring-1 ring-black/5' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                Módulo Operativo
              </button>
              <button
                onClick={() => setActiveTab('financiero')}
                className={`px-5 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all duration-200 ${
                  activeTab === 'financiero' 
                    ? 'bg-white text-[#00205B] shadow-sm ring-1 ring-black/5' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                Módulo Financiero
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 overflow-x-auto pb-1 sm:pb-0">
            
            {/* Filtro Tipo de Evento (Canales) - Movido Arriba */}
            <div className="flex bg-gray-100 p-1 rounded-lg max-w-fit shadow-sm border border-gray-200 h-[38px] items-center shrink-0">
              <button 
                onClick={() => {
                  setSelectedEventType('Todas');
                  setSelectedEventIds([]);
                  setSelectedRegionFilters([]);
                  setSelectedStateFilters([]);
                }}
                className={getButtonClass('Todas', 'bg-white text-gray-800 shadow-sm font-bold text-xs py-1 px-3', 'text-xs py-1 px-3 hover:text-gray-900 hover:bg-gray-200/50')}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Todas</span>
              </button>
              <button 
                onClick={() => {
                  setSelectedEventType('Unidad Móvil');
                  setSelectedEventIds([]);
                  setSelectedRegionFilters([]);
                  setSelectedStateFilters([]);
                }}
                className={getButtonClass('Unidad Móvil', 'bg-[#FE5000] text-white font-bold shadow-sm text-xs py-1 px-3', 'text-xs py-1 px-3 hover:text-[#FE5000] hover:bg-orange-50')}
              >
                <Truck className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Unidad Móvil</span>
              </button>
              <button 
                onClick={() => {
                  setSelectedEventType('Agencia Móvil');
                  setSelectedEventIds([]);
                  setSelectedRegionFilters([]);
                  setSelectedStateFilters([]);
                }}
                className={getButtonClass('Agencia Móvil', 'bg-[#00205B] text-white font-bold shadow-sm text-xs py-1 px-3', 'text-xs py-1 px-3 hover:text-[#00205B] hover:bg-blue-50')}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Agencia Móvil</span>
              </button>
              <button 
                onClick={() => {
                  setSelectedEventType('Red de Agencias');
                  setSelectedEventIds([]);
                  setSelectedRegionFilters([]);
                  setSelectedStateFilters([]);
                }}
                className={getButtonClass('Red de Agencias', 'bg-[#009639] text-white font-bold shadow-sm text-xs py-1 px-3', 'text-xs py-1 px-3 hover:text-[#009639] hover:bg-green-50')}
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Red de Agencias</span>
              </button>
            </div>

            {/* KPIs Compactos Integrados */}
            <div className="flex items-center gap-5 border-l border-gray-200 pl-4 border-r pr-5 mx-1 shrink-0">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 mb-0.5">
                  <BarChart3 className="w-3.5 h-3.5 text-[#FE5000]" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Ops</span>
                </div>
                <span className="text-lg font-black text-[#00205B] leading-none">{formatNumber(totalOperaciones)}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 mb-0.5">
                  <CalendarRange className="w-3.5 h-3.5 text-[#009639]" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Jornadas</span>
                </div>
                <span className="text-lg font-black text-[#00205B] leading-none">{formatNumber(filteredEvents.length)}</span>
              </div>
            </div>

            <span className="text-[10px] sm:text-xs bg-blue-50 text-[#00205B] font-bold px-2.5 py-1 rounded-lg border border-blue-100 whitespace-nowrap shrink-0">
              Mostrando {filteredEvents.length} de {events.length}
            </span>
          </div>
        </div>

        {/* Fila 2: Filtros Compactados */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-3 pt-3 border-t border-gray-100">
          {/* Selectores (ComboBoxes) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 w-full">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex ml-1">Operativo / Evento</label>
              <ComboBox
                multiple
                options={[{ value: 'todos', label: 'Todos los Operativos' }, ...availableEvents]}
                value={selectedEventIds}
                onChange={(val: string[]) => setSelectedEventIds(val)}
                icon={<Filter className="w-3.5 h-3.5 text-gray-500" />}
                emptyText="No hay operativos"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex ml-1">Mes / Periodo</label>
              <ComboBox
                multiple
                options={[{ value: 'todos', label: 'Todos los Meses' }, ...availableMonths]}
                value={selectedMonths}
                onChange={(val: string[]) => {
                  setSelectedMonths(val);
                  if (selectedEventIds.length > 0) setSelectedEventIds([]);
                }}
                icon={<Calendar className="w-3.5 h-3.5 text-gray-500" />}
                emptyText="No hay meses"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex ml-1">Región</label>
              <ComboBox
                multiple
                options={[{ value: 'todos', label: 'Todas las Regiones' }, ...availableRegions]}
                value={selectedRegionFilters}
                onChange={(val: string[]) => {
                  setSelectedRegionFilters(val);
                  setSelectedStateFilters([]);
                  setSelectedEventIds([]);
                }}
                icon={<MapPin className="w-3.5 h-3.5 text-gray-500" />}
                emptyText="No hay regiones"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex ml-1">Estado</label>
              <ComboBox
                multiple
                options={[{ value: 'todos', label: 'Todos los Estados' }, ...availableStates]}
                value={selectedStateFilters}
                onChange={(val: string[]) => {
                  setSelectedStateFilters(val);
                  setSelectedEventIds([]);
                }}
                icon={<MapPin className="w-3.5 h-3.5 text-[#00205B]" />}
                emptyText="No hay estados"
              />
            </div>
          </div>

          {/* Limpiar Filtros */}
          <button
            type="button"
            onClick={() => {
              setSelectedEventType('Todas');
              setSelectedEventIds([]);
              setSelectedMonths([]);
              setSelectedRegionFilters([]);
              setSelectedStateFilters([]);
            }}
            className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-[#FE5000] transition-colors h-[38px] px-3 bg-gray-50 hover:bg-orange-50 rounded-lg border border-transparent hover:border-orange-100 shrink-0 w-full lg:w-auto mt-2 lg:mt-0"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Bloque 1: Tarjetas KPI Consolidadas (Filtradas) */}
      <KpiCards events={filteredEvents} mode={activeTab} />

      {activeTab === 'operativo' && (
        <div className="space-y-6">
          {/* Bloque 2: Georreferenciación & Volumen Operativo (Filtrados) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <VenezuelaMap 
              events={filteredEvents} 
              agencies={agencies}
              selectedState={selectedStateFilters.length > 0 ? selectedStateFilters[0] : 'todos'}
              onStateClick={(stateName) => {
                if (selectedStateFilters.includes(stateName)) {
                   setSelectedStateFilters(selectedStateFilters.filter(s => s !== stateName));
                } else {
                   setSelectedStateFilters([...selectedStateFilters, stateName]);
                }
              }}
            />
            <VolumenChart events={filteredEvents} />
          </div>

          {/* Bloque 4 y 5: Gráficos Inferiores en Paralelo */}
          <div className="pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HistorialMetrics events={filteredEvents} mode="operativo" />
              <RankingEventosOperativoChart events={filteredEvents} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financiero' && (
        <div className="space-y-6 mt-6">
          {/* Bloque 3: Estructura de Costos Globales */}
          <div className="pt-2">
            <h2 className="text-xl font-black text-[#00205B] mb-6">Análisis de Costos Globales</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CostosParticipacionChart events={filteredEvents} />
              <CostosCategoriasChart events={filteredEvents} />
            </div>
          </div>

          {/* Evolución Financiera Temporal */}
          <div className="pt-2">
            <HistorialMetrics events={filteredEvents} mode="financiero" />
          </div>

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

          {/* SECCIÓN: Análisis de Efectividad Operativa */}
          <div className="pt-6 mt-6 border-t border-gray-200">
            <h2 className="text-xl font-black text-[#00205B] mb-6">Análisis de Efectividad Operativa</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <RentabilidadRegionChart events={filteredEvents} agencies={agencies} />
              <RentabilidadTopEventosChart events={filteredEvents} />
            </div>
            <div className="w-full">
              <RentabilidadVsCostosChart events={filteredEvents} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
