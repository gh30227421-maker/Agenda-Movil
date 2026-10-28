import React from 'react';
import { Radar } from 'lucide-react';
import SystemStatus from '@/components/ui/SystemStatus';
import RutasDashboardClient from '@/components/rutas/RutasDashboardClient';

export const metadata = {
  title: 'Monitoreo Móvil | Impacto Corporativo',
};

export default function RutasPage() {
  return (
    <div className="relative z-10 flex flex-col w-full h-full text-[#00205B] overflow-visible pb-12">
      
      {/* Fondo Gradiente + Malla de Puntos Financiera */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-slate-100/80 to-slate-200/50" />
      <div 
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, #94A3B8 0.5px, transparent 0.5px)',
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Hero Section Compacta y Ejecutiva (Centro de Comando) */}
      <div className="relative w-full mb-2.5 max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 z-30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Radar className="w-6 h-6 sm:w-8 sm:h-8 text-[#00205B]" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-none">
              <span className="text-[#00205B]">Monitoreo</span> <span className="text-[#FE5000]">Móvil</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/80 backdrop-blur-md rounded-full px-3.5 py-1 flex items-center gap-2 border border-slate-200/70 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <SystemStatus />
            </div>
          </div>
        </div>
      </div>
      
      {/* Secciones Continuas e Interactivas (Client Wrapper con Modo Presentación Integrado) */}
      <div className="w-full flex flex-col relative z-10">
        <RutasDashboardClient />
      </div>
    </div>
  );
}
