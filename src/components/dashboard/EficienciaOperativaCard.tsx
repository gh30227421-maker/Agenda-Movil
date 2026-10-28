"use client";

import React, { useMemo } from 'react';
import ChartModalWrapper from './ChartModalWrapper';
import { ShieldCheck, CreditCard, Award, TrendingUp, Sparkles, Building2, Users } from 'lucide-react';

interface EficienciaOperativaCardProps {
  events: any[];
}

export default function EficienciaOperativaCard({ events }: EficienciaOperativaCardProps) {
  const metrics = useMemo(() => {
    let totalCuentas = 0;
    let totalTdd = 0;
    const stateCounts: Record<string, number> = {};
    const channelCounts: Record<string, number> = {};

    events.forEach(ev => {
      const c = ev.cifras;
      const cuentas = c?.cuentasAbiertas || 0;
      const tdd = c?.tdd || 0;

      totalCuentas += cuentas;
      totalTdd += tdd;

      const state = ev.estadoOperativo || ev.state || 'Sin Estado';
      stateCounts[state] = (stateCounts[state] || 0) + cuentas;

      const channel = ev.type || 'Otros';
      channelCounts[channel] = (channelCounts[channel] || 0) + cuentas;
    });

    const conversionRate = totalCuentas > 0 ? Math.min(Math.round((totalTdd / totalCuentas) * 100), 100) : 0;
    const promedioJornada = events.length > 0 ? Math.round(totalCuentas / events.length) : 0;

    // Top state
    let topState = 'N/A';
    let topStateCount = 0;
    Object.entries(stateCounts).forEach(([st, cnt]) => {
      if (cnt > topStateCount) {
        topStateCount = cnt;
        topState = st;
      }
    });

    // Top channel
    let topChannel = 'Agencia Móvil';
    let topChannelCount = 0;
    Object.entries(channelCounts).forEach(([ch, cnt]) => {
      if (cnt > topChannelCount) {
        topChannelCount = cnt;
        topChannel = ch;
      }
    });

    return {
      totalCuentas,
      totalTdd,
      conversionRate,
      promedioJornada,
      topState,
      topStateCount,
      topChannel,
      topChannelCount,
      totalJornadas: events.length
    };
  }, [events]);

  return (
    <ChartModalWrapper
      title="Gestión Operativa y Bancarización"
    >
      <div className="w-full h-full min-h-[400px] flex flex-col justify-between py-1">
        
        {/* Bloque 1: Tasa de Bancarización Inmediata */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#009639]" />
              Bancarización Inmediata (TDD / Cuentas)
            </span>
            <span className="text-xl font-black text-[#00205B]">{metrics.conversionRate}%</span>
          </div>

          {/* Barra de Progreso Dinámica */}
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#FE5000] via-[#009639] to-[#00205B] rounded-full transition-all duration-1000"
              style={{ width: `${metrics.conversionRate}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mt-2">
            <span>{metrics.totalTdd.toLocaleString('es-VE')} TDDs entregadas</span>
            <span>{metrics.totalCuentas.toLocaleString('es-VE')} Cuentas abiertas</span>
          </div>
        </div>

        {/* Bloque 2: Tres Micro-Indicadores de Desempeño */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
          
          {/* Promedio por Jornada */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Promedio Diario</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#FE5000]" />
            </div>
            <p className="text-xl font-black text-[#00205B]">{metrics.promedioJornada}</p>
            <p className="text-[10px] text-slate-500 font-semibold">Cuentas / Jornada</p>
          </div>

          {/* Estado Líder */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado Líder</span>
              <Award className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-sm font-black text-[#00205B] truncate" title={metrics.topState}>{metrics.topState}</p>
            <p className="text-[10px] text-slate-500 font-semibold">{metrics.topStateCount.toLocaleString('es-VE')} Cuentas</p>
          </div>

          {/* Canal Principal */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canal Principal</span>
              <Building2 className="w-3.5 h-3.5 text-[#00205B]" />
            </div>
            <p className="text-sm font-black text-[#00205B] truncate" title={metrics.topChannel}>{metrics.topChannel}</p>
            <p className="text-[10px] text-slate-500 font-semibold">{metrics.topChannelCount.toLocaleString('es-VE')} Cuentas</p>
          </div>

        </div>

        {/* Bloque 3: Banner Informativo & Espacio Modular */}
        <div className="bg-gradient-to-r from-blue-50/80 to-orange-50/50 rounded-xl p-3 border border-blue-100/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#00205B] flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-4 h-4 text-[#FE5000]" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold text-[#00205B] leading-tight">Espacio Modular de Analítica</p>
              <p className="text-[11px] text-slate-500 font-medium">Disponible para incorporar nueva gráfica o reporte en futuras fases.</p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-white text-[#00205B] text-[10px] font-bold uppercase tracking-wider border border-slate-200 shadow-xs">
            Reservado
          </span>
        </div>

      </div>
    </ChartModalWrapper>
  );
}
