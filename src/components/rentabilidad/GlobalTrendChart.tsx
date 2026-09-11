"use client";

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GlobalTrendChartProps {
  events: any[];
  trackings: any[];
}

export default function GlobalTrendChart({ events, trackings }: GlobalTrendChartProps) {
  const data = useMemo(() => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      mes: `M${i + 1}`,
      totalUsd: 0,
      count: 0
    }));

    events.forEach(ev => {
      const eventTrackings = trackings.filter(t => t.eventId === ev.id && t.status === 'Cerrado');
      const eventTasaBcv = ev.gastos?.tasaBcv || ev.tasaBcvRentabilidad || 1;

      eventTrackings.forEach(t => {
        const mIndex = t.monthIndex - 1;
        if (mIndex >= 0 && mIndex < 12) {
          const rate = t.tasaBcv || eventTasaBcv;
          const usd = (t.saldoActivo || 0) / rate;
          monthlyData[mIndex].totalUsd += usd;
          monthlyData[mIndex].count += 1;
        }
      });
    });

    return monthlyData;
  }, [events, trackings]);

  // Si no hay datos, no renderizar gráfico
  const hasData = data.some(d => d.totalUsd > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-[#00205B]">Tendencia Global de Efectividad</h3>
        <p className="text-sm text-gray-500">Acumulado mensual en USD de todos los operativos activos</p>
      </div>
      
      <div className="h-[250px] w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis 
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                tick={{ fontSize: 12, fill: '#6B7280' }} 
                axisLine={false} 
                tickLine={false} 
                width={60}
              />
              <Tooltip 
                formatter={(val: number) => [`$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Total USD']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="totalUsd" 
                stroke="#10B981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorUsd)" 
                activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Sin datos históricos suficientes
          </div>
        )}
      </div>
    </div>
  );
}
