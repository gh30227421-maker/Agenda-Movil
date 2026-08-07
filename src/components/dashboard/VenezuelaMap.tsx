"use client";

import React, { useState, useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
// @ts-ignore
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

// TopoJSON de Venezuela oficial
const geoUrl = '/venezuela.json';

interface VenezuelaMapProps {
  events: any[];
  agencies?: any[];
  selectedState?: string;
  onStateClick?: (stateName: string) => void;
}

// Función auxiliar para normalizar nombres
const normalizeStateName = (name: string) => {
  if (!name) return '';
  const normalized = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace('estado ', '')
    .trim();
  if (normalized === 'capital' || normalized === 'distrito capital') return 'distrito capital';
  if (normalized === 'la guaira' || normalized === 'vargas') return 'la guaira';
  return normalized;
};

export default function VenezuelaMap({ events, agencies = [], selectedState = 'todos', onStateClick }: VenezuelaMapProps) {
  const [tooltipContent, setTooltipContent] = useState<{name: string, events: number, cuentas: number, rentabilidad: number} | null>(null);

  const { activeStates, ranking } = useMemo(() => {
    let totalCuentas = 0;
    const statesMap: Record<string, { name: string; jornadas: number; cuentas: number, saldosUsd: number, costosUsd: number }> = {};
    const agCount: Record<string, number> = {};

    // Count agencies
    agencies.forEach(ag => {
      if (ag.state) {
        const normName = normalizeStateName(ag.state);
        agCount[normName] = (agCount[normName] || 0) + 1;
      }
    });

    events.forEach(ev => {
      const stateName = ev.state; 
      if (!stateName) return;

      const normName = normalizeStateName(stateName);

      const c = ev.cifras;
      const cuentas = c ? (c.cuentasAbiertas || 0) : 0;

      const tasaBcv = ev.gastos?.tasaBcv || 1;
      const saldosBs = c?.saldosCaptadosBs || 0;
      const saldoDivisas = c?.saldoCierreDivisas || 0;
      const saldosUsd = (tasaBcv > 0 ? saldosBs / tasaBcv : 0) + saldoDivisas;

      const tieneGastos = !!ev.gastos;
      const costosUsdBase = ev.gastos?.totalUsd || 0;
      
      let costosBs = 0;
      if (tieneGastos) {
        const g = ev.gastos!;
        costosBs = g.alimentacionBs + g.hospedajeBs + g.transporteBs +
                   g.soporteTecnicoBs + g.bancaElectronicaBs + g.gastosTributariosBs +
                   g.conductorAyudanteBs + g.mantenimientoLimpiezaBs + (g.gastoCombustibleBs || 0);
      } else if (costosUsdBase > 0 && tasaBcv > 0) {
        costosBs = costosUsdBase * tasaBcv;
      }
      
      const costosUsd = tasaBcv > 0 ? costosBs / tasaBcv : 0;

      if (!statesMap[stateName]) {
        statesMap[stateName] = { name: stateName, jornadas: 0, cuentas: 0, saldosUsd: 0, costosUsd: 0 };
      }

      statesMap[stateName].jornadas += 1;
      statesMap[stateName].cuentas += cuentas;
      statesMap[stateName].saldosUsd += saldosUsd;
      statesMap[stateName].costosUsd += costosUsd;
      totalCuentas += cuentas;
    });

    const rank = Object.values(statesMap)
      .map(s => {
        const margenUsd = s.saldosUsd - s.costosUsd;
        const rentabilidad = s.saldosUsd > 0 ? (margenUsd / s.saldosUsd) * 100 : 0;
        return {
          ...s,
          rentabilidad,
          pct: totalCuentas > 0 ? Math.round((s.cuentas / totalCuentas) * 100) : 0
        };
      })
      .sort((a, b) => b.cuentas - a.cuentas);

    const active = new Set([
      ...Object.values(statesMap).map(r => normalizeStateName(r.name)),
      ...Object.keys(agCount)
    ]);
    
    return { activeStates: active, ranking: rank };
  }, [events, agencies]);

  const isActiveState = (geoName: string) => {
    return activeStates.has(normalizeStateName(geoName));
  };
  
  const getDisplayStateName = (geoName: string) => {
    const norm = normalizeStateName(geoName);
    const fromEvents = events.find(e => normalizeStateName(e.state || '') === norm);
    if (fromEvents) return fromEvents.state;
    const fromAgencies = agencies.find(a => normalizeStateName(a.state || '') === norm);
    if (fromAgencies) return fromAgencies.state;
    return geoName;
  };

  const getTooltipColor = (rentab: number) => {
    if (rentab >= 35) return 'text-[#009639]'; // Rentable
    if (rentab >= 20) return 'text-yellow-400'; // Al Límite
    return 'text-red-400'; // No Rentable
  };

  return (
    <ChartModalWrapper 
      title="Despliegue y Cobertura Regional"
      subtitle="Distribución Geográfica y Análisis de Captación"
    >
      <div className="flex flex-col lg:flex-row gap-6 w-full h-[450px] bg-transparent rounded-2xl overflow-hidden relative">
        
        {/* Lado del SVG (Izquierda) */}
        <div className="flex-1 relative flex items-center justify-center">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 2500,
              center: [-66, 7.5] // Centrado ajustable
            }}
            className="w-full h-full max-h-[400px]"
          >
            <Geographies geography={geoUrl}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const geoName = geo.properties.NAME_1 || geo.properties.name || geo.properties.hc_key;
                  const normName = normalizeStateName(geoName);
                  const isActive = isActiveState(geoName);
                  const displayName = getDisplayStateName(geoName);
                  const isSelected = selectedState !== 'todos' && normalizeStateName(selectedState) === normName;
                  
                  // Heatmap Top 3 Logic
                  const isTop3 = ranking.slice(0, 3).some(r => normalizeStateName(r.name) === normName);
                  
                  // Determinar color base
                  let fillColor = '#E2E8F0'; // Inactivo
                  if (isActive) fillColor = '#00205B'; // Activo
                  if (isTop3) fillColor = '#FE5000'; // Top 3 Orange

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        if (onStateClick && isActive) {
                          onStateClick(displayName);
                        }
                      }}
                      onMouseEnter={() => {
                        if (isActive) {
                          const stateData = ranking.find(r => normalizeStateName(r.name) === normName);
                          setTooltipContent({
                            name: displayName,
                            cuentas: stateData?.cuentas || 0,
                            events: stateData?.jornadas || 0,
                            rentabilidad: stateData?.rentabilidad || 0
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        setTooltipContent(null);
                      }}
                      style={{
                        default: {
                          fill: isSelected ? '#1E3A8A' : fillColor,
                          stroke: '#FFFFFF',
                          strokeWidth: 0.5,
                          outline: 'none',
                        },
                        hover: {
                          fill: isTop3 ? '#e04700' : isActive ? '#3B82F6' : '#CBD5E1',
                          stroke: '#FFFFFF',
                          strokeWidth: 1,
                          outline: 'none',
                          cursor: isActive ? 'pointer' : 'default'
                        },
                        pressed: {
                          fill: '#FE5000',
                          outline: 'none',
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
          
          {/* Tooltip Dinámico */}
          {tooltipContent && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm text-white text-xs px-4 py-3 rounded-xl shadow-xl pointer-events-none z-10 flex flex-col gap-1.5 items-center min-w-[150px] border border-gray-700">
              <span className="font-bold text-sm text-[#FE5000] mb-0.5">{tooltipContent.name}</span>
              <div className="flex justify-between w-full text-gray-300">
                <span>Cuentas:</span>
                <span className="font-bold text-white">{tooltipContent.cuentas}</span>
              </div>
              <div className="flex justify-between w-full text-gray-300">
                <span>Jornadas:</span>
                <span className="font-bold text-white">{tooltipContent.events}</span>
              </div>
              <div className="w-full border-t border-gray-700 my-0.5"></div>
              <div className="flex justify-between w-full text-gray-300">
                <span>Rentabilidad:</span>
                <span className={`font-bold ${getTooltipColor(tooltipContent.rentabilidad)}`}>
                  {tooltipContent.rentabilidad.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Leyenda */}
          <div className="absolute bottom-0 left-0 bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-gray-200 text-[10px] space-y-2 pointer-events-none">
            <h4 className="font-bold text-gray-700 mb-1">Mapa de Captación</h4>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#FE5000]"></div>
              <span className="text-gray-600">Top 3 Estados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#00205B]"></div>
              <span className="text-gray-600">Otros Activos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#E2E8F0]"></div>
              <span className="text-gray-600">Sin Operativos</span>
            </div>
          </div>
        </div>

        {/* Panel lateral derecho (Lista) */}
        <div className="w-full lg:w-[280px] h-full flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-xs font-bold text-[#00205B] uppercase tracking-wider">Top Estados Activos</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {ranking.length > 0 ? ranking.map((item, idx) => (
              <div
                key={item.name}
                className={`p-3 rounded-xl border shadow-sm flex items-center justify-between transition-all bg-white hover:border-[#00205B] cursor-pointer ${selectedState === item.name ? 'border-[#FE5000] ring-1 ring-[#FE5000]' : 'border-gray-100'}`}
                onClick={() => onStateClick && onStateClick(item.name)}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shadow-sm ${idx < 3 ? 'bg-[#FE5000] text-white' : 'bg-[#F3F4F6] text-[#00205B]'}`}>
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs leading-tight text-gray-800">{item.name}</h4>
                    <span className="text-[9px] text-gray-500">{item.jornadas} Jornadas</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="font-extrabold text-sm text-[#00205B]">{item.cuentas.toLocaleString('de-DE')} <span className="text-[9px] font-normal text-gray-400">Ctas</span></span>
                  <span className="font-bold text-[10px] text-[#FE5000]">
                    {item.pct}%
                  </span>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                <span className="text-sm">No hay estados activos para este filtro</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </ChartModalWrapper>
  );
}
