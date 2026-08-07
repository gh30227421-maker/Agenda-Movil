"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts';

interface UnidadRankingChartProps {
  events: any[];
}

const BLUE_SCALE = [
  '#00205C', '#1A366E', '#2C4A82', '#405E96', '#5975A8',
  '#6F8CBA', '#85A0CE', '#9CB6DE', '#B5CEEE', '#CFE4FD'
];

export default function UnidadRankingChart({ events }: UnidadRankingChartProps) {
  const barData = useMemo(() => {
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

    return [
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
  }, [events]);

  return (
    <ChartModalWrapper
      title="Detalle de Costos (Unidad Móvil)"
      subtitle="Gastos operativos desglosados por categoría"
    >
      <div className="w-full h-full min-h-[480px] flex flex-col justify-center py-2">
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={460}>
            <BarChart layout="vertical" data={barData} margin={{ top: 10, right: 120, left: 80, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fontSize: 13, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
              <YAxis type="category" dataKey="categoria" tick={{ fontSize: 13, fontWeight: 600, fill: '#1F2937' }} width={140} />
              <Tooltip 
                formatter={(val: any) => [`$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Gasto']}
                contentStyle={{ backgroundColor: '#00205C', borderRadius: '12px', color: '#FFF', border: 'none' }}
              />
              <Bar dataKey="Gasto" name="Gasto Total" radius={[0, 4, 4, 0]} barSize={22}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BLUE_SCALE[index % BLUE_SCALE.length]} />
                ))}
                <LabelList 
                  dataKey="Gasto" 
                  position="right" 
                  formatter={(val: any) => `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                  fill="#4B5563" 
                  fontSize={13} 
                  fontWeight="bold" 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-gray-400">Sin eventos de Unidad Móvil registrados</div>
        )}
      </div>
    </ChartModalWrapper>
  );
}
