"use client";

import React, { useState, useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
// @ts-ignore
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { MapPin, Layers } from 'lucide-react';

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

// Diccionario de asignación de estados a macro-regiones
const STATE_REGION_MAP: Record<string, string> = {
  'distrito capital': 'CAPITAL',
  'miranda': 'CAPITAL',
  'la guaira': 'CAPITAL',
  'vargas': 'CAPITAL',
  
  'carabobo': 'CENTRO OCCIDENTE',
  'lara': 'CENTRO OCCIDENTE',
  'falcon': 'CENTRO OCCIDENTE',
  'yaracuy': 'CENTRO OCCIDENTE',
  'portuguesa': 'CENTRO OCCIDENTE',

  'cojedes': 'ARAGUA - LOS LLANOS',
  'aragua': 'ARAGUA - LOS LLANOS',
  'guarico': 'ARAGUA - LOS LLANOS',
  'apure': 'ARAGUA - LOS LLANOS',

  'zulia': 'OCCIDENTE - ANDES',
  'tachira': 'OCCIDENTE - ANDES',
  'merida': 'OCCIDENTE - ANDES',
  'trujillo': 'OCCIDENTE - ANDES',
  'barinas': 'OCCIDENTE - ANDES',

  'anzoategui': 'ORIENTE',
  'monagas': 'ORIENTE',
  'sucre': 'ORIENTE',
  'nueva esparta': 'ORIENTE',
  'delta amacuro': 'ORIENTE',

  'bolivar': 'GUAYANA',
  'amazonas': 'GUAYANA',
};

// Paleta corporativa BNC estricta: Naranja institucional y escala descendente de azules corporativos
const REGION_PALETTE = [
  '#FE5000', // Región 1 (Líder): Naranja Institucional BNC
  '#00205C', // Región 2: Azul Marino Profundo (rgb(0, 32, 92))
  '#16356F', // Región 3: Azul de ultramar oscuro (rgb(22, 53, 111))
  '#2C4A82', // Región 4: Azul corporativo / Clásico (rgb(44, 74, 130))
  '#426095', // Región 5: Azul acero medio (rgb(66, 96, 149))
  '#5A78AD', // Región 6 / Adicional: Azul acero suave
  '#85A0CE', // Otras regiones
];

export default function VenezuelaMap({ events, agencies = [], selectedState = 'todos', onStateClick }: VenezuelaMapProps) {
  const [viewMode, setViewMode] = useState<'estados' | 'regiones'>('estados');
  const [tooltipContent, setTooltipContent] = useState<{
    name: string;
    regionName?: string;
    events: number;
    cuentas: number;
    rentabilidad: number;
  } | null>(null);

  // Helper para resolver región de cualquier estado
  const getRegionOfState = (stateName: string): string => {
    const norm = normalizeStateName(stateName);
    // 1. Buscar en eventos coincidentes
    const ev = events.find(e => normalizeStateName(e.state || '') === norm && e.region);
    if (ev && ev.region) return ev.region.toUpperCase().replace(/^REGI[OÓ]N\s+/i, '').trim();
    // 2. Buscar en agencias
    const ag = agencies.find(a => normalizeStateName(a.state || '') === norm && a.region);
    if (ag && ag.region) return ag.region.toUpperCase().replace(/^REGI[OÓ]N\s+/i, '').trim();
    // 3. Fallback en diccionario
    return STATE_REGION_MAP[norm] || 'OTRAS REGIONES';
  };

  // 1. Cálculo por Estados
  const stateData = useMemo(() => {
    const statesMap: Record<string, { 
      name: string; 
      region: string;
      jornadas: number; 
      cuentas: number; 
      saldosUsd: number; 
      costosUsd: number 
    }> = {};
    const agCount: Record<string, number> = {};

    agencies.forEach(ag => {
      if (ag.state) {
        const normName = normalizeStateName(ag.state);
        agCount[normName] = (agCount[normName] || 0) + 1;
      }
    });

    events.forEach(ev => {
      const stateName = ev.state; 
      if (!stateName) return;

      const c = ev.cifras;
      const cuentas = c ? (c.cuentasAbiertas || 0) : 0;
      const tasaBcv = ev.gastos?.tasaBcv || 1;
      const saldosBs = c?.saldosCaptadosBs || 0;
      const saldoDivisas = c?.saldoCierreDivisas || 0;
      const saldosUsd = (tasaBcv > 0 ? saldosBs / tasaBcv : 0) + saldoDivisas;

      let costosBs = 0;
      if (ev.gastos) {
        const g = ev.gastos;
        costosBs = (g.alimentacionBs || 0) + (g.hospedajeBs || 0) + (g.transporteBs || 0) +
                   (g.soporteTecnicoBs || 0) + (g.bancaElectronicaBs || 0) + (g.gastosTributariosBs || 0) +
                   (g.conductorAyudanteBs || 0) + (g.mantenimientoLimpiezaBs || 0) + (g.gastoCombustibleBs || 0);
      }
      const costosUsd = tasaBcv > 0 ? costosBs / tasaBcv : (ev.gastos?.totalUsd || 0);

      if (!statesMap[stateName]) {
        statesMap[stateName] = { 
          name: stateName, 
          region: getRegionOfState(stateName),
          jornadas: 0, 
          cuentas: 0, 
          saldosUsd: 0, 
          costosUsd: 0 
        };
      }

      statesMap[stateName].jornadas += 1;
      statesMap[stateName].cuentas += cuentas;
      statesMap[stateName].saldosUsd += saldosUsd;
      statesMap[stateName].costosUsd += costosUsd;
    });

    const fullRanking = Object.values(statesMap)
      .map(s => {
        const margenUsd = s.saldosUsd - s.costosUsd;
        const rentabilidad = s.saldosUsd > 0 ? (margenUsd / s.saldosUsd) * 100 : 0;
        return { ...s, rentabilidad };
      })
      .sort((a, b) => b.cuentas - a.cuentas);

    // Top 5 ajustado al 100% proporcionalmente
    const top5 = fullRanking.slice(0, 5);
    const top5TotalCuentas = top5.reduce((sum, item) => sum + item.cuentas, 0);

    let sumPcts = 0;
    const top5Adjusted = top5.map((item, idx) => {
      if (idx === top5.length - 1 && top5TotalCuentas > 0) {
        const remainingPct = Math.max(0, 100 - sumPcts);
        return { ...item, pct: remainingPct };
      }
      const rawPct = top5TotalCuentas > 0 ? Math.round((item.cuentas / top5TotalCuentas) * 100) : 0;
      sumPcts += rawPct;
      return { ...item, pct: rawPct };
    });

    const activeSet = new Set([
      ...Object.values(statesMap).map(r => normalizeStateName(r.name)),
      ...Object.keys(agCount)
    ]);

    return { 
      ranking: top5Adjusted, 
      fullRanking,
      activeStates: activeSet 
    };
  }, [events, agencies]);

  // 2. Cálculo por Regiones
  const regionData = useMemo(() => {
    const regionMap: Record<string, {
      name: string;
      jornadas: number;
      cuentas: number;
      saldosUsd: number;
      costosUsd: number;
      states: Set<string>;
    }> = {};

    stateData.fullRanking.forEach(s => {
      const reg = s.region;
      if (!regionMap[reg]) {
        regionMap[reg] = {
          name: reg,
          jornadas: 0,
          cuentas: 0,
          saldosUsd: 0,
          costosUsd: 0,
          states: new Set()
        };
      }
      regionMap[reg].jornadas += s.jornadas;
      regionMap[reg].cuentas += s.cuentas;
      regionMap[reg].saldosUsd += s.saldosUsd;
      regionMap[reg].costosUsd += s.costosUsd;
      regionMap[reg].states.add(normalizeStateName(s.name));
    });

    const fullRegionRanking = Object.values(regionMap)
      .map(r => {
        const margenUsd = r.saldosUsd - r.costosUsd;
        const rentabilidad = r.saldosUsd > 0 ? (margenUsd / r.saldosUsd) * 100 : 0;
        return { ...r, rentabilidad };
      })
      .sort((a, b) => b.cuentas - a.cuentas);

    // Top 5 regiones ajustado al 100%
    const top5Regions = fullRegionRanking.slice(0, 5);
    const top5TotalCuentas = top5Regions.reduce((sum, item) => sum + item.cuentas, 0);

    let sumPcts = 0;
    const top5RegionsAdjusted = top5Regions.map((item, idx) => {
      if (idx === top5Regions.length - 1 && top5TotalCuentas > 0) {
        const remainingPct = Math.max(0, 100 - sumPcts);
        return { ...item, pct: remainingPct };
      }
      const rawPct = top5TotalCuentas > 0 ? Math.round((item.cuentas / top5TotalCuentas) * 100) : 0;
      sumPcts += rawPct;
      return { ...item, pct: rawPct };
    });

    return {
      ranking: top5RegionsAdjusted,
      fullRanking: fullRegionRanking
    };
  }, [stateData]);

  const isActiveState = (geoName: string) => {
    return stateData.activeStates.has(normalizeStateName(geoName));
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
    if (rentab >= 35) return 'text-[#009639]';
    if (rentab >= 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <ChartModalWrapper 
      title="Despliegue y Cobertura Regional"
      subtitle="Distribución Geográfica y Análisis de Captación"
    >
      <div className="flex flex-col w-full h-[470px] bg-transparent rounded-2xl overflow-hidden relative">
        
        {/* Barra superior con Toggle de Estados / Regiones */}
        <div className="flex items-center justify-between mb-3 px-1 hide-on-download">
          <span className="text-xs text-gray-500 font-medium">
            {viewMode === 'estados' 
              ? 'Análisis Geográfico por Entidades Federales' 
              : 'Análisis Consolidado por Macro-Regiones'}
          </span>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('estados')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'estados'
                  ? 'bg-white text-[#00205B] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Por Estados
            </button>
            <button
              onClick={() => setViewMode('regiones')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'regiones'
                  ? 'bg-white text-[#00205B] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Por Regiones
            </button>
          </div>
        </div>

        {/* Contenedor Principal: Mapa a la Izquierda y Ranking Top 5 a la Derecha */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
          
          {/* Lado del SVG (Izquierda) */}
          <div className="flex-1 relative flex items-center justify-center">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 2500,
                center: [-66, 7.5]
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
                    const regionName = getRegionOfState(geoName);
                    const isSelected = selectedState !== 'todos' && normalizeStateName(selectedState) === normName;
                    
                    let fillColor = '#E2E8F0'; // Sin operativos
                    let isHighlighted = false;

                    if (viewMode === 'estados') {
                      // Modo Estados: Top 3 destacados en Naranja, otros activos en Azul
                      const topIndex = stateData.ranking.findIndex(r => normalizeStateName(r.name) === normName);
                      if (topIndex >= 0 && topIndex < 3) {
                        fillColor = '#FE5000';
                        isHighlighted = true;
                      } else if (isActive) {
                        fillColor = '#00205B';
                      }
                    } else {
                      // Modo Regiones: Escala cromática corporativa BNC exacta
                      const regionIndex = regionData.ranking.findIndex(r => r.name === regionName);
                      if (regionIndex >= 0) {
                        fillColor = REGION_PALETTE[regionIndex] || '#426095';
                        if (regionIndex === 0) isHighlighted = true;
                      } else if (isActive) {
                        fillColor = '#85A0CE';
                      }
                    }

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
                          if (viewMode === 'estados') {
                            if (isActive) {
                              const sData = stateData.fullRanking.find(r => normalizeStateName(r.name) === normName);
                              setTooltipContent({
                                name: displayName,
                                regionName,
                                cuentas: sData?.cuentas || 0,
                                events: sData?.jornadas || 0,
                                rentabilidad: sData?.rentabilidad || 0
                              });
                            }
                          } else {
                            const rData = regionData.fullRanking.find(r => r.name === regionName);
                            if (rData && rData.cuentas > 0) {
                              setTooltipContent({
                                name: displayName,
                                regionName: `REGIÓN ${regionName}`,
                                cuentas: rData.cuentas,
                                events: rData.jornadas,
                                rentabilidad: rData.rentabilidad
                              });
                            } else if (isActive) {
                              const sData = stateData.fullRanking.find(r => normalizeStateName(r.name) === normName);
                              setTooltipContent({
                                name: displayName,
                                regionName,
                                cuentas: sData?.cuentas || 0,
                                events: sData?.jornadas || 0,
                                rentabilidad: sData?.rentabilidad || 0
                              });
                            }
                          }
                        }}
                        onMouseLeave={() => {
                          setTooltipContent(null);
                        }}
                        style={{
                          default: {
                            fill: isSelected ? '#FE5000' : fillColor,
                            stroke: '#FFFFFF',
                            strokeWidth: 0.6,
                            outline: 'none',
                          },
                          hover: {
                            fill: isHighlighted ? '#E04700' : isActive ? '#3B82F6' : '#CBD5E1',
                            stroke: '#FFFFFF',
                            strokeWidth: 1.2,
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
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#00205C]/95 backdrop-blur-sm text-white text-xs px-4 py-3 rounded-xl shadow-xl pointer-events-none z-10 flex flex-col gap-1.5 items-center min-w-[170px] border border-blue-900">
                <span className="font-bold text-sm text-[#FE5000]">{tooltipContent.name}</span>
                {tooltipContent.regionName && (
                  <span className="text-[10px] text-gray-300 font-semibold uppercase">{tooltipContent.regionName}</span>
                )}
                <div className="w-full border-t border-blue-800 my-0.5"></div>
                <div className="flex justify-between w-full text-gray-300">
                  <span>Cuentas:</span>
                  <span className="font-bold text-white">{tooltipContent.cuentas.toLocaleString('de-DE')}</span>
                </div>
                <div className="flex justify-between w-full text-gray-300">
                  <span>Jornadas:</span>
                  <span className="font-bold text-white">{tooltipContent.events}</span>
                </div>
                <div className="flex justify-between w-full text-gray-300">
                  <span>Rentabilidad:</span>
                  <span className={`font-bold ${getTooltipColor(tooltipContent.rentabilidad)}`}>
                    {tooltipContent.rentabilidad.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {/* Leyenda Dinámica del Mapa */}
            <div className="absolute bottom-0 left-0 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-gray-200 text-[10px] space-y-1.5 pointer-events-none max-w-[175px]">
              <h4 className="font-bold text-gray-700 mb-1">
                {viewMode === 'estados' ? 'Mapa de Captación' : 'Leyenda de Regiones'}
              </h4>
              {viewMode === 'estados' ? (
                <>
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
                </>
              ) : (
                <>
                  {regionData.ranking.slice(0, 5).map((reg, idx) => (
                    <div key={reg.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded shadow-xs shrink-0" 
                        style={{ backgroundColor: REGION_PALETTE[idx] || '#426095' }}
                      />
                      <span className="text-gray-700 font-medium truncate">{reg.name}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#E2E8F0] shrink-0"></div>
                    <span className="text-gray-500">Sin Operativos</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Panel lateral derecho (Lista Top 5 Ajustada al 100% con Badges Leyenda) */}
          <div className="w-full lg:w-[290px] h-full flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#00205B] uppercase tracking-wider">
                {viewMode === 'estados' ? 'Top 5 Estados Activos' : 'Top Regiones Activas'}
              </h3>
              <span className="text-[10px] font-extrabold bg-[#00205C] text-white px-2 py-0.5 rounded-full">
                100%
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
              {viewMode === 'estados' ? (
                stateData.ranking.length > 0 ? stateData.ranking.map((item, idx) => (
                  <div
                    key={item.name}
                    className={`p-2.5 rounded-xl border shadow-sm flex items-center justify-between transition-all bg-white hover:border-[#00205B] cursor-pointer ${selectedState === item.name ? 'border-[#FE5000] ring-1 ring-[#FE5000]' : 'border-gray-100'}`}
                    onClick={() => onStateClick && onStateClick(item.name)}
                  >
                    <div className="flex items-center gap-2.5">
                      <span 
                        className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shadow-sm ${
                          idx < 3 ? 'bg-[#FE5000] text-white' : 'bg-[#00205B] text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs leading-tight text-gray-800">{item.name}</h4>
                        <span className="text-[9px] text-gray-500">{item.jornadas} Jornadas</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-extrabold text-xs text-[#00205B]">
                        {item.cuentas.toLocaleString('de-DE')} <span className="text-[9px] font-normal text-gray-400">Ctas</span>
                      </span>
                      <span className="font-bold text-[10px] text-[#FE5000]">
                        {item.pct}%
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                    <span className="text-sm">No hay estados activos para este filtro</span>
                  </div>
                )
              ) : (
                regionData.ranking.length > 0 ? regionData.ranking.map((item, idx) => {
                  const regionColor = REGION_PALETTE[idx] || '#426095';
                  return (
                    <div
                      key={item.name}
                      className="p-2.5 rounded-xl border shadow-sm flex items-center justify-between transition-all bg-white hover:border-[#00205B] border-gray-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shadow-sm text-white transition-transform hover:scale-105"
                          style={{ backgroundColor: regionColor }}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs leading-tight text-gray-800">{item.name}</h4>
                          <span className="text-[9px] text-gray-500">{item.jornadas} Jornadas</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="font-extrabold text-xs text-[#00205B]">
                          {item.cuentas.toLocaleString('de-DE')} <span className="text-[9px] font-normal text-gray-400">Ctas</span>
                        </span>
                        <span 
                          className="font-bold text-[10px]"
                          style={{ color: idx === 0 ? '#FE5000' : '#00205C' }}
                        >
                          {item.pct}%
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                    <span className="text-sm">No hay regiones activas para este filtro</span>
                  </div>
                )
              )}
            </div>
          </div>

        </div>
      </div>
    </ChartModalWrapper>
  );
}
