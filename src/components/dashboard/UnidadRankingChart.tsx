"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend
} from 'recharts';

interface UnidadRankingChartProps {
  events: any[];
}

const BLUE_SCALE = [
  '#00205C', '#1A366E', '#2C4A82', '#405E96', '#5975A8',
  '#6F8CBA', '#85A0CE', '#9CB6DE', '#B5CEEE', '#CFE4FD'
];

export default function UnidadRankingChart({ events }: UnidadRankingChartProps) {
  const { ranking, activeCategories, categoryColors } = useMemo(() => {
    const unidadEvents = events.filter(ev => ev.type === 'Unidad Móvil');
    
    // 1. Calculate global totals to match the Donut chart logic for exact colors
    let globalSoporte = 0;
    let globalChofer = 0;
    let globalMantenimiento = 0;
    let globalAlimentacion = 0;
    let globalTransporte = 0;
    let globalCombustible = 0;
    let globalHospedaje = 0;
    let globalBanca = 0;
    let globalTributos = 0;

    unidadEvents.forEach(ev => {
      const g = ev.gastos;
      if (!g) return;
      const tasa = g.tasaBcv || 1;
      globalSoporte += (g.soporteTecnicoBs || 0) / tasa;
      globalChofer += (g.conductorAyudanteBs || 0) / tasa;
      globalMantenimiento += (g.mantenimientoLimpiezaBs || 0) / tasa;
      globalAlimentacion += (g.alimentacionBs || 0) / tasa;
      globalTransporte += (g.transporteBs || 0) / tasa;
      globalCombustible += (g.gastoCombustibleBs || 0) / tasa;
      globalHospedaje += (g.hospedajeBs || 0) / tasa;
      globalBanca += (g.bancaElectronicaBs || 0) / tasa;
      globalTributos += (g.gastosTributariosBs || 0) / tasa;
    });

    const globalCategories = [
      { name: 'Soporte TI', value: globalSoporte },
      { name: 'Chofer / Ayudante', value: globalChofer },
      { name: 'Mantenimiento / Limpieza', value: globalMantenimiento },
      { name: 'Alimentación', value: globalAlimentacion },
      { name: 'Transporte / Logística', value: globalTransporte },
      { name: 'Combustible', value: globalCombustible },
      { name: 'Hospedaje', value: globalHospedaje },
      { name: 'Banca Electrónica', value: globalBanca },
      { name: 'Tributos', value: globalTributos },
    ].filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    const colorsMap: Record<string, string> = {};
    globalCategories.forEach((cat, index) => {
      colorsMap[cat.name] = BLUE_SCALE[index % BLUE_SCALE.length];
    });

    const activeCats = globalCategories.map(c => c.name);

    // 2. Calculate data per event
    const rankingData = unidadEvents.map(ev => {
      const g = ev.gastos;
      const totalUsd = g?.totalUsd || 0;
      
      const tasa = g?.tasaBcv || 1;
      const soporte = ((g?.soporteTecnicoBs || 0) / tasa) || 0;
      const chofer = ((g?.conductorAyudanteBs || 0) / tasa) || 0;
      const mantenimiento = ((g?.mantenimientoLimpiezaBs || 0) / tasa) || 0;
      const alimentacion = ((g?.alimentacionBs || 0) / tasa) || 0;
      const transporte = ((g?.transporteBs || 0) / tasa) || 0;
      const combustible = ((g?.gastoCombustibleBs || 0) / tasa) || 0;
      const hospedaje = ((g?.hospedajeBs || 0) / tasa) || 0;
      const banca = ((g?.bancaElectronicaBs || 0) / tasa) || 0;
      const tributos = ((g?.gastosTributariosBs || 0) / tasa) || 0;

      return {
        evento: ev.eventName,
        gastoUsd: totalUsd,
        'Soporte TI': soporte > 0 ? soporte : undefined,
        'Chofer / Ayudante': chofer > 0 ? chofer : undefined,
        'Mantenimiento / Limpieza': mantenimiento > 0 ? mantenimiento : undefined,
        'Alimentación': alimentacion > 0 ? alimentacion : undefined,
        'Transporte / Logística': transporte > 0 ? transporte : undefined,
        'Combustible': combustible > 0 ? combustible : undefined,
        'Hospedaje': hospedaje > 0 ? hospedaje : undefined,
        'Banca Electrónica': banca > 0 ? banca : undefined,
        'Tributos': tributos > 0 ? tributos : undefined,
      };
    }).sort((a, b) => b.gastoUsd - a.gastoUsd).slice(0, 10);

    return { ranking: rankingData, activeCategories: activeCats, categoryColors: colorsMap };
  }, [events]);

  return (
    <ChartModalWrapper
      title="Ranking de Eventos (Unidad Móvil)"
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
                contentStyle={{ backgroundColor: '#FE5000', borderRadius: '12px', color: '#FFF', border: 'none' }}
                itemStyle={{ color: '#FFF' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              
              {/* Stacked bars for categories */}
              {activeCategories.map((cat, index) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={categoryColors[cat]} radius={[0, 0, 0, 0]} barSize={22} />
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
          <div className="flex h-64 items-center justify-center text-sm text-gray-400">Sin eventos de Unidad Móvil registrados</div>
        )}
      </div>
    </ChartModalWrapper>
  );
}


