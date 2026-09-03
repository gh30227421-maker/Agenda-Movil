"use client";

import React, { useMemo } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { CalendarRange, BarChart3 } from 'lucide-react';

export default function HeroKPIs() {
  const { events, isLoading } = useAgenda();

  const globals = useMemo(() => {
    let totalOperaciones = 0;
    const totalJornadas = events.length;

    events.forEach(e => {
      totalOperaciones += (e.cifras?.cuentasAbiertas || 0) + (e.cifras?.tdd || 0) + (e.cifras?.reclamos || 0);
    });

    return { totalJornadas, totalOperaciones };
  }, [events]);

  if (isLoading) return null;

  return (
    <div className="flex items-center gap-4 border-r border-slate-200/50 pr-4 mr-2">
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1.5 mb-0.5">
          <CalendarRange className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Jornadas</span>
        </div>
        <span className="text-sm font-black text-[#00205B] leading-none">{globals.totalJornadas.toLocaleString('es-VE')}</span>
      </div>
      <div className="w-px h-6 bg-slate-200/50" />
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1.5 mb-0.5">
          <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ops</span>
        </div>
        <span className="text-sm font-black text-[#00205B] leading-none">{globals.totalOperaciones.toLocaleString('es-VE')}</span>
      </div>
    </div>
  );
}
