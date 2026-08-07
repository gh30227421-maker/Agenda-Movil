"use client";

import React, { useState, useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
  ScatterChart, Scatter, ZAxis, ReferenceLine, Label
} from 'recharts';
import { BarChart3, ScatterChart as ScatterIcon } from 'lucide-react';

interface RentabilidadVsCostosChartProps {
  events: any[];
}

export default function RentabilidadVsCostosChart({ events }: RentabilidadVsCostosChartProps) {
  const [viewMode, setViewMode] = useState<'comparativo' | 'dispersion'>('comparativo');

  const data = useMemo(() => {
    return events.map(ev => {
      const tasaBcv = ev.gastos?.tasaBcv || 1;
      const saldosBs = ev.cifras?.saldosCaptadosBs || 0;
      const saldoDivisas = ev.cifras?.saldoCierreDivisas || 0;
      const saldoUsd = (tasaBcv > 0 ? saldosBs / tasaBcv : 0) + saldoDivisas;

      let gastoUsd = 0;
      const g = ev.gastos;
      if (g) {
        const totalCostosBs = (g.alimentacionBs || 0) + (g.transporteBs || 0) + (g.hospedajeBs || 0) + 
                              (g.soporteTecnicoBs || 0) + (g.bancaElectronicaBs || 0) + (g.gastosTributariosBs || 0) + 
                              (g.conductorAyudanteBs || 0) + (g.mantenimientoLimpiezaBs || 0) + (g.gastoCombustibleBs || 0);
        gastoUsd = tasaBcv > 0 ? totalCostosBs / tasaBcv : (g.totalUsd || 0);
      }

      const rentabilidadUsd = saldoUsd - gastoUsd;
      const margenPct = saldoUsd > 0 ? Math.round((rentabilidadUsd / saldoUsd) * 100) : 0;
      const roiRatio = gastoUsd > 0 ? (saldoUsd / gastoUsd).toFixed(1) : '—';

      return {
        id: ev.id,
        eventName: ev.eventName,
        type: ev.type,
        state: ev.state || 'N/A',
        gastoUsd: Math.round(gastoUsd),
        rentabilidadUsd: Math.round(rentabilidadUsd),
        saldoUsd: Math.round(saldoUsd),
        margenPct,
        roiRatio,
        cuentas: ev.cifras?.cuentasAbiertas || 10,
      };
    }).sort((a, b) => b.rentabilidadUsd - a.rentabilidadUsd);
  }, [events]);

  const displayData = useMemo(() => {
    return data.slice(0, 10);
  }, [data]);

  const maxVal = useMemo(() => {
    if (displayData.length === 0) return 10000;
    const maxNumber = Math.max(...displayData.map(d => Math.max(d.saldoUsd, d.rentabilidadUsd, d.gastoUsd)), 0);
    return Math.ceil((maxNumber * 1.25) / 1000) * 1000;
  }, [displayData]);

  const avgGasto = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.round(data.reduce((acc, d) => acc + d.gastoUsd, 0) / data.length);
  }, [data]);

  // Altura proporcional para que cada evento tenga espacio amplio
  const chartHeight = useMemo(() => {
    return Math.max(480, displayData.length * 48);
  }, [displayData]);

  return (
    <ChartModalWrapper
      title="Rentabilidad vs. Costo Operativo"
      subtitle="Comparativa directa de inversión en gastos operativos vs. retorno neto por jornada"
    >
      <div className="w-full h-full min-h-[500px] flex flex-col justify-between py-2">
        {/* Selector de Modo de Visualización */}
        <div className="flex items-center justify-between mb-3 px-2 hide-on-download">
          <span className="text-xs text-gray-500 font-medium">
            {viewMode === 'comparativo' 
              ? 'Comparativa de Gasto Operativo vs. Rentabilidad Neta' 
              : 'Matriz de Dispersión (Gasto en Eje X vs Retorno en Eje Y)'}
          </span>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('comparativo')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'comparativo'
                  ? 'bg-white text-[#00205B] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Comparativo
            </button>
            <button
              onClick={() => setViewMode('dispersion')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'dispersion'
                  ? 'bg-white text-[#00205B] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <ScatterIcon className="w-3.5 h-3.5" />
              Matriz Dispersión
            </button>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-400">
            Sin datos operativos para analizar
          </div>
        ) : viewMode === 'comparativo' ? (
          /* Vista 1: Barras Horizontales Pareadas Limpias */
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart 
              layout="vertical" 
              data={displayData} 
              margin={{ top: 15, right: 120, left: 210, bottom: 15 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
              
              {/* Eje X: Escala Monetaria USD */}
              <XAxis 
                type="number"
                domain={[0, maxVal]}
                tick={{ fontSize: 12, fill: '#6B7280' }} 
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                axisLine={{ stroke: '#E5E7EB' }}
              />

              {/* Eje Y: Nombres de Eventos Completos sin Cortes */}
              <YAxis 
                type="category" 
                dataKey="eventName" 
                tick={{ fontSize: 12, fontWeight: 600, fill: '#1F2937' }} 
                width={205}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={false}
              />

              <Tooltip 
                formatter={(val: any, name: any, item: any) => {
                  const p = item.payload;
                  return [
                    <div key="tooltip-content" className="space-y-1 text-xs">
                      <p className="font-bold text-white border-b border-blue-900 pb-1 mb-1">{p.eventName} ({p.state})</p>
                      <p><span className="text-gray-300">Gasto Operativo:</span> <span className="font-bold text-[#FFA07A]">${p.gastoUsd.toLocaleString('en-US')}</span></p>
                      <p><span className="text-gray-300">Rentabilidad Neta:</span> <span className="font-bold text-[#A7F3D0]">${p.rentabilidadUsd.toLocaleString('en-US')}</span></p>
                      <p><span className="text-gray-300">Saldo Captado:</span> <span className="font-bold text-white">${p.saldoUsd.toLocaleString('en-US')}</span></p>
                      <p><span className="text-gray-300">Margen Neto:</span> <span className="font-bold text-white">{p.margenPct}%</span></p>
                    </div>,
                    'Detalle Operativo'
                  ];
                }}
                contentStyle={{ backgroundColor: '#00205C', borderRadius: '12px', color: '#FFF', border: 'none', padding: '12px' }}
              />

              <Legend 
                verticalAlign="top" 
                align="right"
                wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }} 
              />

              {/* Barra 1: Gasto Operativo (Gris Azulado Corporativo) */}
              <Bar 
                dataKey="gastoUsd" 
                name="Gasto Operativo ($ USD)" 
                fill="#426095" 
                radius={[0, 4, 4, 0]} 
                barSize={14}
              >
                <LabelList 
                  dataKey="gastoUsd" 
                  position="right" 
                  formatter={(val: any) => `$${Number(val).toLocaleString('en-US')}`} 
                  fill="#426095" 
                  fontSize={11} 
                  fontWeight="600" 
                />
              </Bar>

              {/* Barra 2: Rentabilidad Neta (Azul BNC Primario) */}
              <Bar 
                dataKey="rentabilidadUsd" 
                name="Rentabilidad Neta ($ USD)" 
                fill="#00205C" 
                radius={[0, 4, 4, 0]} 
                barSize={14}
              >
                <LabelList 
                  dataKey="rentabilidadUsd" 
                  position="right" 
                  formatter={(val: any) => `+$${Number(val).toLocaleString('en-US')}`} 
                  fill="#00205C" 
                  fontSize={11} 
                  fontWeight="bold" 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          /* Vista 2: Matriz de Dispersión Cuadrante (Gasto vs Retorno) */
          <div className="relative w-full h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis 
                  type="number" 
                  dataKey="gastoUsd" 
                  name="Gasto Operativo" 
                  unit="$" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(v) => `$${v}`}
                >
                  <Label value="Gasto Operativo ($ USD)" offset={-10} position="insideBottom" fill="#6B7280" fontSize={12} />
                </XAxis>
                <YAxis 
                  type="number" 
                  dataKey="rentabilidadUsd" 
                  name="Rentabilidad Neta" 
                  unit="$" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(v) => `$${v}`}
                >
                  <Label value="Rentabilidad Neta ($ USD)" angle={-90} position="insideLeft" fill="#6B7280" fontSize={12} />
                </YAxis>
                <ZAxis type="number" dataKey="cuentas" range={[80, 450]} name="Cuentas" />
                <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="4 4" label="Equilibrio ($0)" />
                {avgGasto > 0 && (
                  <ReferenceLine x={avgGasto} stroke="#CBD5E1" strokeDasharray="3 3" label={`Gasto Promedio ($${avgGasto})`} />
                )}
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#00205C] text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-blue-900">
                          <p className="font-bold border-b border-blue-800 pb-1 mb-1">{d.eventName} ({d.state})</p>
                          <p><span className="text-gray-300">Gasto Operativo:</span> <span className="font-bold text-[#FFA07A]">${d.gastoUsd.toLocaleString('en-US')}</span></p>
                          <p><span className="text-gray-300">Rentabilidad Neta:</span> <span className="font-bold text-[#A7F3D0]">${d.rentabilidadUsd.toLocaleString('en-US')}</span></p>
                          <p><span className="text-gray-300">Saldo Captado:</span> <span className="font-bold text-white">${d.saldoUsd.toLocaleString('en-US')}</span></p>
                          <p><span className="text-gray-300">Retorno (ROI):</span> <span className="font-bold text-[#A7F3D0]">{d.roiRatio}x ({d.margenPct}%)</span></p>
                          <p><span className="text-gray-300">Cuentas Abiertas:</span> <span className="font-bold text-white">{d.cuentas}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Operativos" data={data} fill="#00205C" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </ChartModalWrapper>
  );
}
