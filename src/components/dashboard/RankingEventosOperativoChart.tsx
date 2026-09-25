"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList 
} from 'recharts';

interface RankingEventosOperativoChartProps {
  events: any[];
}

export default function RankingEventosOperativoChart({ events }: RankingEventosOperativoChartProps) {
  const data = useMemo(() => {
    return events.map(ev => {
      const cuentas = ev.cifras?.cuentasAbiertas || 0;
      return {
        name: ev.eventName && ev.eventName.trim() !== '' ? ev.eventName : (ev.title || `Operativo ${ev.id?.substring(0,4) || 'N/A'}`),
        cuentas,
        state: ev.state || 'N/A'
      };
    })
    .filter(ev => ev.cuentas > 0)
    .sort((a, b) => b.cuentas - a.cuentas)
    .slice(0, 7); // Top 7 eventos
  }, [events]);

  return (
    <ChartModalWrapper
      title="Ranking de eventos con mayor captación"
      subtitle="Top 7 jornadas con mayor volumen de cuentas abiertas"
    >
      <div className="w-full h-full min-h-[400px]">
        <h4 className="text-sm font-bold text-gray-700 mb-4 text-center lg:text-left">
          Cuentas Abiertas por Evento
        </h4>
        
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ top: 10, right: 60, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
              <XAxis 
                type="number" 
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]} 
                tick={{ fontSize: 13, fill: '#6B7280' }} 
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 11, fontWeight: 'bold', fill: '#1F2937' }} 
                width={170}
                tickFormatter={(value) => value.length > 26 ? value.substring(0, 26) + '...' : value}
              />
              <Tooltip 
                formatter={(val: number) => [val.toLocaleString('es-VE'), 'Cuentas Abiertas']}
                labelFormatter={(label) => `Evento: ${label}`}
                contentStyle={{ backgroundColor: '#00205B', borderRadius: '12px', color: '#FFF', border: 'none' }}
              />
              
              <Bar dataKey="cuentas" fill="#00205B" radius={[0, 6, 6, 0]} barSize={26}>
                <LabelList 
                  dataKey="cuentas" 
                  position="right" 
                  fill="#1F2937" 
                  fontSize={14} 
                  fontWeight="900" 
                  formatter={(val: number) => val.toLocaleString('es-VE')}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full min-h-[250px] items-center justify-center text-sm text-gray-400">
            No hay eventos operativos con captación para los filtros seleccionados
          </div>
        )}
      </div>
    </ChartModalWrapper>
  );
}
