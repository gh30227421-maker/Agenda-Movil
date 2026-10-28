"use client";

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import ChartModalWrapper from './ChartModalWrapper';
import { DollarSign, Receipt, CalendarDays, AlertCircle, CalendarRange } from 'lucide-react';

interface GastoMensualJornadaChartProps {
  events: any[];
  selectedMonths?: string[];
}

// Expande códigos de periodo como YYYY-Q1 o YYYY-H1 a meses individuales YYYY-MM
function resolveSelectedMonths(periods?: string[]): string[] {
  if (!periods || periods.length === 0 || periods.includes('todos')) {
    return [];
  }
  const resolved = new Set<string>();
  periods.forEach(period => {
    if (!period || period === 'todos') return;
    const parts = period.split('-');
    if (parts.length < 2) return;
    const [year, code] = parts;
    if (code === 'H1') {
      ['01', '02', '03', '04', '05', '06'].forEach(m => resolved.add(`${year}-${m}`));
    } else if (code === 'H2') {
      ['07', '08', '09', '10', '11', '12'].forEach(m => resolved.add(`${year}-${m}`));
    } else if (code === 'Q1') {
      ['01', '02', '03'].forEach(m => resolved.add(`${year}-${m}`));
    } else if (code === 'Q2') {
      ['04', '05', '06'].forEach(m => resolved.add(`${year}-${m}`));
    } else if (code === 'Q3') {
      ['07', '08', '09'].forEach(m => resolved.add(`${year}-${m}`));
    } else if (code === 'Q4') {
      ['10', '11', '12'].forEach(m => resolved.add(`${year}-${m}`));
    } else {
      resolved.add(period);
    }
  });
  return Array.from(resolved);
}

