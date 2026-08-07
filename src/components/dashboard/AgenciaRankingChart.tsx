"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';

interface AgenciaRankingChartProps {
  events: any[];
}

const PIE_COLORS = ['#00205C', '#2C4A82', '#5975A8', '#85A0CE'];

export default function AgenciaRankingChart({ events }: AgenciaRankingChartProps) {
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
      title="Ranking de Eventos (Agencia Móvil)"
      subtitle="Top 10 eventos por costo operativo"
    >
<div className="lg:col-span-2 w-full h-full min-h-[450px]">
          <h4 className="text-sm font-bold text-gray-700 mb-4 text-center lg:text-left">Ranking de Eventos por Costo Operativo (Top 10)</h4>
          {ranking.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={ranking} margin={{ top: 0, right: 120, left: 220, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
                <XAxis type="number" tick={{ fontSize: 15, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
                <YAxis type="category" dataKey="evento" tick={{ fontSize: 13, fontWeight: 'bold', fill: '#1F2937' }} width={240} />
                <Tooltip 
                  formatter={(val: any, name: any) => [`$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Gasto Total']}
                  contentStyle={{ backgroundColor: '#00205C', borderRadius: '12px', color: '#FFF', border: 'none' }}
                />
                <Bar dataKey="gastoUsd" name="Gasto Total" fill="#00205C" radius={[0, 4, 4, 0]} barSize={24}>
                  <LabelList 
                    dataKey="gastoUsd" 
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
            <div className="flex h-full items-center justify-center text-sm text-gray-400">Sin eventos de Agencia Móvil registrados</div>
          )}
        </div>
    </ChartModalWrapper>
  );
}
