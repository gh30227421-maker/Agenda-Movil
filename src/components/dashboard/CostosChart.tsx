"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from 'recharts';

interface CostosChartProps {
  events: any[];
}

export default function CostosChart({ events }: CostosChartProps) {
  const { barData, agenciaStats, unidadStats } = useMemo(() => {
    let countAgencia = 0;
    let countUnidad = 0;

    let totalAgencia = 0;
    let totalUnidad = 0;

    const cat: Record<string, { Agencia: number; Unidad: number }> = {
      'Alimentación': { Agencia: 0, Unidad: 0 },
      'Transporte': { Agencia: 0, Unidad: 0 },
      'Hospedaje': { Agencia: 0, Unidad: 0 },
      'Soporte TI': { Agencia: 0, Unidad: 0 },
      'Banca Elec.': { Agencia: 0, Unidad: 0 },
      'Tributarios': { Agencia: 0, Unidad: 0 },
      'Chofer': { Agencia: 0, Unidad: 0 },
      'Limpieza': { Agencia: 0, Unidad: 0 },
    };

    events.forEach(ev => {
      const g = ev.gastos;
      if (!g) return;

      const tasa = g.tasaBcv || 1;
      
      const alimentacion = (g.alimentacionBs || 0) / tasa;
      const transporte = (g.transporteBs || 0) / tasa;
      const hospedaje = (g.hospedajeBs || 0) / tasa;
      const soporte = (g.soporteTecnicoBs || 0) / tasa;
      const banca = (g.bancaElectronicaBs || 0) / tasa;
      const tributos = (g.gastosTributariosBs || 0) / tasa;
      const chofer = (g.conductorAyudanteBs || 0) / tasa;
      const limpieza = (g.mantenimientoLimpiezaBs || 0) / tasa;

      const totalEv = alimentacion + transporte + hospedaje + soporte + banca + tributos + chofer + limpieza;

      if (ev.type === 'Agencia Móvil') {
        countAgencia++;
        totalAgencia += totalEv;
        cat['Alimentación'].Agencia += alimentacion;
        cat['Transporte'].Agencia += transporte;
        cat['Hospedaje'].Agencia += hospedaje;
        cat['Soporte TI'].Agencia += soporte;
        cat['Banca Elec.'].Agencia += banca;
        cat['Tributarios'].Agencia += tributos;
        cat['Chofer'].Agencia += chofer;
        cat['Limpieza'].Agencia += limpieza;
      } else if (ev.type === 'Unidad Móvil') {
        countUnidad++;
        totalUnidad += totalEv;
        cat['Alimentación'].Unidad += alimentacion;
        cat['Transporte'].Unidad += transporte;
        cat['Hospedaje'].Unidad += hospedaje;
        cat['Soporte TI'].Unidad += soporte;
        cat['Banca Elec.'].Unidad += banca;
        cat['Tributarios'].Unidad += tributos;
        cat['Chofer'].Unidad += chofer;
        cat['Limpieza'].Unidad += limpieza;
      }
    });

    const totalGlobal = totalAgencia + totalUnidad || 1;

    const bData = Object.keys(cat).map(key => ({
      categoria: key,
      'Agencia Móvil': cat[key].Agencia,
      'Unidad Móvil': cat[key].Unidad,
    })).filter(d => d['Agencia Móvil'] > 0 || d['Unidad Móvil'] > 0);

    return {
      barData: bData.sort((a, b) => (b['Agencia Móvil'] + b['Unidad Móvil']) - (a['Agencia Móvil'] + a['Unidad Móvil'])),
      agenciaStats: {
        total: totalAgencia,
        promedio: countAgencia > 0 ? totalAgencia / countAgencia : 0,
        pct: Math.round((totalAgencia / totalGlobal) * 100)
      },
      unidadStats: {
        total: totalUnidad,
        promedio: countUnidad > 0 ? totalUnidad / countUnidad : 0,
        pct: Math.round((totalUnidad / totalGlobal) * 100)
      }
    };
  }, [events]);

  const renderDonut = (stats: { total: number; promedio: number; pct: number }, label: string, color: string, emptyColor: string) => {
    const data = [
      { name: label, value: stats.pct },
      { name: 'Otros', value: 100 - stats.pct }
    ];

    return (
      <div className="flex flex-col items-center justify-center relative w-full h-48">
        <h4 className="text-xs font-bold text-gray-700 mb-1">{label}</h4>
        <div className="relative w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={65}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={color} />
                <Cell fill={emptyColor} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black" style={{ color }}>{stats.pct}%</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider -mt-1">Participación</span>
          </div>
        </div>
        <div className="mt-2 text-center">
          <p className="text-[10px] text-gray-500">Gasto Promedio / Jornada</p>
          <p className="font-bold text-sm text-gray-800">${stats.promedio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>
    );
  };

  return (
    <ChartModalWrapper 
      title="Análisis de Costos Globales"
      subtitle="Distribución comparativa de gastos entre Agencia Móvil y Unidad Móvil"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center w-full h-full min-h-[350px]">
        
        {/* Anillos de Participación */}
        <div className="lg:col-span-1 flex flex-col sm:flex-row lg:flex-col gap-6 justify-center items-center bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
          {renderDonut(agenciaStats, 'Agencia Móvil', '#00205C', '#E5E7EB')}
          <div className="w-full h-px sm:h-full sm:w-px lg:w-full lg:h-px bg-gray-200"></div>
          {renderDonut(unidadStats, 'Unidad Móvil', '#426095', '#E5E7EB')}
        </div>

        {/* Gráfico de Barras por Categoría */}
        <div className="lg:col-span-2 w-full h-full min-h-[300px]">
          <h4 className="text-sm font-bold text-gray-700 mb-4 text-center lg:text-left">Distribución de Gastos Totales por Categoría</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={barData} margin={{ top: 0, right: 50, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
              <YAxis type="category" dataKey="categoria" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#1F2937' }} width={100} />
              <Tooltip 
                formatter={(val: any, name: any) => [`$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]}
                contentStyle={{ backgroundColor: '#00205C', borderRadius: '12px', color: '#FFF', border: 'none' }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '15px' }} />
              <Bar dataKey="Agencia Móvil" stackId="a" fill="#00205C" radius={[0, 0, 0, 0]} barSize={24}>
                <LabelList dataKey="Agencia Móvil" content={(props: any) => {
                  const { x, y, width, height, value } = props;
                  if (!value || value === 0) return null;
                  const textVal = `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                  if (width < 45) return null; // Muy pequeño para Agencia, dependerá del Tooltip
                  return <text x={x + width / 2} y={y + height / 2 + 4} fill="#FFFFFF" fontSize={10} fontWeight="bold" textAnchor="middle">{textVal}</text>;
                }} />
              </Bar>
              <Bar dataKey="Unidad Móvil" stackId="a" fill="#426095" radius={[0, 4, 4, 0]} barSize={24}>
                <LabelList dataKey="Unidad Móvil" content={(props: any) => {
                  const { x, y, width, height, value } = props;
                  if (!value || value === 0) return null;
                  const textVal = `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                  if (width < 45) {
                    return <text x={x + width + 5} y={y + height / 2 + 4} fill="#6B7280" fontSize={10} fontWeight="bold" textAnchor="start">{textVal}</text>;
                  }
                  return <text x={x + width / 2} y={y + height / 2 + 4} fill="#FFFFFF" fontSize={10} fontWeight="bold" textAnchor="middle">{textVal}</text>;
                }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </ChartModalWrapper>
  );
}
