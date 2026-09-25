"use client";

import React, { useMemo } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { Users, CreditCard, CalendarRange, BarChart3 } from 'lucide-react';

export default function GlobalMonitoreoKPIs({ selectedMonths = [] }: { selectedMonths?: string[] }) {
  const { events, isLoading } = useAgenda();

  const globals = useMemo(() => {
    let clientesAtendidos = 0;
    let totalTdd = 0;
    let totalOtrasOperaciones = 0;
    let totalOperaciones = 0;
    let totalJornadas = 0;

    events.forEach(e => {
      // Filtrar estrictamente solo para Agencia Móvil, Unidad Móvil y Red de Agencias
      if (e.type !== 'Agencia Móvil' && e.type !== 'Unidad Móvil' && e.type !== 'Red de Agencias') return;
      if (selectedMonths.length > 0 && (!e.startDate || !selectedMonths.some(m => e.startDate?.startsWith(m)))) return;

      totalJornadas++;
      
      // Clientes Atendidos: equivale lógicamente a las cuentas abiertas
      clientesAtendidos += (e.cifras?.cuentasAbiertas || 0);
      
      // TDD
      totalTdd += (e.cifras?.tdd || 0);

      // Otras operaciones (reclamos, etc.)
      totalOtrasOperaciones += (e.cifras?.reclamos || 0);
      
      // Operaciones: cuentas + tdd + reclamos
      totalOperaciones += (e.cifras?.cuentasAbiertas || 0) + (e.cifras?.tdd || 0) + (e.cifras?.reclamos || 0);
    });

    return {
      clientesAtendidos,
      totalTdd,
      totalOtrasOperaciones,
      totalJornadas,
      totalOperaciones
    };
  }, [events, selectedMonths]);

  if (isLoading) return null;

  return (
    <section className="w-full relative px-6 md:px-8 max-w-[1920px] mx-auto z-20 mb-6">
      <div className="flex flex-col xl:flex-row items-center justify-center gap-6 w-full">
        
        {/* Bloque Introductorio: Impacto Nacional + Jornadas/Ops */}
        <div className="flex flex-col sm:flex-row items-center bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden shrink-0">
          {/* Insignia / Título */}
          <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-slate-50 to-transparent border-b sm:border-b-0 sm:border-r border-slate-200/60">
            <div className="w-1.5 h-10 bg-gradient-to-b from-[#00205B] to-[#FE5000] rounded-full shrink-0"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Impacto</span>
              <span className="text-base font-black text-[#00205B] tracking-tight leading-none">NACIONAL</span>
            </div>
          </div>
          {/* Jornadas y Operaciones Integradas */}
          <div className="flex items-center divide-x divide-slate-200/60">
            <div className="flex flex-col items-center justify-center px-6 py-3 min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <CalendarRange className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Jornadas</span>
              </div>
              <span className="text-xl font-black text-[#00205B] leading-none">{globals.totalJornadas.toLocaleString('es-VE')}</span>
            </div>
            <div className="flex flex-col items-center justify-center px-6 py-3 min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Operaciones</span>
              </div>
              <span className="text-xl font-black text-[#00205B] leading-none">{globals.totalOperaciones.toLocaleString('es-VE')}</span>
            </div>
          </div>
        </div>

        {/* Tarjetas Principales Centradas */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* KPI 1: Clientes Atendidos */}
          <div className="w-full sm:w-[260px] flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-slate-200/80 p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FE5000]" />
            <div className="p-2.5 bg-[#FE5000]/10 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-[#FE5000]" />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Clientes Atendidos</p>
              <p className="text-2xl font-black text-[#00205B] leading-none tracking-tight">
                {globals.clientesAtendidos.toLocaleString('es-VE')}
              </p>
            </div>
          </div>

          {/* KPI 2: Total TDD */}
          <div className="w-full sm:w-[260px] flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-slate-200/80 p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
            <div className="p-2.5 bg-indigo-500/10 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">TDD Entregadas</p>
              <p className="text-2xl font-black text-[#00205B] leading-none tracking-tight">
                {globals.totalTdd.toLocaleString('es-VE')}
              </p>
            </div>
          </div>

          {/* KPI 3: Otras Operaciones y Servicios */}
          <div className="w-full sm:w-[260px] flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-slate-200/80 p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />
            <div className="p-2.5 bg-cyan-500/10 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Otras Operaciones</p>
              <p className="text-2xl font-black text-[#00205B] leading-none tracking-tight">
                {globals.totalOtrasOperaciones.toLocaleString('es-VE')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
