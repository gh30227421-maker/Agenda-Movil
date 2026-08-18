import React from 'react';
import RutasUnidadMovil from '@/components/rutas/RutasUnidadMovil';
import RutasAgenciaMovil from '@/components/rutas/RutasAgenciaMovil';
import { Truck, Building2, Radar } from 'lucide-react';
import PresentationMode from '@/components/ui/PresentationMode';
import SystemStatus from '@/components/ui/SystemStatus';

export const metadata = {
  title: 'Monitoreo Territorial | Impacto Corporativo',
};

export default function RutasPage() {
  return (
    <div className="relative z-10 flex flex-col w-full -mt-6 -mx-4 md:-mx-8 sm:w-[calc(100%+2rem)] md:w-[calc(100%+4rem)] min-h-screen text-[#00205B] overflow-hidden pb-20">
      
      {/* Fondo Gradiente + Malla de Puntos Financiera */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-slate-100 to-white" />
      <div 
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, #94A3B8 0.5px, transparent 0.5px)',
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Hero Section Rediseñada (Centro de Comando) */}
      <div className="relative w-full pt-6 pb-2 px-8 mb-4 animate-in fade-in slide-in-from-top-4 duration-1000 z-50 [.presentation-mode-active_&]:fixed [.presentation-mode-active_&]:top-28 [.presentation-mode-active_&]:left-0 [.presentation-mode-active_&]:w-full [.presentation-mode-active_&]:bg-white [.presentation-mode-active_&]:shadow-md [.presentation-mode-active_&]:border-b [.presentation-mode-active_&]:border-slate-100 [.presentation-mode-active_&]:pt-4 [.presentation-mode-active_&]:mb-0">
        <div className="flex flex-col md:flex-row md:items-center gap-4 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-3">
            <Radar className="w-10 h-10 md:w-12 md:h-12 text-[#00205B]" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              <span className="text-[#00205B]">Monitoreo</span> <span className="text-[#FE5000]">Territorial</span>
            </h1>
          </div>
          
          <div className="md:ml-auto bg-slate-900/5 rounded-full px-4 py-1.5 flex items-center gap-2 border border-slate-200/50 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <SystemStatus />
          </div>
        </div>
      </div>
      
      {/* Secciones Continuas */}
      <div className="w-full flex flex-col relative z-10 [.presentation-mode-active_&]:pt-[120px]">
        
        {/* Bloque 1: Unidad Móvil */}
        <section className="w-full py-8 md:py-14 relative">
          <RutasUnidadMovil />
        </section>

        {/* Bloque 2: Agencia Móvil */}
        <section className="w-full pb-8 md:pb-14 mt-32 relative">
          <RutasAgenciaMovil />
        </section>
      </div>
      <PresentationMode />
    </div>
  );
}
