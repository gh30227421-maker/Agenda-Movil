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
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
      <div className="flex-1 w-full flex items-center gap-4">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md">
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
        <div className="w-48">
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
      <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
        <button 
          onClick={() => onViewChange('list')}
          className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-gray-100 text-[#00205B] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <List className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onViewChange('calendar')}
          className={`p-1.5 rounded transition-colors ${view === 'calendar' ? 'bg-gray-100 text-[#00205B] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
