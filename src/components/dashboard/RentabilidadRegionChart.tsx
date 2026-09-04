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

    if (!events || !Array.isArray(events)) {
      console.warn('RentabilidadRegionChart: events no es un arreglo válido', events);
      return [];
    }

    events.forEach(ev => {
      // 1. Determinar y limpiar la región
      let reg = ev?.region?.trim();
      if (!reg && agencies && Array.isArray(agencies) && ev?.state) {
        const ag = agencies.find(a => a?.state === ev.state);
        if (ag && ag.region) reg = ag.region.trim();
      }
      
      // Si la región sigue vacía o es numéricamente inválida, agrupar en OTRAS REGIONES
      if (!reg || /^\d+$/.test(reg)) {
        reg = 'OTRAS REGIONES';
      }

      // Normalizar nombre
      let regName = reg.toUpperCase().replace(/^REGI[OÓ]N\s+/i, '');

      // 2. Extracción segura de cifras monetarias
      const tasaBcv = Number(ev?.gastos?.tasaBcv) || 1;
      const saldosBs = Number(ev?.cifras?.saldosCaptadosBs) || 0;
      const saldoDivisas = Number(ev?.cifras?.saldoCierreDivisas) || 0;
      const saldoUsd = (tasaBcv > 0 ? saldosBs / tasaBcv : 0) + saldoDivisas;

      // 3. Extracción segura de gastos
      let gastoUsd = 0;
      if (ev?.gastos) {
        const g = ev.gastos;
        const totalCostosBs = (Number(g.alimentacionBs) || 0) + 
                              (Number(g.transporteBs) || 0) + 
                              (Number(g.hospedajeBs) || 0) + 
                              (Number(g.soporteTecnicoBs) || 0) + 
                              (Number(g.bancaElectronicaBs) || 0) + 
                              (Number(g.gastosTributariosBs) || 0) + 
                              (Number(g.conductorAyudanteBs) || 0) + 
                              (Number(g.mantenimientoLimpiezaBs) || 0) + 
                              (Number(g.gastoCombustibleBs) || 0);
                              
        gastoUsd = tasaBcv > 0 ? totalCostosBs / tasaBcv : (Number(g.totalUsd) || 0);
      }

      const rentabilidadUsd = saldoUsd - gastoUsd;

      // 4. Agrupación por región
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
      regionMap[regName].cuentas += (Number(ev?.cifras?.cuentasAbiertas) || 0);
    });

    // 5. Mapeo final y cálculo de margen
    const list = Object.values(regionMap).map(r => {
      const margen = r.saldoUsd > 0 ? Math.round((r.rentabilidadUsd / r.saldoUsd) * 100) : 0;
      return {
        ...r,
        margenPct: margen
      };
    });

    const finalData = list.sort((a, b) => b.rentabilidadUsd - a.rentabilidadUsd);
    
    // Log de auditoría requerido
    console.log('📉 Datos de Rentabilidad por Región listos para graficar:', finalData);
    
    return finalData;
  }, [events, agencies]);

  // Cálculos dinámicos de dominio para que los números respiren
  const { minRentabilidad, maxRentabilidad } = useMemo(() => {
    if (data.length === 0) return { minRentabilidad: 0, maxRentabilidad: 10000 };
    const maxVal = Math.max(...data.map(d => d.rentabilidadUsd), 0);
    const minVal = Math.min(...data.map(d => d.rentabilidadUsd), 0);
    
    // Si hay valores negativos, dar espacio extra hacia abajo para que la barra no colisione con el eje
    const minDomain = minVal < 0 ? Math.floor((minVal * 1.35) / 1000) * 1000 : 0;
    const maxDomain = Math.ceil((maxVal * 1.25) / 1000) * 1000;
    
    return { minRentabilidad: minDomain, maxRentabilidad: maxDomain };
  }, [data]);

  const maxOperativos = useMemo(() => {
    if (data.length === 0) return 5;
    const maxOps = Math.max(...data.map(d => d.eventCount), 1);
    return Math.max(5, Math.ceil(maxOps * 1.35));
  }, [data]);

  return (
    <ChartModalWrapper
      title="Efectividad Operativa Neta por Región"
      subtitle="Margen consolidado vs. volumen de operativos por zona"
    >
      <div className="w-full h-full min-h-[460px] flex flex-col justify-center py-2">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={440}>
            <ComposedChart 
              data={data} 
              margin={{ top: 35, right: 30, left: 15, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              
              {/* Eje X: Regiones */}
              <XAxis 
                dataKey="region" 
                tick={{ fontSize: 11, fontWeight: 700, fill: '#1F2937' }} 
                interval={0}
                angle={-30}
                textAnchor="end"
                height={80}
                dy={10}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />

              {/* Eje Y Izquierdo: Rentabilidad Neta en USD */}
              <YAxis 
                yAxisId="left"
                type="number" 
                domain={[minRentabilidad, maxRentabilidad]}
                tick={{ fontSize: 12, fill: '#6B7280' }} 
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val <= -1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
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
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload;
                    return (
                      <div className="bg-[#00205C] p-3.5 rounded-xl text-white shadow-lg min-w-[200px] border-none">
                        <p className="font-bold text-sm uppercase mb-2.5 border-b border-white/20 pb-1.5">{p.region}</p>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-gray-300">Saldo Captado:</span> 
                            <span className="font-bold text-white text-[13px]">${p.saldoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-gray-300">Gasto Total:</span> 
                            <span className="font-bold text-[#FFA07A] text-[13px]">${p.gastoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
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
                name="Efectividad Operativa Neta ($ USD)" 
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
