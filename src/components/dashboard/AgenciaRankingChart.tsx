"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend
} from 'recharts';

interface AgenciaRankingChartProps {
  events: any[];
}

const PIE_COLORS = ['#00205C', '#2C4A82', '#5975A8', '#85A0CE'];

export default function AgenciaRankingChart({ events }: AgenciaRankingChartProps) {
  const { ranking, activeCategories, categoryColors } = useMemo(() => {
    const agenciaEvents = events.filter(ev => ev.type === 'Agencia Móvil');
    
    // 1. Calculate global totals to match the Donut chart logic for exact colors
    let globalAlimentacion = 0;
    let globalTransporte = 0;
    let globalHospedaje = 0;
    let globalOtros = 0;

    agenciaEvents.forEach(ev => {
      const g = ev.gastos;
      if (!g) return;
      const tasa = g.tasaBcv || 1;
      globalAlimentacion += (g.alimentacionBs || 0) / tasa;
      globalTransporte += (g.transporteBs || 0) / tasa;
      globalHospedaje += (g.hospedajeBs || 0) / tasa;
      globalOtros += ((g.soporteTecnicoBs || 0) + (g.bancaElectronicaBs || 0) + (g.gastosTributariosBs || 0)) / tasa;
    });

    const globalCategories = [
      { name: 'Alimentación', value: globalAlimentacion },
      { name: 'Transporte', value: globalTransporte },
      { name: 'Hospedaje', value: globalHospedaje },
      { name: 'Otros (TI, Trib.)', value: globalOtros },
    ].filter(d => d.value > 0);

    const colorsMap: Record<string, string> = {};
    globalCategories.forEach((cat, index) => {
      colorsMap[cat.name] = PIE_COLORS[index % PIE_COLORS.length];
    });

    const activeCats = globalCategories.map(c => c.name);

    // 2. Calculate data per event
    const rankingData = agenciaEvents.map(ev => {
      const g = ev.gastos;
      const totalUsd = g?.totalUsd || 0;
      
      const tasa = g?.tasaBcv || 1;
      const alimentacion = ((g?.alimentacionBs || 0) / tasa) || 0;
      const transporte = ((g?.transporteBs || 0) / tasa) || 0;
      const hospedaje = ((g?.hospedajeBs || 0) / tasa) || 0;
      const otros = (((g?.soporteTecnicoBs || 0) + (g?.bancaElectronicaBs || 0) + (g?.gastosTributariosBs || 0)) / tasa) || 0;

      return {
        evento: ev.eventName,
        gastoUsd: totalUsd,
        'Alimentación': alimentacion > 0 ? alimentacion : undefined,
        'Transporte': transporte > 0 ? transporte : undefined,
        'Hospedaje': hospedaje > 0 ? hospedaje : undefined,
        'Otros (TI, Trib.)': otros > 0 ? otros : undefined,
      };
    }).sort((a, b) => b.gastoUsd - a.gastoUsd).slice(0, 10);

    return { ranking: rankingData, activeCategories: activeCats, categoryColors: colorsMap };
  }, [events]);

  return (
    <ChartModalWrapper
      title="Ranking de Eventos (Agencia Móvil)"
      subtitle="Top 10 eventos por costo operativo"
    >
      <div className="w-full h-full min-h-[480px] flex flex-col justify-center py-2">
        {ranking.length > 0 ? (
          <ResponsiveContainer width="100%" height={460}>
            <ComposedChart layout="vertical" data={ranking} margin={{ top: 10, right: 120, left: 220, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fontSize: 13, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
              <YAxis type="category" dataKey="evento" tick={{ fontSize: 12, fontWeight: 600, fill: '#1F2937' }} width={230} />
              <Tooltip 
                formatter={(val: any, name: any) => [
                  `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                  name === 'gastoUsd' ? 'Gasto Total' : name
                ]}
                contentStyle={{ backgroundColor: '#00205C', borderRadius: '12px', color: '#FFF', border: 'none' }}
                itemStyle={{ color: '#FFF' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              
              {/* Stacked bars for categories */}
              {activeCategories.map((cat, index) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={categoryColors[cat]} radius={
                  // Small visual trick to round only the last bar or all if we can't easily detect.
                  // For simplicity, we just use square corners inside the stack, and let recharts handle it.
                  [0, 0, 0, 0]
                } barSize={22} />
              ))}
              
              {/* Invisible line just to hold the LabelList with the Total at the end of the stack */}
              <Line dataKey="gastoUsd" stroke="transparent" dot={false} isAnimationActive={false}>
                <LabelList 
                  dataKey="gastoUsd" 
                  position="right" 
                  formatter={(val: any) => `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                  fill="#4B5563" 
                  fontSize={13} 
                  fontWeight="bold" 
                />
              </Line>

            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-gray-400">Sin eventos de Agencia Móvil registrados</div>
        )}
      </div>
    </ChartModalWrapper>
  );
}
