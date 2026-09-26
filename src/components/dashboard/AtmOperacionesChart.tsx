"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface AtmOperacionesChartProps {
  events: any[];
}

export default function AtmOperacionesChart({ events }: AtmOperacionesChartProps) {
  const { consultas, retiros, claves, total } = useMemo(() => {
    let c = 0;
    let r = 0;
    let cl = 0;
    
    events.forEach(ev => {
      if (ev.cifras) {
        c += ev.cifras.atmConsultas || 0;
        r += ev.cifras.atmRetiros || 0;
        cl += ev.cifras.atmCambioClave || 0;
      }
    });

    return {
      consultas: c,
      retiros: r,
      claves: cl,
      total: c + r + cl
    };
  }, [events]);

  const data = [
    { name: 'Consultas', value: consultas, color: '#00205B' }, // Azul BNC
    { name: 'Retiros', value: retiros, color: '#FE5000' },     // Naranja BNC
    { name: 'Cambio Clave', value: claves, color: '#009639' }, // Verde BNC
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-slate-100 min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
            <p className="text-sm font-bold text-slate-700">{data.name}</p>
          </div>
          <div className="flex justify-between items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">Volumen</p>
            <p className="text-lg font-black text-slate-800">{data.value.toLocaleString('de-DE')}</p>
          </div>
          <div className="flex justify-between items-center mt-1 border-t border-slate-100 pt-1">
            <p className="text-xs text-slate-400">Participación</p>
            <p className="text-xs font-bold text-slate-600">{percent}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const hasData = total > 0;

  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, index, value }: any) => {
    if (percent === 0) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.35;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const boxWidth = 64;
    const boxHeight = 44;
    
    const adjustedY = y - boxHeight / 2;
    const adjustedX = x > cx ? x : x - boxWidth;

    return (
      <foreignObject x={adjustedX} y={adjustedY} width={boxWidth} height={boxHeight} className="overflow-visible pointer-events-none">
        <div 
          className="bg-white/95 backdrop-blur-sm rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center justify-center w-full h-full"
          style={{ borderTop: `3px solid ${data[index].color}` }}
        >
          <span className="text-sm font-black text-slate-800 leading-none">{value.toLocaleString('de-DE')}</span>
          <span className="text-[10px] font-bold text-slate-400 mt-1">{(percent * 100).toFixed(0)}%</span>
        </div>
      </foreignObject>
    );
  };

  return (
    <ChartModalWrapper 
      title="Distribución de Operaciones ATM" 
      subtitle="Consultas, Retiros y Cambios de Clave"
      fullWidth={false}
    >
      {hasData ? (
        <div className="h-64 sm:h-72 w-full mt-4 flex justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs font-bold text-slate-700 ml-1">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Total centralizado */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-18px]">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
            <p className="text-xl sm:text-2xl font-black text-[#00205B] leading-none">
              {total > 999 ? `${(total/1000).toFixed(1)}k` : total}
            </p>
          </div>
        </div>
      ) : (
        <div className="h-64 w-full flex items-center justify-center">
          <p className="text-sm font-medium text-slate-400">No hay datos de operaciones ATM</p>
        </div>
      )}
    </ChartModalWrapper>
  );
}
