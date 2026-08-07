import { AgendaEvent, EventStatus, EventType } from '@/lib/mock-data';
import { MoreVertical, Edit2, Eye, Truck, Building2, Store } from 'lucide-react';
import { useAgenda } from '@/context/AgendaContext';

interface EventListProps {
  events: AgendaEvent[];
}

export default function EventList({ events }: EventListProps) {
  const { openModal } = useAgenda();
  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'Culminado':
        return 'bg-[#009639]/10 text-[#009639] border-[#009639]/20';
      case 'En Proceso':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Planificado':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Cancelado':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Agencia / C.C.</th>
              <th className="px-6 py-4">Nombre del Evento</th>
              <th className="px-6 py-4">Región/Zona</th>
              <th className="px-6 py-4">Fechas</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {event.type === 'Unidad Móvil' ? (
                      <Truck className="w-5 h-5 text-[#FE5000]" />
                    ) : event.type === 'Agencia Móvil' ? (
                      <Building2 className="w-5 h-5 text-[#00205B]" />
                    ) : (
                      <Store className="w-5 h-5 text-[#009639]" />
                    )}
                    <span className="font-medium text-gray-900">{event.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{event.agencyCode}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{event.eventName}</td>
                <td className="px-6 py-4">{event.region}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs">
                    <span><span className="font-medium text-gray-500">Del:</span> {event.startDate}</span>
                    <span><span className="font-medium text-gray-500">Al:</span> {event.endDate}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => openModal('menu', false, event.id)}
                      className="p-1.5 text-gray-400 hover:text-[#00205B] hover:bg-gray-100 rounded transition-colors" 
                      title="Ver Detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openModal('datos', false, event.id)}
                      className="p-1.5 text-gray-400 hover:text-[#FE5000] hover:bg-gray-100 rounded transition-colors" 
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openModal('menu', false, event.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" 
                      title="Más opciones"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
