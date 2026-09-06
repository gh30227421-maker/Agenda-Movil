import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import ComboBox from '@/components/ui/ComboBox';

interface AgendaFiltersProps {
  view: 'list' | 'calendar';
  onViewChange: (view: 'list' | 'calendar') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilters: string[];
  onStatusChange: (s: string[]) => void;
}

export default function AgendaFilters({ view, onViewChange, searchQuery, onSearchChange, statusFilters, onStatusChange }: AgendaFiltersProps) {

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Búsqueda */}
      <div className="relative w-full md:w-48 lg:w-64 shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00205B] focus:border-transparent bg-gray-50 hover:bg-gray-100 transition-colors"
          placeholder="Buscar evento..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filtro de Estado */}
      <div className="w-full md:w-48 shrink-0">
        <ComboBox
          multiple
          options={[
            { value: 'Todos', label: 'Todos los Estados' },
            { value: 'Planificado', label: 'Planificado' },
            { value: 'En Proceso', label: 'En Proceso' },
            { value: 'Culminado', label: 'Culminado' },
            { value: 'Cancelado', label: 'Cancelado' }
          ]}
          value={statusFilters}
          onChange={(val: string[]) => onStatusChange(val)}
          icon={<Filter className="w-4 h-4 text-gray-500" />}
        />
      </div>

      <div className="h-6 w-px bg-gray-200 hidden sm:block mx-1"></div>

      {/* Selector de Vista */}
      <div className="flex items-center justify-center bg-gray-100 p-1 rounded-xl shrink-0">
        <button 
          onClick={() => onViewChange('list')}
          className={`flex-1 flex justify-center p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-white text-[#00205B] shadow-sm font-bold' : 'text-gray-400 hover:text-gray-600'}`}
          title="Vista de Lista"
        >
          <List className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onViewChange('calendar')}
          className={`flex-1 flex justify-center p-2 rounded-lg transition-colors ${view === 'calendar' ? 'bg-white text-[#00205B] shadow-sm font-bold' : 'text-gray-400 hover:text-gray-600'}`}
          title="Vista de Calendario"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
