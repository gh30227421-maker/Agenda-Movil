"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';

interface AgenciaRankingChartProps {
  events: any[];
}

export default function AgenciaRankingChart({ events }: AgenciaRankingChartProps) {
  const ranking = useMemo(() => {
    const agenciaEvents = events.filter(ev => ev.type === 'Agencia Móvil');
    
    return agenciaEvents.map(ev => {
      const g = ev.gastos;
      const totalUsd = g?.totalUsd || 0;
      return {
        evento: ev.eventName,
        gastoUsd: totalUsd,
      };
    }).sort((a, b) => b.gastoUsd - a.gastoUsd).slice(0, 10);
  }, [events]);

  return (
    <ChartModalWrapper
      title="Ranking de Eventos (Agencia Móvil)"
      subtitle="Top 10 eventos por costo operativo"
    >
      <div className="w-full h-full min-h-[480px] flex flex-col justify-center py-2">
        {ranking.length > 0 ? (
          <ResponsiveContainer width="100%" height={460}>
            <BarChart layout="vertical" data={ranking} margin={{ top: 10, right: 120, left: 220, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fontSize: 13, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
              <YAxis type="category" dataKey="evento" tick={{ fontSize: 12, fontWeight: 600, fill: '#1F2937' }} width={230} />
              <Tooltip 
                formatter={(val: any) => [`$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Gasto Total']}
                contentStyle={{ backgroundColor: '#00205C', borderRadius: '12px', color: '#FFF', border: 'none' }}
              />
              <Bar dataKey="gastoUsd" name="Gasto Total" fill="#00205C" radius={[0, 4, 4, 0]} barSize={22}>
                <LabelList 
                  dataKey="gastoUsd" 
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
          <div className="flex h-64 items-center justify-center text-sm text-gray-400">Sin eventos de Agencia Móvil registrados</div>
        )}
      </div>
    </ChartModalWrapper>
  );
}
