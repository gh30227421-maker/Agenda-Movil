"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';

interface DesgloseUnidadMovilProps {
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

export default function DesgloseUnidadMovil({ events }: DesgloseUnidadMovilProps) {
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
      title="Desglose Específico: Unidad Móvil"
      subtitle="Análisis profundo de los costos operativos y de mantenimiento del vehículo"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center w-full h-full min-h-[350px]">
        
        {/* Costos Operativos (Barras) */}
        <div className="lg:col-span-2 w-full h-full min-h-[300px]">
          <h4 className="text-sm font-bold text-gray-700 mb-4 text-center lg:text-left">Detalle de Costos Operativos</h4>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={barData} margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
                <YAxis type="category" dataKey="categoria" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#1F2937' }} width={120} />
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
                    formatter={(val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                    fill="#6B7280" 
                    fontSize={10} 
                    fontWeight="bold" 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">Sin eventos de Unidad Móvil registrados</div>
          )}
        </div>

        {/* Dona de Gastos */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 pl-0 lg:pl-4 min-h-[300px]">
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
                    label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
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
                    contentStyle={{ backgroundColor: '#00205C', borderRadius: '8px', color: '#FFF', border: 'none' }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
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

      </div>
    </ChartModalWrapper>
  );
}
