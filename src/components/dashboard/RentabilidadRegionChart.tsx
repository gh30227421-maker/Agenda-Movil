"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';

interface RentabilidadRegionChartProps {
  events: any[];
  agencies?: any[];
}

// Marcador circular naranja con el número de operativos en su interior
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  return (
    <g key={`dot-${payload.region}`}>
      <circle cx={cx} cy={cy} r={13} fill="#FE5000" stroke="#FFFFFF" strokeWidth={2.5} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#FFFFFF" fontSize={11} fontWeight="900">
        {payload.eventCount}
      </text>
    </g>
  );
};

// Marcador activo para hover
const CustomActiveDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  return (
    <g key={`active-dot-${payload.region}`}>
      <circle cx={cx} cy={cy} r={16} fill="#EA580C" stroke="#FFFFFF" strokeWidth={3} />
      <text x={cx} y={cy + 4.5} textAnchor="middle" fill="#FFFFFF" fontSize={12} fontWeight="900">
        {payload.eventCount}
      </text>
    </g>
  );
};

export default function RentabilidadRegionChart({ events, agencies = [] }: RentabilidadRegionChartProps) {
  const data = useMemo(() => {
    const regionMap: Record<string, {
      region: string;
      saldoUsd: number;
      gastoUsd: number;
      rentabilidadUsd: number;
      eventCount: number;
      cuentas: number;
    }> = {};

    events.forEach(ev => {
      // Determinar región
      let reg = ev.region;
      if (!reg && agencies.length > 0 && ev.state) {
        const ag = agencies.find(a => a.state === ev.state);
        if (ag && ag.region) reg = ag.region;
      }
      if (!reg) reg = 'Otras Regiones';

      // Normalizar nombre de región para presentación uniforme y limpia
      let regName = reg.toUpperCase().replace(/^REGI[OÓ]N\s+/i, '');

      // Calcular montos USD
      const tasaBcv = ev.gastos?.tasaBcv || 1;
      const saldosBs = ev.cifras?.saldosCaptadosBs || 0;
      const saldoDivisas = ev.cifras?.saldoCierreDivisas || 0;
      const saldoUsd = (tasaBcv > 0 ? saldosBs / tasaBcv : 0) + saldoDivisas;

      let gastoUsd = 0;
      if (ev.gastos) {
        const g = ev.gastos;
        const totalCostosBs = (g.alimentacionBs || 0) + (g.transporteBs || 0) + (g.hospedajeBs || 0) + 
                              (g.soporteTecnicoBs || 0) + (g.bancaElectronicaBs || 0) + (g.gastosTributariosBs || 0) + 
                              (g.conductorAyudanteBs || 0) + (g.mantenimientoLimpiezaBs || 0) + (g.gastoCombustibleBs || 0);
        gastoUsd = tasaBcv > 0 ? totalCostosBs / tasaBcv : (g.totalUsd || 0);
      }

      const rentabilidadUsd = saldoUsd - gastoUsd;

      if (!regionMap[regName]) {
        regionMap[regName] = {
          region: regName,
          saldoUsd: 0,
          gastoUsd: 0,
          rentabilidadUsd: 0,
          eventCount: 0,
          cuentas: 0
        };
      }

      regionMap[regName].saldoUsd += saldoUsd;
      regionMap[regName].gastoUsd += gastoUsd;
      regionMap[regName].rentabilidadUsd += rentabilidadUsd;
      regionMap[regName].eventCount += 1;
      regionMap[regName].cuentas += (ev.cifras?.cuentasAbiertas || 0);
    });

    const list = Object.values(regionMap).map(r => {
      const margen = r.saldoUsd > 0 ? Math.round((r.rentabilidadUsd / r.saldoUsd) * 100) : 0;
      return {
        ...r,
        margenPct: margen
      };
    });

    return list.sort((a, b) => b.rentabilidadUsd - a.rentabilidadUsd);
  }, [events, agencies]);

  // Cálculos dinámicos de dominio para que los números respiren
  const maxRentabilidad = useMemo(() => {
    if (data.length === 0) return 10000;
    const maxVal = Math.max(...data.map(d => d.rentabilidadUsd), 0);
    return Math.ceil((maxVal * 1.25) / 1000) * 1000;
  }, [data]);

  const maxOperativos = useMemo(() => {
    if (data.length === 0) return 5;
    const maxOps = Math.max(...data.map(d => d.eventCount), 1);
    return Math.max(5, Math.ceil(maxOps * 1.35));
  }, [data]);

  return (
    <ChartModalWrapper
      title="Rentabilidad Neta por Región"
      subtitle="Margen y retorno financiero consolidado vs. volumen de operativos por zona"
    >
      <div className="w-full h-full min-h-[460px] flex flex-col justify-center py-2">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={440}>
            <ComposedChart 
              data={data} 
              margin={{ top: 35, right: 30, left: 15, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              
              {/* Eje X: Regiones */}
              <XAxis 
                dataKey="region" 
                tick={{ fontSize: 12, fontWeight: 700, fill: '#1F2937' }} 
                interval={0}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />

              {/* Eje Y Izquierdo: Rentabilidad Neta en USD */}
              <YAxis 
                yAxisId="left"
                type="number" 
                domain={[0, maxRentabilidad]}
                tick={{ fontSize: 12, fill: '#6B7280' }} 
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                axisLine={false}
                tickLine={false}
              />

              {/* Eje Y Derecho: Número de Operativos */}
              <YAxis 
                yAxisId="right"
                orientation="right"
                type="number" 
                domain={[0, maxOperativos]}
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#FE5000', fontWeight: 600 }} 
                axisLine={false}
                tickLine={false}
              />

              <Tooltip 
                formatter={(val: any, name: any, item: any) => {
                  const p = item.payload;
                  if (name === 'Operativos Realizados') {
                    return [`${val} jornadas`, 'Operativos'];
                  }
                  return [
                    <div key="tooltip-content" className="space-y-1 text-xs">
                      <p><span className="text-gray-300">Rentabilidad Neta:</span> <span className="font-bold text-[#A7F3D0]">${p.rentabilidadUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                      <p><span className="text-gray-300">Saldo Captado:</span> <span className="font-bold text-white">${p.saldoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                      <p><span className="text-gray-300">Gasto Total:</span> <span className="font-bold text-[#FFA07A]">${p.gastoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                      <p><span className="text-gray-300">Margen Neto:</span> <span className="font-bold text-white">{p.margenPct}%</span></p>
                      <p><span className="text-gray-300">Operativos Realizados:</span> <span className="font-bold text-[#FFA07A]">{p.eventCount}</span></p>
                    </div>,
                    'Detalle Regional'
                  ];
                }}
                contentStyle={{ backgroundColor: '#00205C', borderRadius: '12px', color: '#FFF', border: 'none', padding: '12px' }}
              />

              <Legend 
                verticalAlign="top" 
                align="right"
                wrapperStyle={{ fontSize: '12px', paddingBottom: '15px' }} 
              />

              {/* Columnas: Rentabilidad Neta (Azul BNC) */}
              <Bar 
                yAxisId="left"
                dataKey="rentabilidadUsd" 
                name="Rentabilidad Neta ($ USD)" 
                fill="#00205C" 
                radius={[6, 6, 0, 0]} 
                barSize={44}
              >
                <LabelList 
                  dataKey="rentabilidadUsd" 
                  position="top" 
                  offset={10}
                  formatter={(val: any) => {
                    const num = Number(val);
                    const prefix = num >= 0 ? '+' : '';
                    return `${prefix}$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                  }} 
                  fill="#00205C" 
                  fontSize={12} 
                  fontWeight="bold" 
                />
              </Bar>

              {/* Línea Superpuesta: Número de Operativos con Puntos Naranjas Destacados */}
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="eventCount" 
                name="Operativos Realizados" 
                stroke="#FE5000" 
                strokeWidth={3} 
                dot={<CustomDot />}
                activeDot={<CustomActiveDot />}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-gray-400">
            Sin datos financieros registrados para esta selección
          </div>
        )}
      </div>
    </ChartModalWrapper>
  );
}
