"use client";

import { useState, useMemo } from 'react';
import { DollarSign, Truck, Plus, Download, Edit2, Filter, Search, XCircle, Calendar } from 'lucide-react';
import { useAgenda } from '@/context/AgendaContext';
import ComboBox from '@/components/ui/ComboBox';
import AgenciaRankingChart from '../dashboard/AgenciaRankingChart';
import AgenciaDistribucionChart from '../dashboard/AgenciaDistribucionChart';
import UnidadRankingChart from '../dashboard/UnidadRankingChart';
import UnidadDistribucionChart from '../dashboard/UnidadDistribucionChart';
import GastosImport from './GastosImport';

export default function GastosSection() {
  const { events, openModal } = useAgenda();
  
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | 'all'>('all');

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const availableMonths = useMemo(() => {
    const validMonths = new Set<number>();
    events.forEach(ev => {
      if (selectedEventId !== 'all' && ev.id !== selectedEventId) return;
      if (ev.startDate) {
        const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
        validMonths.add(evMonth);
      }
    });
    return Array.from(validMonths).sort((a, b) => a - b).map(m => ({ value: m.toString(), label: months[m] }));
  }, [events, selectedEventId]);

  const availableEvents = useMemo(() => {
    const evs: { value: string, label: string }[] = [];
    events.forEach(ev => {
      if (selectedMonth !== 'all' && ev.startDate) {
        const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
        if (evMonth !== selectedMonth) return;
      }
      evs.push({ value: ev.id, label: `${ev.eventName} - ${ev.agencyCode}` });
    });
    return evs;
  }, [events, selectedMonth]);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const matchEvent = selectedEventId === 'all' || ev.id === selectedEventId;
      let matchMonth = true;
      if (selectedMonth !== 'all' && ev.startDate) {
        const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
        matchMonth = evMonth === selectedMonth;
      }
      return matchEvent && matchMonth;
    });
  }, [events, selectedEventId, selectedMonth]);

  // Totales
  const totales = filteredEvents.reduce((acc, ev) => {
    if (ev.gastos) {
      const g = ev.gastos;
      const totalBs = g.alimentacionBs + g.hospedajeBs + g.transporteBs + 
                      g.soporteTecnicoBs + g.bancaElectronicaBs + g.gastosTributariosBs + 
                      g.conductorAyudanteBs + g.mantenimientoLimpiezaBs;
      acc.totalBs += totalBs;
      acc.totalUsd += ev.gastos.totalUsd;
    }
    return acc;
  }, { totalBs: 0, totalUsd: 0 });

  return (
    <div className="space-y-6 w-full max-w-[95%] xl:max-w-[98%] mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#00205B]">Gastos y Viáticos Operativos</h2>
        <div className="flex items-center gap-3">
          <GastosImport />
          <button 
            onClick={() => openModal('gastos', true)}
            className="flex items-center gap-2 bg-[#FE5000] text-white px-5 h-10 rounded-xl font-medium hover:bg-[#e04700] shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Añadir Gasto</span>
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-500 font-medium">
          <Filter className="w-5 h-5" />
          <span className="text-sm">Filtros:</span>
        </div>
        
        <div className="flex-1 w-full flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-64">
            <ComboBox
              options={[{ value: 'all', label: 'Todos los Meses' }, ...availableMonths]}
              value={selectedMonth === 'all' ? 'all' : selectedMonth.toString()}
              onChange={(val) => {
                const numVal = val === 'all' ? 'all' : Number(val);
                setSelectedMonth(numVal);
                if (numVal !== 'all' && selectedEventId !== 'all') {
                  const ev = events.find(e => e.id === selectedEventId);
                  if (ev && ev.startDate) {
                    const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
                    if (evMonth !== numVal) setSelectedEventId('all');
                  }
                }
              }}
              icon={<Calendar className="w-4 h-4" />}
              emptyText="No hay meses"
            />
          </div>

          <div className="w-full md:flex-1">
            <ComboBox
              options={[{ value: 'all', label: 'Todos los Eventos / Agencias' }, ...availableEvents]}
              value={selectedEventId}
              onChange={(val) => {
                setSelectedEventId(val);
                if (val !== 'all') {
                  const ev = events.find(e => e.id === val);
                  if (ev && ev.startDate) {
                    const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
                    setSelectedMonth(evMonth);
                  }
                }
              }}
              icon={<Filter className="w-4 h-4" />}
              emptyText="No hay operativos"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedMonth('all');
              setSelectedEventId('all');
            }}
            className="shrink-0 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#FE5000] transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span className="hidden md:inline">Limpiar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#00205B] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <p className="text-blue-200 text-sm font-medium">Total Consolidado Equiv. USD (Histórico)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <DollarSign className="w-8 h-8 text-[#FE5000]" />
            <h3 className="text-4xl font-bold text-white">{totales.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col justify-between border border-gray-100">
          <p className="text-gray-500 text-sm font-medium">Total Ejecutado en Bolívares</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-400">Bs.</span>
            <h3 className="text-4xl font-bold text-gray-900">{totales.totalBs.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col justify-between border border-gray-100">
          <p className="text-gray-500 text-sm font-medium">Gasto Promedio por Jornada (USD)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <DollarSign className="w-8 h-8 text-emerald-500" />
            <h3 className="text-4xl font-bold text-gray-900">
              {(filteredEvents.length > 0 ? totales.totalUsd / filteredEvents.length : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabla Global de Gastos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Truck className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-800">Detalle de Gastos por Evento / Unidad</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-4">Evento / C.C.</th>
                <th className="px-6 py-4 text-center">Tasa BCV Aplicada</th>
                <th className="px-6 py-4 text-center">Total Bs.</th>
                <th className="px-6 py-4 text-center text-[#00205B]">Equiv. USD</th>
                <th className="px-6 py-4 text-center">Estatus</th>
                <th className="px-6 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(() => {
                const tableEvents = [...filteredEvents]
                  .filter(e => e.type === 'Agencia Móvil' || e.type === 'Unidad Móvil')
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

                if (tableEvents.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No hay eventos registrados que generen gastos con los filtros actuales.
                      </td>
                    </tr>
                  );
                }

                return tableEvents.map(ev => {
                  const g = ev.gastos;
                  const totalBs = g ? (g.alimentacionBs + g.hospedajeBs + g.transporteBs + 
                                  g.soporteTecnicoBs + g.bancaElectronicaBs + g.gastosTributariosBs + 
                                  g.conductorAyudanteBs + g.mantenimientoLimpiezaBs) : 0;
                  
                  return (
                    <tr 
                      key={ev.id} 
                      onClick={() => openModal('gastos', true, ev.id)}
                      className="hover:bg-orange-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {ev.eventName} <br/>
                        <span className="text-xs text-gray-500 font-normal">{ev.type} | {ev.agencyCode}</span>
                        <br/>
                        <span className="text-[10px] text-gray-400">{ev.startDate}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs">
                        {g ? (
                          <span className="bg-orange-50 text-[#FE5000] border border-orange-200 font-bold px-2 py-1 rounded-lg">
                            Bs. {g.tasaBcv}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {g ? `Bs. ${totalBs.toLocaleString('de-DE', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-[#00205B] bg-blue-50/10 group-hover:bg-blue-50/30">
                        {g ? `$${g.totalUsd}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {g ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            g.estado === 'Convalidado' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {g.estado}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal('gastos', true, ev.id);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm ${
                            g 
                              ? 'bg-gray-100 hover:bg-[#FE5000] hover:text-white text-gray-700'
                              : 'bg-[#FE5000] text-white hover:bg-[#e04700]'
                          }`}
                          title={g ? "Editar gastos" : "Añadir gastos"}
                        >
                          {g ? (
                            <>
                              <Edit2 className="w-3.5 h-3.5" />
                              Editar
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Añadir
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#00205B] mb-6 flex items-center gap-2">
          <Truck className="w-6 h-6" />
          Análisis Específico: Agencia Móvil
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AgenciaRankingChart events={filteredEvents} />
          <AgenciaDistribucionChart events={filteredEvents} />
        </div>
      </div>

      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-xl font-black text-[#00205B] mb-6 flex items-center gap-2">
          <Truck className="w-6 h-6" />
          Análisis Específico: Unidad Móvil
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UnidadRankingChart events={filteredEvents} />
          <UnidadDistribucionChart events={filteredEvents} />
        </div>
      </div>
    </div>
  );
}