export default function GastoMensualJornadaChart({ events, selectedMonths = [] }: GastoMensualJornadaChartProps) {
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Determinar meses resueltos del filtro
  const resolvedMonths = useMemo(() => resolveSelectedMonths(selectedMonths), [selectedMonths]);
  const isFilterActive = Boolean(selectedMonths && selectedMonths.length > 0 && !selectedMonths.includes('todos'));
  const selectedMonthsCount = isFilterActive ? resolvedMonths.length : 0;

  // Generar etiquetas formateadas de los meses seleccionados
  const selectedMonthsLabels = useMemo(() => {
    return resolvedMonths.sort().map(rm => {
      const [year, month] = rm.split('-');
      const mIdx = parseInt(month, 10) - 1;
      return `${monthNames[mIdx] || month} ${year?.slice(2) || ''}`;
    });
  }, [resolvedMonths]);

  // Agrupar datos por mes
  const { 
    chartData, 
    totalGeneralUsd, 
    totalJornadasGeneral, 
    promedioJornadaGeneral, 
    promedioMensualGeneral,
    distinctHistoricalMonthsCount
  } = useMemo(() => {
    const monthlyMap: Record<string, {
      rawMonth: string;
      mesLabel: string;
      gastoTotal: number;
      jornadas: number;
    }> = {};

    let totalGasto = 0;
    let totalJornadas = 0;

    // Si hay un filtro explícito de meses, inicializamos cada mes filtrado para garantizar su presencia ordenada
    if (resolvedMonths.length > 0) {
      resolvedMonths.sort().forEach(rawMonth => {
        const [year, month] = rawMonth.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const mesLabel = `${monthNames[monthIndex] || month} ${year.slice(2)}`;
        monthlyMap[rawMonth] = {
          rawMonth,
          mesLabel,
          gastoTotal: 0,
          jornadas: 0,
        };
      });
    }

    // Contabilizar eventos
    events.forEach(ev => {
      // Excluir Red de Agencias ya que no incurre en viáticos/gastos en este módulo
      if (ev.type === 'Red de Agencias') return;
      if (!ev.startDate) return;

      const rawMonth = ev.startDate.substring(0, 7); // YYYY-MM

      // Si hay filtro explícito y este evento no pertenece a los meses seleccionados, ignorar
      if (resolvedMonths.length > 0 && !monthlyMap[rawMonth]) return;

      if (!monthlyMap[rawMonth]) {
        const [year, month] = rawMonth.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const mesLabel = `${monthNames[monthIndex] || month} ${year.slice(2)}`;
        monthlyMap[rawMonth] = {
          rawMonth,
          mesLabel,
          gastoTotal: 0,
          jornadas: 0,
        };
      }

      const gastoEv = ev.gastos?.totalUsd || 0;
      monthlyMap[rawMonth].gastoTotal += gastoEv;
      monthlyMap[rawMonth].jornadas += 1;

      totalGasto += gastoEv;
      totalJornadas += 1;
    });

    const sortedMonths = Object.values(monthlyMap)
      .sort((a, b) => a.rawMonth.localeCompare(b.rawMonth))
      .map(item => ({
        ...item,
        gastoTotal: Math.round(item.gastoTotal * 100) / 100,
        promedioJornada: item.jornadas > 0 ? Math.round((item.gastoTotal / item.jornadas) * 100) / 100 : 0,
      }));

    // Cálculo del promedio mensual:
    // Si el usuario filtró meses específicos (ej. 3 meses), el promedio mensual es el gasto total dividido entre esos meses
    let promMensual = 0;
    if (resolvedMonths.length > 0) {
      promMensual = sortedMonths.length > 0 ? totalGasto / sortedMonths.length : 0;
    } else {
      const currentMonthStr = new Date().toISOString().substring(0, 7);
      const closedMonths = sortedMonths.filter(m => m.rawMonth < currentMonthStr);
      const mesesParaPromedio = closedMonths.length > 0 ? closedMonths.length : sortedMonths.length;
      const gastoMesesCerrados = closedMonths.reduce((acc, m) => acc + m.gastoTotal, 0);
      const gastoBase = closedMonths.length > 0 && gastoMesesCerrados > 0 ? gastoMesesCerrados : totalGasto;
      promMensual = mesesParaPromedio > 0 ? gastoBase / mesesParaPromedio : 0;
    }

    const promJornada = totalJornadas > 0 ? totalGasto / totalJornadas : 0;

    return {
      chartData: sortedMonths,
      totalGeneralUsd: totalGasto,
      totalJornadasGeneral: totalJornadas,
      promedioJornadaGeneral: promJornada,
      promedioMensualGeneral: promMensual,
      distinctHistoricalMonthsCount: sortedMonths.length,
    };
  }, [events, resolvedMonths]);

  // Condición de activación exigida por el usuario:
  // "que unicamente se active si selecciona mas de 2 meses en el filtro"
  const hasEnoughMonths = isFilterActive 
    ? selectedMonthsCount > 2 
    : distinctHistoricalMonthsCount > 2;

  const dynamicSubtitle = isFilterActive && hasEnoughMonths
    ? `Evolución comparativa de ${chartData.length} meses filtrados (${selectedMonthsLabels.join(', ')})`
    : "Comparativa de gasto mensual ejecutado, promedio mensual y costo medio por jornada";

  return (
    <ChartModalWrapper
      title="Evolución de Promedio Mensual y por Jornada"
      subtitle={dynamicSubtitle}
    >
      {(isExpanded: boolean) => {
        // Componente de Tick Personalizado para el Eje X:
        // Muestra el nombre del mes Y debajo el monto del Gasto del Mes en azul BNC.
        // Esto elimina por completo la necesidad de colocar etiquetas flotantes sobre barras cortas,
        // garantizando ZERO colisión o solapamiento con los puntos y pastillas de la curva naranja.
        const CustomXAxisTick = (props: any) => {
          const { x, y, payload } = props;
          const item = chartData.find(d => d.mesLabel === payload.value);
          if (!item) {
            return (
              <text x={x} y={y + 12} textAnchor="middle" fontSize={11} fill="#4B5563" fontWeight="600">
                {payload.value}
              </text>
            );
          }

          const gastoFormatted = `$${Math.round(item.gastoTotal).toLocaleString('en-US')}`;

          return (
            <g transform={`translate(${x},${y})`}>
              <text 
                x={0} 
                y={12} 
                textAnchor="middle" 
                fontSize={isExpanded ? 12 : 11} 
                fill="#4B5563" 
                fontWeight="600"
              >
                {item.mesLabel}
              </text>
              <text 
                x={0} 
                y={isExpanded ? 27 : 24} 
                textAnchor="middle" 
                fontSize={isExpanded ? 11 : 9.5} 
                fill="#00205B" 
                fontWeight="bold"
              >
                {gastoFormatted}
              </text>
            </g>
          );
        };

        return (
          <div className={`flex flex-col w-full ${isExpanded ? 'h-full flex-1' : 'h-full'}`}>
            {!hasEnoughMonths ? (
              /* Estado Inactivo / Standby elegante cuando se seleccionan 2 o menos meses en el filtro */
              <div className={`flex flex-col items-center justify-center w-full ${isExpanded ? 'h-full flex-1 py-12' : 'h-72 sm:h-80 min-h-[290px] py-4'}`}>
                <div className="w-full max-w-md bg-gradient-to-b from-slate-50/90 to-blue-50/40 rounded-2xl border border-dashed border-blue-200/90 p-5 sm:p-6 flex flex-col items-center text-center shadow-xs">
                  {/* Icono con badge */}
                  <div className="relative mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/90 flex items-center justify-center text-[#FE5000] shadow-xs">
                      <CalendarRange className="w-6 h-6 text-[#FE5000]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00205B] text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
                      !
                    </div>
                  </div>

                  {/* Badge de estado */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 mb-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Filtro Temporal Inactivo
                  </div>

                  {/* Título y explicación */}
                  <h3 className="text-sm sm:text-base font-bold text-[#00205B] mb-1">
                    Selecciona más de 2 meses para activar
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 max-w-xs">
                    La gráfica de evolución temporal requiere un rango de al menos <span className="font-semibold text-gray-700">3 meses seleccionados</span> en el filtro para calcular promedios y trazar curvas de tendencia.
                  </p>

                  {/* Indicador interactivo de progreso */}
                  <div className="w-full bg-white/95 rounded-xl p-3 border border-gray-200/80 shadow-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-gray-500">Meses seleccionados:</span>
                      <span className="font-black text-[#00205B]">
                        {selectedMonthsCount} de 3 mínimos{' '}
                        <span className="text-[10px] font-bold text-[#FE5000]">
                          ({selectedMonthsCount < 3 ? `Faltan ${3 - selectedMonthsCount}` : 'Listo'})
                        </span>
                      </span>
                    </div>

                    {/* Barras de paso (Step indicator) */}
                    <div className="grid grid-cols-3 gap-1.5 w-full">
                      {[1, 2, 3].map((step) => {
                        const isFilled = selectedMonthsCount >= step;
                        return (
                          <div 
                            key={step} 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isFilled ? 'bg-[#FE5000]' : 'bg-gray-200'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {selectedMonthsLabels.length > 0 && (
                      <div className="text-[10px] text-gray-500 pt-0.5 border-t border-gray-100 flex items-center justify-center gap-1 truncate">
                        <span className="text-gray-400">Actual:</span>
                        <span className="font-bold text-[#00205B]">{selectedMonthsLabels.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-gray-400 mt-3">
                    Tip: Selecciona 3 o más meses en el selector <span className="font-semibold text-gray-600">"Mes / Periodo"</span> superior.
                  </p>
                </div>
              </div>
            ) : (
              /* Vista Activa con Métricas y Gráfico Recharts */
              <>
                {/* Métricas Resumen Rápidas con montos en Azul Corporativo BNC */}
                <div className={`grid grid-cols-3 gap-2 sm:gap-4 ${isExpanded ? 'mb-5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100' : 'mb-3 pb-3 border-b border-gray-100'} shrink-0`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#00205B] shrink-0 border border-blue-100">
                      <CalendarDays className="w-4 h-4 text-[#00205B]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Prom. Mensual</p>
                      <p className="text-sm sm:text-base font-bold text-[#00205B]">
                        ${promedioMensualGeneral.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#00205B] shrink-0 border border-blue-100">
                      <Receipt className="w-4 h-4 text-[#00205B]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Prom. por Jornada</p>
                      <p className="text-sm sm:text-base font-bold text-[#00205B]">
                        ${promedioJornadaGeneral.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#00205B] shrink-0 border border-blue-100">
                      <DollarSign className="w-4 h-4 text-[#00205B]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Ejecutado</p>
                      <p className="text-sm sm:text-base font-bold text-[#00205B]">
                        ${totalGeneralUsd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        <span className="text-[10px] font-normal text-gray-400 ml-1">({totalJornadasGeneral} ops)</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gráfico Combinado Recharts con proporciones optimizadas para evitar que se vea estirado */}
                <div className={`w-full flex flex-col items-center justify-center ${isExpanded ? 'flex-1 py-1' : 'h-72 sm:h-80 min-h-[290px]'}`}>
                  <div className={`w-full ${isExpanded ? (chartData.length <= 4 ? 'max-w-3xl h-[420px]' : chartData.length <= 6 ? 'max-w-4xl h-[450px]' : 'max-w-5xl h-[480px]') : 'h-full'}`}>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart 
                          data={chartData} 
                          margin={{ 
                            top: isExpanded ? 36 : 28, 
                            right: isExpanded ? 35 : 15, 
                            left: isExpanded ? 15 : 0, 
                            bottom: isExpanded ? 22 : 14 
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          {/* Eje X con tick dual: Nombre del Mes + Monto del Gasto debajo */}
                          <XAxis 
                            dataKey="mesLabel" 
                            height={isExpanded ? 48 : 42}
                            tick={<CustomXAxisTick />}
                            interval={0}
                          />
                          {/* Ejes Y ocultos para evitar confusión de escalas en ambos lados (los montos ya se leen claros en el eje X y en las pastillas naranjas) */}
                          <YAxis 
                            yAxisId="left"
                            hide={true}
                            domain={[0, (dataMax: number) => Math.max(1000, Math.ceil(dataMax * 1.35))]}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            hide={true}
                            domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax * 1.25))]}
                          />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-[#00205B] text-white p-3 rounded-xl shadow-lg border border-blue-900 text-xs space-y-1.5 min-w-[200px]">
                                    <p className="font-bold text-blue-200 border-b border-blue-800/60 pb-1 text-sm">{label}</p>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-300">Gasto del Mes:</span>
                                      <span className="font-bold text-white">${data.gastoTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-300">Jornadas:</span>
                                      <span className="font-bold text-emerald-400">{data.jornadas} jornadas</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 border-t border-blue-800/60">
                                      <span className="text-orange-300 font-semibold">Promedio / Jornada:</span>
                                      <span className="font-black text-[#FE5000] text-sm">${data.promedioJornada.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 border-t border-blue-800/40 text-[10px]">
                                      <span className="text-blue-300">Prom. Mensual Global:</span>
                                      <span className="font-bold text-blue-100">${promedioMensualGeneral.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            wrapperStyle={{ paddingBottom: isExpanded ? '18px' : '12px', fontSize: isExpanded ? '13px' : '12px' }} 
                          />

                          {/* Barras de Gasto del Mes: Limpias y sólidas sin texto duplicado ya que el monto se muestra nítido en el eje X justo debajo */}
                          <Bar 
                            yAxisId="left" 
                            dataKey="gastoTotal" 
                            name="Gasto del Mes ($)" 
                            fill="#00205B" 
                            radius={[4, 4, 0, 0]} 
                            barSize={isExpanded ? (chartData.length <= 3 ? 56 : chartData.length <= 5 ? 44 : 34) : (chartData.length <= 3 ? 42 : chartData.length <= 5 ? 32 : 24)} 
                          />

                          {/* Línea de Promedio por Jornada con Badges flotantes en blanco y naranja */}
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="promedioJornada" 
                            name="Promedio / Jornada ($)" 
                            stroke="#FE5000" 
                            strokeWidth={isExpanded ? 3.5 : 3} 
                            dot={{ r: isExpanded ? 5 : 4, fill: '#FE5000', stroke: '#FFFFFF', strokeWidth: 2 }}
                            activeDot={{ r: isExpanded ? 7 : 6, fill: '#FE5000' }}
                          >
                            <LabelList
                              dataKey="promedioJornada"
                              content={(props: any) => {
                                const { x, y, value } = props;
                                if (value === undefined || value === null || value <= 0) return null;
                                const text = `$${Math.round(value).toLocaleString('en-US')}`;
                                const pillWidth = Math.max(isExpanded ? 46 : 38, text.length * (isExpanded ? 7.5 : 6.8) + 10);
                                const pillHeight = isExpanded ? 18 : 15;
                                const pillY = y - pillHeight - 8;
                                return (
                                  <g>
                                    <rect
                                      x={x - pillWidth / 2}
                                      y={pillY}
                                      width={pillWidth}
                                      height={pillHeight}
                                      rx={4}
                                      fill="#FFFFFF"
                                      stroke="#FE5000"
                                      strokeWidth={1.5}
                                      style={{ filter: 'drop-shadow(0 1px 2px rgba(254,80,0,0.18))' }}
                                    />
                                    <text
                                      x={x}
                                      y={pillY + pillHeight / 2}
                                      fill="#FE5000"
                                      fontSize={isExpanded ? 11 : 9.5}
                                      fontWeight="bold"
                                      textAnchor="middle"
                                      dominantBaseline="central"
                                    >
                                      {text}
                                    </text>
                                  </g>
                                );
                              }}
                            />
                          </Line>
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        Sin datos registrados para los meses seleccionados
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      }}
    </ChartModalWrapper>
  );
}
