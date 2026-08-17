"use client";

import { Plus, Grid, Truck, Building2, Store } from "lucide-react";
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
    <div className="w-full max-w-[95rem] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#00205B]">Agenda de Jornadas</h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Filtros rápidos de Tipo de Agenda */}
          <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm overflow-x-auto w-full sm:w-auto">
            <button 
              onClick={() => handleFilter('Todas')}
              className={getButtonClass('Todas', 'bg-gray-100 text-gray-800 border-gray-200', 'hover:bg-gray-50')}
            >
              <Grid className="w-4 h-4" />
              <span className="hidden lg:inline">Todas</span>
            </button>
            <button 
              onClick={() => handleFilter('Unidad Móvil')}
              className={getButtonClass('Unidad Móvil', 'bg-[#FE5000] text-white', 'hover:bg-orange-50 hover:text-[#FE5000]')}
            >
              <Truck className="w-4 h-4" />
              <span className="hidden lg:inline">Unidad Móvil</span>
            </button>
            <button 
              onClick={() => handleFilter('Agencia Móvil')}
              className={getButtonClass('Agencia Móvil', 'bg-[#00205B] text-white', 'hover:bg-blue-50 hover:text-[#00205B]')}
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden lg:inline">Agencia Móvil</span>
            </button>
            <button 
              onClick={() => handleFilter('Red de Agencias')}
              className={getButtonClass('Red de Agencias', 'bg-[#009639] text-white', 'hover:bg-green-50 hover:text-[#009639]')}
            >
              <Store className="w-4 h-4" />
              <span className="hidden lg:inline">Red de Agencias</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <EventsImport />
            <button
              onClick={() => openModal('create', false, null)}
              className="flex items-center justify-center gap-2 bg-[#FE5000] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#e04700] transition-colors shadow-sm focus:ring-4 focus:ring-[#FE5000]/30 w-full sm:w-auto whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Nuevo Evento
            </button>
          </div>
        </div>
      </div>

      <AgendaFilters 
        view={view} 
        onViewChange={setView} 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />
      
      {view === 'calendar' ? <EventCalendar events={filteredEvents} /> : <EventList events={filteredEvents} />}
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
