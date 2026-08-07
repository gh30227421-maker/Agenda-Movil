"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';

interface CostosCategoriasChartProps {
  events: any[];
}

export default function CostosCategoriasChart({ events }: CostosCategoriasChartProps) {
  const barData = useMemo(() => {
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

      if (ev.type === 'Agencia Móvil') {
        cat['Alimentación'].Agencia += alimentacion;
        cat['Transporte'].Agencia += transporte;
        cat['Hospedaje'].Agencia += hospedaje;
        cat['Soporte TI'].Agencia += soporte;
        cat['Banca Elec.'].Agencia += banca;
        cat['Tributarios'].Agencia += tributos;
        cat['Chofer'].Agencia += chofer;
        cat['Limpieza'].Agencia += limpieza;
      } else if (ev.type === 'Unidad Móvil') {
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

    const bData = Object.keys(cat).map(key => ({
      categoria: key,
      'Agencia Móvil': cat[key].Agencia,
      'Unidad Móvil': cat[key].Unidad,
    })).filter(d => d['Agencia Móvil'] > 0 || d['Unidad Móvil'] > 0);

    return bData.sort((a, b) => (b['Agencia Móvil'] + b['Unidad Móvil']) - (a['Agencia Móvil'] + a['Unidad Móvil']));
  }, [events]);

  return (
    <ChartModalWrapper
      title="Distribución por Categoría de Gasto"
      subtitle="Análisis comparativo de gastos operativos"
    >
      <div className="w-full h-full min-h-[350px]">
        <h4 className="text-sm font-bold text-gray-700 mb-4 text-center lg:text-left">Distribución de Gastos Totales por Categoría</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={barData} margin={{ top: 0, right: 120, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
            <XAxis type="number" tick={{ fontSize: 15, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
            <YAxis type="category" dataKey="categoria" tick={{ fontSize: 15, fontWeight: 'bold', fill: '#1F2937' }} width={100} />
            <Tooltip 
              formatter={(val: any, name: any) => [`$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]}
              contentStyle={{ backgroundColor: '#00205C', borderRadius: '12px', color: '#FFF', border: 'none' }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '15px', paddingBottom: '15px' }} />
            <Bar dataKey="Agencia Móvil" stackId="a" fill="#00205C" radius={[0, 0, 0, 0]} barSize={24}>
              <LabelList dataKey="Agencia Móvil" content={(props: any) => {
                const { x, y, width, height, value } = props;
                if (!value || value === 0) return null;
                const textVal = `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                if (width < 45) return null;
                return <text x={x + width / 2} y={y + height / 2 + 4} fill="#FFFFFF" fontSize={14} fontWeight="bold" textAnchor="middle">{textVal}</text>;
              }} />
            </Bar>
            <Bar dataKey="Unidad Móvil" stackId="a" fill="#426095" radius={[0, 4, 4, 0]} barSize={24}>
              <LabelList dataKey="Unidad Móvil" content={(props: any) => {
                const { x, y, width, height, value } = props;
                if (!value || value === 0) return null;
                const textVal = `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                if (width < 45) {
                  return <text x={x + width + 5} y={y + height / 2 + 4} fill="#6B7280" fontSize={14} fontWeight="bold" textAnchor="start">{textVal}</text>;
                }
                return <text x={x + width / 2} y={y + height / 2 + 4} fill="#FFFFFF" fontSize={14} fontWeight="bold" textAnchor="middle">{textVal}</text>;
              }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartModalWrapper>
  );
}
