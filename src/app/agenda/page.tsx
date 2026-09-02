"use client";

import { Plus, Grid, Truck, Building2, Store, Menu, X } from "lucide-react";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAgenda } from '@/context/AgendaContext';
import AgendaFilters from "@/components/agenda/AgendaFilters";
import EventList from "@/components/agenda/EventList";
import EventCalendar from "@/components/agenda/EventCalendar";
import EventManagementModal from "@/components/agenda/EventManagementModal";
import EventsImport from "@/components/agenda/EventsImport";
import PresentationMode from "@/components/ui/PresentationMode";

function DashboardContent() {
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { events, openModal } = useAgenda();
  
  const typeFilter = searchParams.get('type') || 'Todas';
  
  const filteredEvents = events.filter(event => {
    if (typeFilter && typeFilter !== 'Todas' && event.type !== typeFilter) return false;
    if (statusFilter !== 'Todos' && event.status !== statusFilter) return false;

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
    return `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-all ${
      isActive ? activeColorClass : `bg-transparent text-gray-500 ${hoverClass}`
    }`;
  };

  return (
    <div className="flex flex-col lg:flex-row w-full flex-1 min-h-0 overflow-hidden bg-gray-50/50">
      
      {/* Columna Izquierda: Sidebar de Control (Push) */}
      <div className={`transition-all duration-300 ease-in-out flex-shrink-0 bg-white shadow-2xl z-20 flex flex-col print:hidden ${
        isSidebarOpen ? 'w-full lg:w-80 opacity-100 px-4 lg:px-6 border-r border-gray-200' : 'w-0 opacity-0 px-0 border-none overflow-hidden'
      }`}>
        <div className="py-6 flex flex-col gap-6 h-full overflow-y-auto hide-scrollbar w-full lg:w-64 min-w-[250px]">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-2xl font-black text-[#00205B] tracking-tight">Agenda</h1>
              <p className="text-xs text-gray-500 mt-1 font-medium">Control y Programación</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 lg:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => openModal('create', false, null)}
            className="flex items-center justify-center gap-2 bg-[#FE5000] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#e04700] transition-colors shadow-md focus:ring-4 focus:ring-[#FE5000]/30 w-full"
          >
            <Plus className="w-5 h-5" />
            Nuevo Evento
          </button>
          {/* <EventsImport /> - Temporalmente deshabilitado por solicitud */}
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Unidad Operativa</h3>
          <div className="flex flex-col gap-1.5">
            <button 
              onClick={() => handleFilter('Todas')}
              className={getButtonClass('Todas', 'bg-gray-100 text-gray-800 border-gray-200', 'hover:bg-gray-50')}
            >
              <Grid className="w-4 h-4" />
              <span>Todas las Unidades</span>
            </button>
            <button 
              onClick={() => handleFilter('Unidad Móvil')}
              className={getButtonClass('Unidad Móvil', 'bg-[#FE5000] text-white', 'hover:bg-orange-50 hover:text-[#FE5000]')}
            >
              <Truck className="w-4 h-4" />
              <span>Unidad Móvil</span>
            </button>
            <button 
              onClick={() => handleFilter('Agencia Móvil')}
              className={getButtonClass('Agencia Móvil', 'bg-[#00205B] text-white', 'hover:bg-blue-50 hover:text-[#00205B]')}
            >
              <Building2 className="w-4 h-4" />
              <span>Agencia Móvil</span>
            </button>
            <button 
              onClick={() => handleFilter('Red de Agencias')}
              className={getButtonClass('Red de Agencias', 'bg-[#009639] text-white', 'hover:bg-green-50 hover:text-[#009639]')}
            >
              <Store className="w-4 h-4" />
              <span>Red de Agencias</span>
            </button>
          </div>
        </div>
      </div>

        <div className="pt-2 border-t border-gray-100">
          <AgendaFilters 
            view={view} 
            onViewChange={setView} 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Columna Derecha: Lienzo del Calendario (100%) */}
      <div className="flex-1 min-w-0 w-full h-full overflow-hidden bg-transparent flex justify-center transition-all duration-300">
        <div className="w-full max-w-[1800px] mx-auto h-full px-4 lg:px-6 py-2 flex flex-col relative z-10 print:max-w-none print:px-0 print:py-0 print:h-screen">
          {view === 'calendar' ? <EventCalendar events={filteredEvents} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} /> : <EventList events={filteredEvents} />}
        </div>
      </div>

      <PresentationMode />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center p-12"><div className="animate-pulse flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-[#00205B] border-t-transparent rounded-full animate-spin"></div><p className="text-[#00205B] font-medium">Cargando Agenda...</p></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
