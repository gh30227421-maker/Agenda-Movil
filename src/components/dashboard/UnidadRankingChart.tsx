"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';

interface UnidadRankingChartProps {
  events: any[];
}

const BLUE_SCALE = [
  '#00205C', // Darkest
  '#003385',
  '#004AAB',
  '#1A66D6',
  '#3B82F6',
  '#60A5FA',
  '#80BAFA',
  '#A0CEFA',
  '#C7DFFF', // Lightest
];

export default function UnidadRankingChart({ events }: UnidadRankingChartProps) {
  const { barData, pieData, totalGastos } = useMemo(() => {
    const unidadEvents = events.filter(ev => ev.type === 'Unidad Móvil');
    
    // Distribución de Gastos Operativos de la Unidad
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

    return { barData: bData, pieData: pData, totalGastos: total };
  }, [events]);

  return (
    <ChartModalWrapper
      title="Detalle de Costos (Unidad Móvil)"
      subtitle="Gastos operativos desglosados"
    >
<div className="w-full h-full min-h-[450px]">
          <h4 className="text-sm font-bold text-gray-700 mb-4 text-center lg:text-left">Detalle de Costos Operativos</h4>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={barData} margin={{ top: 0, right: 120, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
                <XAxis type="number" tick={{ fontSize: 15, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
                <YAxis type="category" dataKey="categoria" tick={{ fontSize: 14, fontWeight: 'bold', fill: '#1F2937' }} width={120} />
                <Tooltip 
                  formatter={(val: any, name: any) => [`$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Gasto']}
                  contentStyle={{ backgroundColor: '#00205C', borderRadius: '12px', color: '#FFF', border: 'none' }}
                />
                <Bar dataKey="Gasto" name="Gasto Total" radius={[0, 4, 4, 0]} barSize={24}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BLUE_SCALE[index % BLUE_SCALE.length]} />
                  ))}
                  <LabelList 
                    dataKey="Gasto" 
                    position="right" 
                    formatter={(val: any) => `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                    fill="#6B7280" 
                    fontSize={14} 
                    fontWeight="bold" 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">Sin eventos de Unidad Móvil registrados</div>
          )}
        </div>
    </ChartModalWrapper>
  );
}
