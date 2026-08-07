"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';

interface AgenciaDistribucionChartProps {
  events: any[];
}

const PIE_COLORS = ['#00205C', '#2C4A82', '#5975A8', '#85A0CE'];

export default function AgenciaDistribucionChart({ events }: AgenciaDistribucionChartProps) {
  const { pieData, totalGastos } = useMemo(() => {
    const agenciaEvents = events.filter(ev => ev.type === 'Agencia Móvil');
    
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

    return { pieData: pData, totalGastos: total };
  }, [events]);

  return (
    <ChartModalWrapper
      title="Distribución de Gastos (Agencia Móvil)"
      subtitle="Desglose porcentual operativo por rubro"
    >
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[480px] py-4">
        {pieData.length > 0 ? (
          <div className="relative w-full h-[400px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={75}
                  outerRadius={105}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  label={({ percent }) => (percent || 0) > 0.04 ? `${((percent || 0) * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any, name: any) => {
                    const pct = totalGastos > 0 ? Math.round((Number(val) / totalGastos) * 100) : 0;
                    return [`$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct}%)`, name];
                  }}
                  contentStyle={{ backgroundColor: '#00205C', borderRadius: '12px', color: '#FFF', border: 'none' }} 
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '14px', paddingTop: '15px' }} 
                  formatter={(value) => <span style={{ color: '#1E293B', fontWeight: 600, paddingLeft: '4px', paddingRight: '12px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Total Centralizado */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none pb-14">
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Total Gasto</span>
              <span className="text-2xl font-black text-[#00205C] mt-0.5">
                ${totalGastos.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 my-auto">Sin datos de gastos registrados</p>
        )}
      </div>
    </ChartModalWrapper>
  );
}
