import { useState } from 'react';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import ComboBox from '@/components/ui/ComboBox';

interface AgendaFiltersProps {
  view: 'list' | 'calendar';
  onViewChange: (view: 'list' | 'calendar') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (s: string) => void;
}

export default function AgendaFilters({ view, onViewChange, searchQuery, onSearchChange, statusFilter, onStatusChange }: AgendaFiltersProps) {

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-3 w-full">
        {/* Búsqueda */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00205B] focus:border-transparent bg-white shadow-sm"
            placeholder="Buscar por nombre o ubicación..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filtro de Estado */}
        <div className="w-full">
          <ComboBox
            options={[
              { value: 'Todos', label: 'Todos los Estados' },
              { value: 'Planificado', label: 'Planificado' },
              { value: 'En Proceso', label: 'En Proceso' },
              { value: 'Culminado', label: 'Culminado' },
              { value: 'Cancelado', label: 'Cancelado' }
            ]}
            value={statusFilter}
            onChange={onStatusChange}
            icon={<Filter className="w-4 h-4 text-gray-500" />}
          />
        </div>
      </div>

      {/* Selector de Vista */}
      <div className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-1 shadow-inner mt-2">
        <button 
          onClick={() => onViewChange('list')}
          className={`flex-1 flex justify-center p-2 rounded transition-colors ${view === 'list' ? 'bg-white text-[#00205B] shadow-sm font-bold' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <List className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onViewChange('calendar')}
          className={`flex-1 flex justify-center p-2 rounded transition-colors ${view === 'calendar' ? 'bg-white text-[#00205B] shadow-sm font-bold' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
