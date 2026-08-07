"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';

interface UnidadDistribucionChartProps {
  events: any[];
}

const BLUE_SCALE = [
  '#00205C', '#1A366E', '#2C4A82', '#405E96', '#5975A8',
  '#6F8CBA', '#85A0CE', '#9CB6DE', '#B5CEEE', '#CFE4FD'
];

export default function UnidadDistribucionChart({ events }: UnidadDistribucionChartProps) {
  const { pieData, totalGastos } = useMemo(() => {
    const unidadEvents = events.filter(ev => ev.type === 'Unidad Móvil');
    
    let soporte = 0;
    let chofer = 0;
    let mantenimiento = 0;
    let alimentacion = 0;
    let transporte = 0;
    let combustible = 0;
    let hospedaje = 0;
    let banca = 0;
    let tributos = 0;

    unidadEvents.forEach(ev => {
      const g = ev.gastos;
      if (!g) return;
      const tasa = g.tasaBcv || 1;
      soporte += (g.soporteTecnicoBs || 0) / tasa;
      chofer += (g.conductorAyudanteBs || 0) / tasa;
      mantenimiento += (g.mantenimientoLimpiezaBs || 0) / tasa;
      alimentacion += (g.alimentacionBs || 0) / tasa;
      transporte += (g.transporteBs || 0) / tasa;
      combustible += (g.gastoCombustibleBs || 0) / tasa;
      hospedaje += (g.hospedajeBs || 0) / tasa;
      banca += (g.bancaElectronicaBs || 0) / tasa;
      tributos += (g.gastosTributariosBs || 0) / tasa;
    });

    const total = soporte + chofer + mantenimiento + alimentacion + transporte + combustible + hospedaje + banca + tributos;
    
    const bData = [
      { categoria: 'Soporte TI', Gasto: soporte },
      { categoria: 'Chofer / Ayudante', Gasto: chofer },
      { categoria: 'Mantenimiento / Limpieza', Gasto: mantenimiento },
      { categoria: 'Alimentación', Gasto: alimentacion },
      { categoria: 'Transporte / Logística', Gasto: transporte },
      { categoria: 'Combustible', Gasto: combustible },
      { categoria: 'Hospedaje', Gasto: hospedaje },
      { categoria: 'Banca Electrónica', Gasto: banca },
      { categoria: 'Tributos', Gasto: tributos },
    ].filter(d => d.Gasto > 0).sort((a, b) => b.Gasto - a.Gasto);

    const pData = bData.map(d => ({ name: d.categoria, value: d.Gasto }));

    return { pieData: pData, totalGastos: total };
  }, [events]);

  return (
    <ChartModalWrapper
      title="Distribución de Gastos (Unidad Móvil)"
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
                    <Cell key={`cell-${index}`} fill={BLUE_SCALE[index % BLUE_SCALE.length]} />
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
                  wrapperStyle={{ fontSize: '13px', paddingTop: '15px' }} 
                  formatter={(value) => <span style={{ color: '#1E293B', fontWeight: 600, paddingLeft: '4px', paddingRight: '10px' }}>{value}</span>}
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
