"use client";

import { Plus, Grid, Truck, Building2, Store, Calendar as CalendarIcon } from "lucide-react";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAgenda } from '@/context/AgendaContext';
import AgendaFilters from "@/components/agenda/AgendaFilters";
import EventList from "@/components/agenda/EventList";
import EventCalendar from "@/components/agenda/EventCalendar";
import PresentationMode from "@/components/ui/PresentationMode";

function DashboardContent() {
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { events, openModal } = useAgenda();
  
  const typeFilter = searchParams.get('type') || 'Todas';
  
  const filteredEvents = events.filter(event => {
    if (typeFilter && typeFilter !== 'Todas' && event.type !== typeFilter) return false;
    if (statusFilters.length > 0 && !statusFilters.includes('Todos') && !statusFilters.includes(event.status || '')) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!event.eventName.toLowerCase().includes(q) &&
          !(event.location?.toLowerCase() || '').includes(q) &&
          !event.agencyCode?.toLowerCase().includes(q)) {
        return false;
      }
    }

    return true;
  });

  const handleFilter = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'Todas') {
      params.delete('type');
    } else {
      params.set('type', type);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const getButtonClass = (type: string, activeColorClass: string, hoverClass: string) => {
    const isActive = typeFilter === type;
    return `flex items-center gap-2 px-3 lg:px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
      isActive ? activeColorClass : `bg-transparent text-gray-600 ${hoverClass}`
    }`;
  };

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 overflow-hidden bg-gray-50/50">
      
      {/* Barra Superior de Control y Filtros */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6 shadow-sm z-20 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between print:hidden">
        
        {/* Izquierda: Titulo, Botón Nuevo y Unidades */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden lg:flex flex-col">
              <h1 className="text-xl font-black text-[#00205B] tracking-tight leading-none">Agenda</h1>
            </div>
            
            <button
              onClick={() => openModal('create', false, null)}
              className="flex items-center justify-center gap-2 bg-[#FE5000] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#e04700] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#FE5000]"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Evento</span>
            </button>
          </div>
          
          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 overflow-x-auto max-w-full hide-scrollbar">
            <button 
              onClick={() => handleFilter('Todas')}
              className={getButtonClass('Todas', 'bg-white text-gray-800 shadow-sm font-bold', 'hover:text-gray-900 hover:bg-gray-200/50')}
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Todas</span>
            </button>
            <button 
              onClick={() => handleFilter('Unidad Móvil')}
              className={getButtonClass('Unidad Móvil', 'bg-[#FE5000] text-white font-bold shadow-sm', 'hover:text-[#FE5000] hover:bg-orange-50')}
            >
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">Unidad Móvil</span>
            </button>
            <button 
              onClick={() => handleFilter('Agencia Móvil')}
              className={getButtonClass('Agencia Móvil', 'bg-[#00205B] text-white font-bold shadow-sm', 'hover:text-[#00205B] hover:bg-blue-50')}
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Agencia Móvil</span>
            </button>
            <button 
              onClick={() => handleFilter('Red de Agencias')}
              className={getButtonClass('Red de Agencias', 'bg-[#009639] text-white font-bold shadow-sm', 'hover:text-[#009639] hover:bg-green-50')}
            >
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Red de Agencias</span>
            </button>
          </div>
        </div>

        {/* Derecha: Búsqueda, Filtros y Selector de Vista */}
        <div className="flex items-center gap-3 w-full xl:w-auto xl:justify-end shrink-0">
          <AgendaFilters 
            view={view} 
            onViewChange={setView} 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilters={statusFilters}
            onStatusChange={setStatusFilters}
          />
        </div>
      </div>

      {/* Lienzo del Calendario / Lista (100% Ancho) */}
      <div className="flex-1 min-w-0 w-full h-full overflow-hidden bg-transparent flex justify-center transition-all duration-300">
        <div className="w-full h-full px-4 lg:px-6 py-4 flex flex-col relative z-10 print:max-w-none print:px-0 print:py-0 print:h-screen">
          {view === 'calendar' ? (
            <EventCalendar events={filteredEvents} onToggleSidebar={() => {}} />
          ) : (
            <EventList events={filteredEvents} />
          )}
        </div>
      </div>

      <PresentationMode />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center p-12">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00205B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#00205B] font-medium">Cargando Agenda...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
