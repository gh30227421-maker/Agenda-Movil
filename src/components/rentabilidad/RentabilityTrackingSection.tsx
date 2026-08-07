"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRentability } from '@/context/RentabilityContext';
import { useAgenda } from '@/context/AgendaContext';
import { TrendingUp, AlertCircle, CheckCircle2, ChevronRight, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
  });

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
    return <div className="flex justify-center p-12 text-gray-400">Cargando métricas de rentabilidad...</div>;
  }

  return (
    <div className="w-full px-4 mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#00205B]">Seguimiento de Rentabilidad</h1>
          <p className="text-gray-500 text-sm mt-1">Rentabilidad y captaciones post-operativo</p>
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
        <span className="font-bold text-gray-700">Indicadores de Rentabilidad (Margen Neto):</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#009639]"></div>
          <span className="text-gray-600 font-medium">Rentable (&ge; 60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-600 font-medium">Al Límite (20% - 59%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600 font-medium">No Rentable (&lt; 20%)</span>
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
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-[#00205B] sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Operativo</th>
                {[1, 2, 3, 4, 5, 6].map(m => (
                  <th key={m} className="px-6 py-4 text-center font-bold min-w-[240px]">Mes {m}</th>
                ))}
                <th className="px-6 py-4 text-right font-bold text-[#009639] min-w-[200px]">Margen Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEvents.map(event => {
                const eventTrackings = trackings.filter(t => t.eventId === event.id).sort((a, b) => a.monthIndex - b.monthIndex);
                
                // Margins & Comparatives
                const tasaBcv = event.gastos?.tasaBcv || 1;
                const initialGastosUsd = event.gastos?.totalUsd || 0;
                
                // Using saldoActivo as the metric for rentability instead of ingresos
                const totalIncomeBs = eventTrackings.reduce((sum, t) => sum + (t.saldoActivo || 0), 0);
                const totalIncomeUsd = totalIncomeBs / tasaBcv;
                
                const netMarginUsd = totalIncomeUsd - initialGastosUsd;
                const netMarginBs = netMarginUsd * tasaBcv;
                
                // Calculate percentage (ROI) based on initial cost
                const marginPct = initialGastosUsd > 0 ? (netMarginUsd / initialGastosUsd) * 100 : 0;
                const colorClass = getRentabilityColor(marginPct);
                
                const nextPendingTracking = eventTrackings.find(t => t.status === 'Pendiente');

                return (
                  <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 border-r border-gray-100 align-top sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div className="font-bold text-gray-900">{event.eventName}</div>
                      <div className="text-xs text-gray-500 mt-1">{event.agencyCode}</div>
                      <div className="text-[10px] text-gray-400 mt-1 uppercase">Inicio: {event.endDate}</div>
                      {nextPendingTracking && (
                        <button 
                          onClick={() => handleEditClick(nextPendingTracking)}
                          className="mt-3 w-full bg-blue-50 hover:bg-[#00205B] text-[#00205B] hover:text-white border border-blue-200 hover:border-[#00205B] transition-colors py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          Registrar Métrica
                        </button>
                      )}
                    </td>
                    
                    {[1, 2, 3, 4, 5, 6].map(monthIndex => {
                      const t = eventTrackings.find(track => track.monthIndex === monthIndex);
                      
                      if (!t) {
                        return (
                          <td key={`empty-${monthIndex}`} className="px-3 py-4 align-top border-r border-gray-100 min-w-[240px]">
                            <div className="p-2 rounded-xl border bg-gray-50 border-dashed border-gray-200 opacity-50">
                              <div className="text-[10px] font-bold text-gray-400 uppercase text-center mb-2">
                                Sin Generar
                              </div>
                              <div className="text-xs text-center py-2 text-gray-400">
                                Ejecute Script SQL
                              </div>
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
                        const prevT = eventTrackings.find(track => track.monthIndex === monthIndex - 1);
                        if (prevT && prevT.status === 'Cerrado') {
                          diff = t.saldoActivo - prevT.saldoActivo;
                          showDiff = true;
                        }
                      }

                      return (
                        <td key={t.id} className="px-3 py-4 align-top border-r border-gray-100 min-w-[240px]">
                            <div 
                              onClick={() => handleEditClick(t)}
                              className={`group p-2 rounded-xl border transition-all cursor-pointer ${
                                isPending 
                                  ? isOverdue ? 'bg-red-50/50 border-red-200 hover:border-red-400' : 'bg-gray-50 border-dashed border-gray-200 hover:border-[#00205B]' 
                                  : 'bg-white border-gray-100 shadow-sm hover:border-[#009639]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">
                                  {format(cellDate, 'MMM yyyy', { locale: es })}
                                </span>
                                {isPending ? (
                                  isOverdue ? <AlertCircle className="w-3.5 h-3.5 text-red-500" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#009639]" />
                                )}
                              </div>
                              
                              {isPending ? (
                                <div className="text-xs text-center py-2 text-gray-400 group-hover:text-[#00205B] font-medium transition-colors">
                                  Registrar Cierre
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex flex-col justify-end">
                                    <span className="text-[10px] text-gray-500 mb-0.5">Saldo Mes:</span>
                                    <div className="flex items-end justify-between">
                                      <span className="text-sm font-bold text-gray-900">{formatCurrency(t.saldoActivo)}</span>
                                      {showDiff && (
                                        <div className={`flex items-center gap-0.5 text-[10px] font-bold ${diff >= 0 ? 'text-[#009639]' : 'text-red-500'}`}>
                                          {diff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                          {formatCurrency(Math.abs(diff)).replace('VES', '').trim()}
                                        </div>
                                      )}
                                    </div>
                                    {showDiff && (
                                      <div className="text-[9px] text-gray-400 text-right uppercase mt-0.5">Vs Mes Anterior</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                        </td>
                      );
                    })}

                    <td className="px-6 py-4 text-right align-middle">
                      <div className="flex flex-col items-end gap-1">
                        <div className={`text-sm font-black ${colorClass}`}>
                          Bs. {formatCurrency(netMarginBs).replace('VES', '').trim()}
                        </div>
                        <div className={`text-lg font-black ${colorClass} flex items-center gap-2 justify-end`}>
                          $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(netMarginUsd)}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white ${getRentabilityBg(marginPct)}`}>
                            {marginPct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 uppercase">Margen (Vs Costo Inicial)</div>
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
