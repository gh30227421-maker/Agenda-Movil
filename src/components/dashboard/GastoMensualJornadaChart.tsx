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
import { DollarSign, Receipt, CalendarDays } from 'lucide-react';

interface GastoMensualJornadaChartProps {
  events: any[];
}

export default function GastoMensualJornadaChart({ events }: GastoMensualJornadaChartProps) {
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Agrupar datos por mes
  const { chartData, totalGeneralUsd, totalJornadasGeneral, promedioJornadaGeneral, promedioMensualGeneral } = useMemo(() => {
    const monthlyMap: Record<string, {
      rawMonth: string;
      mesLabel: string;
      gastoTotal: number;
      jornadas: number;
    }> = {};

    let totalGasto = 0;
    let totalJornadas = 0;

    events.forEach(ev => {
      // Excluir Red de Agencias ya que no incurre en viáticos/gastos en este módulo
      if (ev.type === 'Red de Agencias') return;
      if (!ev.startDate) return;

      const rawMonth = ev.startDate.substring(0, 7); // YYYY-MM
      const [year, month] = rawMonth.split('-');
      const monthIndex = parseInt(month, 10) - 1;
      const mesLabel = `${monthNames[monthIndex] || month} ${year.slice(2)}`;

      if (!monthlyMap[rawMonth]) {
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

    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const closedMonths = sortedMonths.filter(m => m.rawMonth < currentMonthStr);
    const mesesParaPromedio = closedMonths.length > 0 ? closedMonths.length : sortedMonths.length;
    const gastoMesesCerrados = closedMonths.reduce((acc, m) => acc + m.gastoTotal, 0);
    const gastoBase = closedMonths.length > 0 && gastoMesesCerrados > 0 ? gastoMesesCerrados : totalGasto;
    const promJornada = totalJornadas > 0 ? totalGasto / totalJornadas : 0;
    const promMensual = mesesParaPromedio > 0 ? gastoBase / mesesParaPromedio : 0;

    return {
      chartData: sortedMonths,
      totalGeneralUsd: totalGasto,
      totalJornadasGeneral: totalJornadas,
      promedioJornadaGeneral: promJornada,
      promedioMensualGeneral: promMensual,
    };
  }, [events]);

  return (
    <ChartModalWrapper
      title="Evolución de Promedio Mensual y por Jornada"
      subtitle="Comparativa de gasto mensual ejecutado, promedio mensual y costo medio por jornada"
    >
      {(isExpanded: boolean) => (
        <div className={`flex flex-col w-full ${isExpanded ? 'h-full flex-1' : 'h-full'}`}>
          {/* Métricas Resumen Rápidas con montos en Azul Corporativo BNC */}
          <div className={`grid grid-cols-3 gap-2 sm:gap-4 ${isExpanded ? 'mb-5 pb-4' : 'mb-3 pb-3'} border-b border-gray-100 shrink-0`}>
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

          {/* Gráfico Combinado Recharts con aprovechamiento completo de altura */}
          <div className={`w-full ${isExpanded ? 'flex-1 min-h-[460px] lg:min-h-[520px]' : 'h-72 sm:h-80 min-h-[290px]'}`}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={chartData} 
                  margin={{ 
                    top: isExpanded ? 32 : 24, 
                    right: isExpanded ? 35 : 15, 
                    left: isExpanded ? 15 : 0, 
                    bottom: isExpanded ? 15 : 5 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="mesLabel" 
                    tick={{ fontSize: isExpanded ? 13 : 11, fill: '#4B5563', fontWeight: 600 }} 
                  />
                  <YAxis 
                    yAxisId="left"
                    domain={[0, (dataMax: number) => Math.max(1000, Math.ceil(dataMax * 1.18))]}
                    tickFormatter={(val) => `$${Math.round(val).toLocaleString('en-US')}`} 
                    tick={{ fontSize: isExpanded ? 12 : 11, fill: '#6B7280' }} 
                    width={isExpanded ? 68 : 55}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax * 1.18))]}
                    tickFormatter={(val) => `$${Math.round(val).toLocaleString('en-US')}`} 
                    tick={{ fontSize: isExpanded ? 12 : 11, fill: '#6B7280', fontWeight: 600 }} 
                    width={isExpanded ? 55 : 45}
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
                    wrapperStyle={{ paddingBottom: isExpanded ? '15px' : '10px', fontSize: isExpanded ? '13px' : '12px' }} 
                  />

                  {/* Barras de Gasto del Mes con Etiquetas de Datos Inteligentes */}
                  <Bar 
                    yAxisId="left" 
                    dataKey="gastoTotal" 
                    name="Gasto del Mes ($)" 
                    fill="#00205B" 
                    radius={[4, 4, 0, 0]} 
                    barSize={isExpanded ? 48 : 30} 
                  >
                    <LabelList
                      dataKey="gastoTotal"
                      content={(props: any) => {
                        const { x, y, width, height, value } = props;
                        if (!value || value <= 0) return null;
                        const textVal = `$${Math.round(value).toLocaleString('en-US')}`;
                        const isInside = height >= 30;
                        return (
                          <text
                            x={x + width / 2}
                            y={isInside ? y + 16 : y - 6}
                            fill={isInside ? '#FFFFFF' : '#00205B'}
                            fontSize={isExpanded ? 12 : 10}
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {textVal}
                          </text>
                        );
                      }}
                    />
                  </Bar>

                  {/* Línea de Promedio por Jornada con Badges de Etiquetas de Datos */}
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
                        const pillWidth = isExpanded ? 48 : 40;
                        const pillHeight = isExpanded ? 18 : 15;
                        return (
                          <g>
                            <rect
                              x={x - pillWidth / 2}
                              y={y - pillHeight - 6}
                              width={pillWidth}
                              height={pillHeight}
                              rx={4}
                              fill="#FFF7ED"
                              stroke="#FE5000"
                              strokeWidth={1}
                              strokeOpacity={0.8}
                              className="filter drop-shadow-xs"
                            />
                            <text
                              x={x}
                              y={y - pillHeight / 2 - 6}
                              fill="#C2410C"
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
                Sin datos históricos de gastos
              </div>
            )}
          </div>
        </div>
      )}
    </ChartModalWrapper>
  );
}
