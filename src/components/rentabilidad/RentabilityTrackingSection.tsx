"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRentability } from '@/context/RentabilityContext';
import { useAgenda } from '@/context/AgendaContext';
import { TrendingUp, AlertCircle, CheckCircle2, ChevronRight, DollarSign, ArrowUpRight, ArrowDownRight, Building2, Search } from 'lucide-react';
import { format, isPast, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { RentabilityTracking } from '@/lib/mock-data';
import { X } from 'lucide-react';
import ComboBox from '@/components/ui/ComboBox';
import GlobalTrendChart from './GlobalTrendChart';
import EventTrackingCard from './EventTrackingCard';

function FormattedCurrencyInput({ value, onChange }: { value: number, onChange: (val: number) => void }) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (value === 0) return '';
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  });
  const [isFocused, setIsFocused] = useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      if (value === 0) setDisplayValue('');
      else setDisplayValue(new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    val = val.replace(/[^0-9,]/g, '');
    setDisplayValue(val);
    const numericStr = val.replace(',', '.');
    onChange(Number(numericStr) || 0);
  };

  return (
    <input 
      type="text" 
      value={displayValue}
      onChange={handleChange}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FE5000] focus:border-transparent transition-all outline-none font-bold text-gray-900" 
      placeholder="0,00"
    />
  );
}

export default function RentabilityTrackingSection() {
  const { trackings, isLoading, updateTracking } = useRentability();
  const { events } = useAgenda();
  
  const [editingCell, setEditingCell] = useState<RentabilityTracking | null>(null);
  const [editValues, setEditValues] = useState<{ saldoActivo: number; tasaBcv: number }>({ saldoActivo: 0, tasaBcv: 0 });
  const [filterMonth, setFilterMonth] = useState<string>('Todos');
  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<string>('Culminado');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const baseValidEvents = events.filter(e => e.type !== 'Red de Agencias' && e.status !== 'Cancelado');

  const filteredEvents = events.filter(e => {
    if (e.type === 'Red de Agencias') return false; // Excluir Red de Agencias de módulos financieros
    if (e.status === 'Cancelado') return false;
    
    if (filterStatus !== 'Todos' && e.status !== filterStatus) return false;
    if (filterType !== 'Todos' && e.type !== filterType) return false;
    
    if (filterMonth !== 'Todos') {
      const eMonth = (new Date(e.startDate).getMonth() + 1).toString();
      if (eMonth !== filterMonth) return false;
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      if (!e.eventName.toLowerCase().includes(term) && !e.agencyCode.toLowerCase().includes(term)) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const handleEditClick = (t: RentabilityTracking, eventRate: number) => {
    setEditingCell(t);
    setEditValues({ saldoActivo: t.saldoActivo, tasaBcv: t.tasaBcv || eventRate });
  };

  const handleSave = async (id: string) => {
    await updateTracking(id, { 
      saldoActivo: editValues.saldoActivo,
      tasaBcv: editValues.tasaBcv,
      status: 'Cerrado'
    });
    setEditingCell(null);
  };

  if (isLoading) {
    return <div className="flex justify-center p-12 text-gray-400">Cargando métricas de efectividad operativa...</div>;
  }

  return (
    <div className="w-full px-4 mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#00205B]">Seguimiento de Efectividad Operativa</h1>
          <p className="text-gray-500 text-sm mt-1">Efectividad operativa y captaciones post-operativo</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar operativo o agencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FE5000] focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="w-40">
            <ComboBox 
              options={[
                { value: 'Todos', label: 'Todos los Meses' },
                { value: '1', label: 'Enero' },
                { value: '2', label: 'Febrero' },
                { value: '3', label: 'Marzo' },
                { value: '4', label: 'Abril' },
                { value: '5', label: 'Mayo' },
                { value: '6', label: 'Junio' },
                { value: '7', label: 'Julio' },
                { value: '8', label: 'Agosto' },
                { value: '9', label: 'Septiembre' },
                { value: '10', label: 'Octubre' },
                { value: '11', label: 'Noviembre' },
                { value: '12', label: 'Diciembre' }
              ]}
              value={filterMonth}
              onChange={setFilterMonth}
              placeholder="Mes de Inicio"
            />
          </div>
          <div className="w-48">
            <ComboBox 
              options={[
                { value: 'Todos', label: 'Todos los Tipos' },
                { value: 'Agencias Móviles', label: 'Agencias Móviles' },
                { value: 'Unidad Móvil', label: 'Unidad Móvil' }
              ]}
              value={filterType}
              onChange={setFilterType}
              placeholder="Tipo Operativo"
            />
          </div>
          <div className="w-48">
            <ComboBox 
              options={[
                { value: 'Culminado', label: 'Culminados' },
                { value: 'Pendiente', label: 'Pendientes' },
                { value: 'Todos', label: 'Todos los Estatus' }
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Estatus"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center text-sm font-medium text-gray-500 bg-gray-50 py-2 px-4 rounded-lg border border-gray-100">
        Mostrando <span className="font-bold text-[#00205B] mx-1">{filteredEvents.length}</span> de <span className="font-bold text-[#00205B] mx-1">{baseValidEvents.length}</span> jornadas activas
      </div>

      <GlobalTrendChart events={filteredEvents} trackings={trackings} />

      <div className="flex flex-col gap-4 mt-6">
        {filteredEvents.map(event => (
          <EventTrackingCard 
            key={event.id}
            event={event}
            trackings={trackings}
            onEditClick={handleEditClick}
          />
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-400 font-medium">No hay eventos que coincidan con los filtros.</p>
          </div>
        )}
      </div>

      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-[#00205B]">Registro de Cierre Mensual</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Mes {editingCell.monthIndex} ({format(new Date(editingCell.monthDate), 'MMMM yyyy', { locale: es })})
                </p>
              </div>
              <button 
                onClick={() => setEditingCell(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-gray-700">Saldo Promedio Total (Bs)</label>
                  {editingCell && (
                    <span className="text-xs font-bold text-[#00205B]">
                      $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
                        editValues.tasaBcv > 0 ? editValues.saldoActivo / editValues.tasaBcv : 0
                      )}
                    </span>
                  )}
                </div>
                <FormattedCurrencyInput 
                  value={editValues.saldoActivo} 
                  onChange={(val) => setEditValues({...editValues, saldoActivo: val})} 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tasa BCV del Mes (Bs/USD)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  required
                  value={editValues.tasaBcv || ''}
                  onChange={(e) => setEditValues({...editValues, tasaBcv: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FE5000] focus:border-transparent transition-all outline-none text-gray-900" 
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setEditingCell(null)} 
                className="flex-1 px-4 py-2 font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleSave(editingCell.id)} 
                className="flex-1 px-4 py-2 font-semibold text-white bg-[#00205B] rounded-lg hover:bg-[#00205B]/90 transition-colors"
              >
                Guardar Cierre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
