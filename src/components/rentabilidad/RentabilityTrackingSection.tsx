"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRentability } from '@/context/RentabilityContext';
import { useAgenda } from '@/context/AgendaContext';
import { TrendingUp, AlertCircle, CheckCircle2, ChevronRight, DollarSign, ArrowUpRight, ArrowDownRight, Building2 } from 'lucide-react';
import { format, isPast, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { RentabilityTracking } from '@/lib/mock-data';
import { X } from 'lucide-react';
import ComboBox from '@/components/ui/ComboBox';

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
  const [editValues, setEditValues] = useState<{ saldoActivo: number }>({ saldoActivo: 0 });
  const [filterStatus, setFilterStatus] = useState<string>('Culminado');

  // Scroll synchronization refs
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableInnerRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState<number>(0);

  const filteredEvents = events.filter(e => {
    if (e.type === 'Red de Agencias') return false; // Excluir Red de Agencias de módulos financieros
    if (e.status === 'Cancelado') return false;
    if (filterStatus === 'Todos') return true;
    return e.status === filterStatus;
  }).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  // 1. Obtener todos los meses únicos para armar las columnas cronológicamente
  const allDates = trackings
    .filter(t => filteredEvents.some(e => e.id === t.eventId))
    .map(t => new Date(t.monthDate));
    
  const uniqueMonths = Array.from(new Set(allDates.map(d => format(d, 'yyyy-MM')))).sort();

  // Calculate the total table width to fake the top scrollbar length
  useEffect(() => {
    if (tableInnerRef.current) {
      setTableWidth(tableInnerRef.current.scrollWidth);
    }
  }, [filteredEvents, trackings]);

  const handleTopScroll = () => {
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(val);
  };

  const getRentabilityColor = (pct: number) => {
    if (pct >= 60) return 'text-[#009639]';
    if (pct >= 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRentabilityBg = (pct: number) => {
    if (pct >= 60) return 'bg-[#009639]';
    if (pct >= 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleEditClick = (t: RentabilityTracking) => {
    setEditingCell(t);
    setEditValues({ saldoActivo: t.saldoActivo });
  };

  const handleSave = async (id: string) => {
    await updateTracking(id, { 
      saldoActivo: editValues.saldoActivo, 
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
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">Mostrar:</label>
          <div className="w-48">
            <ComboBox 
              options={[
                { value: 'Culminado', label: 'Solo Culminados' },
                { value: 'Todos', label: 'Todos (Para Pruebas)' }
              ]}
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
            />
          </div>
        </div>
      </div>

      {/* Leyenda de Indicadores */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-sm">
        <span className="font-bold text-gray-700">Estado de Rentabilidad (Crecimiento Mensual):</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#009639]"></div>
          <span className="text-gray-600 font-medium">Crecimiento Positivo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#D92D20]"></div>
          <span className="text-gray-600 font-medium">Decrecimiento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <span className="text-gray-600 font-medium">Pendiente / Sin Movimiento</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        
        {/* Top Scrollbar synchronized with main table */}
        <div 
          ref={topScrollRef} 
          className="overflow-x-auto overflow-y-hidden border-b border-gray-100 bg-gray-50/50" 
          onScroll={handleTopScroll}
        >
          <div style={{ width: tableWidth || '100%', height: '1px' }}></div>
        </div>

        <div 
          ref={tableScrollRef}
          className="overflow-x-auto" 
          onScroll={handleTableScroll}
        >
          <table ref={tableInnerRef} className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold text-[#00205B] sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[280px]">
                  Operativo
                </th>
                {uniqueMonths.map(monthStr => {
                  const d = new Date(`${monthStr}-02`);
                  return (
                    <th key={monthStr} className="px-6 py-4 text-center font-bold text-[#00205B] min-w-[240px]">
                      {format(d, 'MMM yyyy', { locale: es })}
                    </th>
                  );
                })}
                <th className="px-6 py-4 text-right font-bold text-[#00205B] min-w-[200px] bg-gray-50/50">
                  Rentabilidad Final
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEvents.map(event => {
                const eventTrackings = trackings.filter(t => t.eventId === event.id).sort((a, b) => a.monthIndex - b.monthIndex);
                
                // Margins & Comparatives
                const tasaBcv = event.gastos?.tasaBcv || 1;
                const initialGastosUsd = event.gastos?.totalUsd || 0;
                
                const totalIncomeBs = eventTrackings.reduce((sum, t) => sum + (t.saldoActivo || 0), 0);
                const totalIncomeUsd = totalIncomeBs / tasaBcv;
                
                const netMarginUsd = totalIncomeUsd - initialGastosUsd;
                const netMarginBs = netMarginUsd * tasaBcv;
                
                const colorClass = netMarginUsd >= 0 ? 'text-[#009639]' : 'text-[#D92D20]';
                const nextPendingTracking = eventTrackings.find(t => t.status === 'Pendiente');

                return (
                  <tr key={event.id} className="hover:bg-gray-50/30 transition-colors group/row">
                    <td className="px-6 py-5 border-r border-gray-100 align-top sticky left-0 bg-white group-hover/row:bg-gray-50/30 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <div className="font-bold text-[#00205B] text-[15px] leading-tight">{event.eventName}</div>
                          <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5 font-medium">
                            <Building2 className="w-3.5 h-3.5 opacity-70" /> {event.agencyCode}
                          </div>
                          <div className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">Inicio: {event.endDate}</div>
                        </div>
                        {nextPendingTracking && (
                          <button 
                            onClick={() => handleEditClick(nextPendingTracking)}
                            className="mt-4 w-full bg-white hover:bg-[#00205B] text-[#00205B] hover:text-white border border-gray-200 hover:border-[#00205B] transition-all duration-200 py-1.5 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm group/btn"
                          >
                            <TrendingUp className="w-3.5 h-3.5 group-hover/btn:text-white" />
                            Registrar Métrica
                          </button>
                        )}
                      </div>
                    </td>
                    
                    {uniqueMonths.map(monthStr => {
                      const t = eventTrackings.find(track => format(new Date(track.monthDate), 'yyyy-MM') === monthStr);
                      
                      if (!t) {
                        return (
                          <td key={`empty-${monthStr}`} className="px-3 py-5 align-middle border-r border-gray-100 min-w-[240px]">
                            <div className="text-center text-gray-300">
                              <span className="block w-4 h-px bg-gray-200 mx-auto"></span>
                            </div>
                          </td>
                        );
                      }

                      const isPending = t.status === 'Pendiente';
                      const cellDate = new Date(t.monthDate);
                      const isOverdue = isPending && isPast(cellDate) && !isSameMonth(cellDate, new Date());
                      
                      // Calculate difference vs previous month
                      let diff = 0;
                      let showDiff = false;
                      if (!isPending && t.monthIndex > 1) {
                        const prevT = eventTrackings.find(track => track.monthIndex === t.monthIndex - 1);
                        if (prevT && prevT.status === 'Cerrado') {
                          diff = t.saldoActivo - prevT.saldoActivo;
                          showDiff = true;
                        }
                      }

                      const cellStatusColor = isPending ? (isOverdue ? 'bg-red-400' : 'bg-gray-300') : (diff >= 0 ? 'bg-[#009639]' : 'bg-[#D92D20]');

                      return (
                        <td key={t.id} className="px-3 py-5 align-top border-r border-gray-100 min-w-[240px]">
                            <div 
                              onClick={() => handleEditClick(t)}
                              className={`group relative overflow-hidden p-3.5 rounded-xl border transition-all cursor-pointer ${
                                isPending 
                                  ? isOverdue ? 'bg-red-50/40 border-red-100 hover:border-red-300' : 'bg-gray-50/50 border-gray-200 hover:border-gray-300' 
                                  : 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-[#00205B]/30'
                              }`}
                            >
                              {/* Línea indicadora de estado lateral */}
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${cellStatusColor}`} />
                              
                              <div className="flex items-center justify-between mb-2.5 pl-1.5">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                  {format(cellDate, 'MMM yyyy', { locale: es })}
                                </span>
                                {isPending ? (
                                  isOverdue ? <AlertCircle className="w-4 h-4 text-red-500" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-[#009639]" />
                                )}
                              </div>
                              
                              <div className="pl-1.5">
                                {isPending ? (
                                  <div className="text-xs text-left py-2 text-gray-400 group-hover:text-[#00205B] font-medium transition-colors flex items-center gap-1.5">
                                    <div className="w-6 h-px bg-gray-300"></div>
                                    Registrar Cierre
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-gray-400 font-medium mb-0.5 uppercase tracking-wide">Saldo Mes</span>
                                      <div className="flex items-end justify-between gap-2">
                                        <span className="text-[15px] font-bold text-gray-900 truncate">
                                          Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(t.saldoActivo)}
                                        </span>
                                      </div>
                                      {showDiff && (
                                        <div className="flex items-center justify-between mt-1">
                                          <div className="text-[9px] text-gray-400 uppercase font-medium">Vs Mes Ant.</div>
                                          <div className={`flex items-center gap-0.5 text-[11px] font-bold ${diff >= 0 ? 'text-[#009639]' : 'text-[#D92D20]'}`}>
                                            {diff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(diff))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                        </td>
                      );
                    })}

                    <td className="px-6 py-5 text-right align-middle bg-gray-50/50">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className={`text-[15px] font-bold ${colorClass}`}>
                          Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(netMarginBs)}
                        </div>
                        <div className={`text-xl font-black ${colorClass}`}>
                          $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(netMarginUsd)}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Margen Neto</div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
                        editValues.saldoActivo / (events.find(e => e.id === editingCell.eventId)?.gastos?.tasaBcv || 1)
                      )}
                    </span>
                  )}
                </div>
                <FormattedCurrencyInput 
                  value={editValues.saldoActivo} 
                  onChange={(val) => setEditValues({...editValues, saldoActivo: val})} 
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
