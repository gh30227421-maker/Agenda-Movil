"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts';
import { TrendingUp, DollarSign, CreditCard, Users, CheckCircle2 } from 'lucide-react';

interface RentabilidadTopEventosChartProps {
  events: any[];
}

const TOP_COLORS = [
  '#00205C', '#1A366E', '#2C4A82', '#405E96', '#5975A8',
  '#6F8CBA', '#85A0CE', '#9CB6DE', '#B5CEEE', '#CFE4FD'
];

export default function RentabilidadTopEventosChart({ events }: RentabilidadTopEventosChartProps) {
  const ranking = useMemo(() => {
    return events.map(ev => {
      const tasaBcv = ev.gastos?.tasaBcv || 1;
      const saldosBs = ev.cifras?.saldosCaptadosBs || 0;
      const saldoDivisas = ev.cifras?.saldoCierreDivisas || 0;
      const saldoUsd = (tasaBcv > 0 ? saldosBs / tasaBcv : 0) + saldoDivisas;

      let gastoUsd = 0;
      const g = ev.gastos;
      if (g) {
        const totalCostosBs = (g.alimentacionBs || 0) + (g.transporteBs || 0) + (g.hospedajeBs || 0) + 
                              (g.soporteTecnicoBs || 0) + (g.bancaElectronicaBs || 0) + (g.gastosTributariosBs || 0) + 
                              (g.conductorAyudanteBs || 0) + (g.mantenimientoLimpiezaBs || 0) + (g.gastoCombustibleBs || 0);
        gastoUsd = tasaBcv > 0 ? totalCostosBs / tasaBcv : (g.totalUsd || 0);
      }

      const rentabilidadUsd = saldoUsd - gastoUsd;
      const margenPct = saldoUsd > 0 ? Math.round((rentabilidadUsd / saldoUsd) * 100) : 0;

      return {
        id: ev.id,
        eventName: ev.eventName,
        type: ev.type,
        state: ev.state || 'N/A',
        region: ev.region || '',
        startDate: ev.startDate || '',
        saldoUsd,
        gastoUsd,
        rentabilidadUsd,
        margenPct,
        cuentas: ev.cifras?.cuentasAbiertas || 0,
        tdd: ev.cifras?.tdd || 0,
        gastosBreakdown: g ? {
          alimentacion: (g.alimentacionBs || 0) / tasaBcv,
          transporte: (g.transporteBs || 0) / tasaBcv,
          hospedaje: (g.hospedajeBs || 0) / tasaBcv,
          soporte: (g.soporteTecnicoBs || 0) / tasaBcv,
          banca: (g.bancaElectronicaBs || 0) / tasaBcv,
          tributos: (g.gastosTributariosBs || 0) / tasaBcv,
          chofer: (g.conductorAyudanteBs || 0) / tasaBcv,
          limpieza: (g.mantenimientoLimpiezaBs || 0) / tasaBcv,
          combustible: (g.gastoCombustibleBs || 0) / tasaBcv,
        } : null
      };
    }).sort((a, b) => b.rentabilidadUsd - a.rentabilidadUsd);
  }, [events]);

  const isSingleEvent = events.length === 1;
  const singleEvent = ranking[0];

  return (
    <ChartModalWrapper
      title={isSingleEvent ? `Desglose de Rentabilidad: ${singleEvent.eventName}` : "Top Eventos Más Rentables"}
      subtitle={isSingleEvent ? `Detalle financiero y retorno del operativo individual (${singleEvent.state})` : "Operativos con mayor rendimiento financiero y retorno neto"}
    >
      <div className="w-full h-full min-h-[460px] flex flex-col justify-center py-2">
        {ranking.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-400">
            Sin eventos registrados para este filtro
          </div>
        ) : isSingleEvent ? (
          /* Vista Detallada para Evento Individual */
          <div className="w-full h-full flex flex-col justify-between space-y-4 p-2">
            {/* KPIs Clave del Evento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Saldo Captado</span>
                <span className="text-lg font-black text-[#00205B] block mt-0.5">
                  ${singleEvent.saldoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 text-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Gasto Total</span>
                <span className="text-lg font-black text-[#FE5000] block mt-0.5">
                  ${singleEvent.gastoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 text-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Rentabilidad Neta</span>
                <span className="text-lg font-black text-emerald-700 block mt-0.5">
                  +${singleEvent.rentabilidadUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Margen Neto</span>
                <span className={`text-lg font-black block mt-0.5 ${singleEvent.margenPct >= 50 ? 'text-emerald-700' : 'text-amber-600'}`}>
                  {singleEvent.margenPct}%
                </span>
              </div>
            </div>

            {/* Comparativa Visual Ingreso vs Gasto */}
            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 space-y-3">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Composición de Eficiencia Financiera</h5>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-600">Saldo Captado (Cierre):</span>
                    <span className="text-[#00205B] font-bold">${singleEvent.saldoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div className="bg-[#00205B] h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-600">Costo Operativo Absorbido ({singleEvent.saldoUsd > 0 ? ((singleEvent.gastoUsd / singleEvent.saldoUsd) * 100).toFixed(1) : 0}%):</span>
                    <span className="text-[#FE5000] font-bold">${singleEvent.gastoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#FE5000] h-full rounded-full" 
                      style={{ width: `${Math.min(100, singleEvent.saldoUsd > 0 ? (singleEvent.gastoUsd / singleEvent.saldoUsd) * 100 : 0)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen Operativo */}
            <div className="grid grid-cols-3 gap-3 text-center pt-1">
              <div className="border border-gray-100 rounded-lg p-2.5 bg-white">
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Cuentas</span>
                <span className="text-base font-bold text-gray-800">{singleEvent.cuentas}</span>
              </div>
              <div className="border border-gray-100 rounded-lg p-2.5 bg-white">
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Tarjetas TDD</span>
                <span className="text-base font-bold text-gray-800">{singleEvent.tdd}</span>
              </div>
              <div className="border border-gray-100 rounded-lg p-2.5 bg-white">
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Canal</span>
                <span className="text-xs font-bold text-[#00205B]">{singleEvent.type}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Vista de Ranking para Múltiples Eventos (Top 8-10) */
          <ResponsiveContainer width="100%" height={440}>
            <BarChart layout="vertical" data={ranking.slice(0, 10)} margin={{ top: 10, right: 130, left: 200, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 13, fill: '#6B7280' }} 
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} 
              />
              <YAxis 
                type="category" 
                dataKey="eventName" 
                tick={{ fontSize: 12, fontWeight: 600, fill: '#1F2937' }} 
                width={195} 
              />
              <Tooltip 
                formatter={(val: any, name: any, item: any) => {
                  const p = item.payload;
                  return [
                    <div key="tooltip-content" className="space-y-1 text-xs">
                      <p className="font-bold text-white border-b border-blue-900 pb-1 mb-1">{p.eventName} ({p.state})</p>
                      <p><span className="text-gray-300">Canal:</span> <span className="font-semibold text-white">{p.type}</span></p>
                      <p><span className="text-gray-300">Saldo Captado:</span> <span className="font-bold text-white">${p.saldoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
                      <p><span className="text-gray-300">Gasto Total:</span> <span className="font-bold text-[#FFA07A]">${p.gastoUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
                      <p><span className="text-gray-300">Rentabilidad Neta:</span> <span className="font-bold text-[#A7F3D0]">${p.rentabilidadUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
                      <p><span className="text-gray-300">Margen Neto:</span> <span className="font-bold text-white">{p.margenPct}%</span></p>
                    </div>,
                    'Detalle del Evento'
                  ];
                }}
                contentStyle={{ backgroundColor: '#00205C', borderRadius: '12px', color: '#FFF', border: 'none', padding: '12px' }}
              />
              <Bar dataKey="rentabilidadUsd" name="Rentabilidad Neta" radius={[0, 4, 4, 0]} barSize={22}>
                {ranking.slice(0, 10).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.rentabilidadUsd >= 0 ? TOP_COLORS[index % TOP_COLORS.length] : '#E11D48'} 
                  />
                ))}
                <LabelList 
                  dataKey="rentabilidadUsd" 
                  position="right" 
                  formatter={(val: any) => {
                    const num = Number(val);
                    const prefix = num >= 0 ? '+' : '';
                    return `${prefix}$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                  }} 
                  fill="#1E293B" 
                  fontSize={13} 
                  fontWeight="bold" 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartModalWrapper>
  );
}
