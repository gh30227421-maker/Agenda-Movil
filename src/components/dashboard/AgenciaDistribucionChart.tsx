"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';

interface AgenciaDistribucionChartProps {
  events: any[];
}

const PIE_COLORS = ['#00205C', '#2C4A82', '#5975A8', '#85A0CE'];

export default function AgenciaDistribucionChart({ events }: AgenciaDistribucionChartProps) {
  const { ranking, pieData, totalGastos } = useMemo(() => {
    const agenciaEvents = events.filter(ev => ev.type === 'Agencia Móvil');
    
    // 1. Ranking de Eventos por Gasto
    const rank = agenciaEvents.map(ev => {
      const g = ev.gastos;
      const tasa = g?.tasaBcv || 1;
      const totalUsd = g?.totalUsd || 0;
      return {
        evento: ev.eventName,
        gastoUsd: totalUsd,
      };
    }).sort((a, b) => b.gastoUsd - a.gastoUsd).slice(0, 10); // Top 10

    // 2. Distribución de Gastos
    let alimentacion = 0;
    let transporte = 0;
    let hospedaje = 0;
    let otros = 0;

    agenciaEvents.forEach(ev => {
      const g = ev.gastos;
      if (!g) return;
      const tasa = g.tasaBcv || 1;
      alimentacion += (g.alimentacionBs || 0) / tasa;
      transporte += (g.transporteBs || 0) / tasa;
      hospedaje += (g.hospedajeBs || 0) / tasa;
      otros += ((g.soporteTecnicoBs || 0) + (g.bancaElectronicaBs || 0) + (g.gastosTributariosBs || 0)) / tasa;
    });

    const total = alimentacion + transporte + hospedaje + otros;
    const pData = [
      { name: 'Alimentación', value: alimentacion },
      { name: 'Transporte', value: transporte },
      { name: 'Hospedaje', value: hospedaje },
      { name: 'Otros (TI, Trib.)', value: otros },
    ].filter(d => d.value > 0);

    return { ranking: rank, pieData: pData, totalGastos: total };
  }, [events]);

  return (
    <ChartModalWrapper
      title="Distribución de Gastos (Agencia Móvil)"
      subtitle="Desglose porcentual operativo"
    >
<div className="lg:col-span-1 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 pl-0 lg:pl-4 min-h-[450px]">
          <h4 className="text-sm font-bold text-gray-700 mb-2">Distribución Porcentual</h4>
          {pieData.length > 0 ? (
            <div className="relative w-full h-64 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                    label={({ percent }) => (percent || 0) > 0.05 ? `${((percent || 0) * 100).toFixed(0)}%` : ''}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => [`$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]}
                    contentStyle={{ backgroundColor: '#00205C', borderRadius: '8px', color: '#FFF', border: 'none' }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    wrapperStyle={{ fontSize: '15px', paddingTop: '10px' }} 
                    formatter={(value) => <span style={{ color: '#1E293B', fontWeight: 500 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Total Centralizado */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none pb-8">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Total Gasto</span>
                <span className="text-xl font-black text-[#00205C]">${totalGastos.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 my-auto">Sin datos de gastos</p>
          )}
        </div>
    </ChartModalWrapper>
  );
}
