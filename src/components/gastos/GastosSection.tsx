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
import ExportDropdown from '@/components/ui/ExportDropdown';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';

export default function GastosSection() {
  const { events, openModal } = useAgenda();
  
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedUnitTypes, setSelectedUnitTypes] = useState<string[]>([]);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const availableMonths = useMemo(() => {
    const validMonths = new Set<number>();
    events.forEach(ev => {
      if (selectedUnitTypes.length > 0 && !selectedUnitTypes.includes(ev.type)) return;
      if (selectedEventIds.length > 0 && !selectedEventIds.includes(ev.id)) return;
      if (ev.startDate) {
        const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
        validMonths.add(evMonth);
      }
    });
    return Array.from(validMonths).sort((a, b) => a - b).map(m => ({ value: m.toString(), label: months[m] }));
  }, [events, selectedEventIds, selectedUnitTypes]);

  const availableEvents = useMemo(() => {
    const evs: { value: string, label: string }[] = [];
    events.forEach(ev => {
      if (selectedUnitTypes.length > 0 && !selectedUnitTypes.includes(ev.type)) return;
      if (selectedMonths.length > 0 && ev.startDate) {
        const evMonth = (parseInt(ev.startDate.split('-')[1], 10) - 1).toString();
        if (!selectedMonths.includes(evMonth)) return;
      }
      evs.push({ value: ev.id, label: `${ev.eventName} - ${ev.agencyCode}` });
    });
    return evs;
  }, [events, selectedMonths, selectedUnitTypes]);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const matchEvent = selectedEventIds.length === 0 || selectedEventIds.includes(ev.id);
      
      let matchMonth = true;
      if (selectedMonths.length > 0 && ev.startDate) {
        const evMonth = (parseInt(ev.startDate.split('-')[1], 10) - 1).toString();
        matchMonth = selectedMonths.includes(evMonth);
      } else if (selectedMonths.length > 0 && !ev.startDate) {
        matchMonth = false;
      }
      
      let matchStatus = true;
      if (selectedStatuses.length > 0) {
        const statusVal = ev.gastos ? 'registered' : 'pending';
        matchStatus = selectedStatuses.includes(statusVal);
      }

      const matchUnit = selectedUnitTypes.length === 0 || selectedUnitTypes.includes(ev.type);
      
      return matchEvent && matchMonth && matchStatus && matchUnit;
    });
  }, [events, selectedEventIds, selectedMonths, selectedStatuses, selectedUnitTypes]);

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

  const mobileEvents = filteredEvents.filter(e => e.type === 'Agencia Móvil' || e.type === 'Unidad Móvil');
  const registeredCount = mobileEvents.filter(e => e.gastos).length;
  const missingCount = mobileEvents.length - registeredCount;

  const handleExport = (type: 'pdf' | 'excel') => {
    const data = filteredEvents.map(ev => {
      const g = ev.gastos;
      if (!g) {
        return [
          ev.eventName,
          '—',
          '—',
          '—',
          'Pendiente'
        ];
      }
      const totalBs = g.alimentacionBs + g.hospedajeBs + g.transporteBs + 
                      g.soporteTecnicoBs + g.bancaElectronicaBs + g.gastosTributariosBs + 
                      g.conductorAyudanteBs + g.mantenimientoLimpiezaBs;
      return [
        ev.eventName,
        g.tasaBcv,
        totalBs,
        g.totalUsd,
        'Registrado'
      ];
    });

    const filterText = [
      selectedMonths.length > 0 ? `Meses: ${selectedMonths.map(m => months[Number(m)]).join(', ')}` : '',
      selectedUnitTypes.length > 0 ? `Tipos: ${selectedUnitTypes.join(', ')}` : '',
      selectedStatuses.length > 0 ? `Estados: ${selectedStatuses.join(', ')}` : ''
    ].filter(Boolean).join(' | ');

    const config = {
      title: 'Gastos y Viáticos Operativos',
      filename: 'Gastos_Viaticos_BNC',
      headers: ['Evento / Unidad', 'Tasa BCV (Bs/USD)', 'Total (Bs.)', 'Total (USD)', 'Estado'],
      data,
      filters: filterText || 'Vista Global'
    };

    if (type === 'pdf') exportToPDF(config);
    if (type === 'excel') exportToExcel(config);
  };

  return (
    <div className="space-y-6 w-full max-w-[95%] xl:max-w-[98%] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-[#00205B]">Gastos y Viáticos Operativos</h2>
          <div className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
            <span className="font-bold text-gray-800">{mobileEvents.length} Total</span>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-[#00205B]">{registeredCount} Registrados</span>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-[#FE5000]">{missingCount} Faltantes</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportDropdown 
            onExportPDF={() => handleExport('pdf')}
            onExportExcel={() => handleExport('excel')}
          />
          <GastosImport />
          <button 
            onClick={() => openModal('gastos', true)}
            className="flex items-center gap-2 bg-[#FE5000] text-white px-5 h-10 rounded-xl font-medium hover:bg-[#e04700] shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Añadir Gasto</span>
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
              multiple
              options={[{ value: 'all', label: 'Todos los Meses' }, ...availableMonths]}
              value={selectedMonths}
              onChange={(val: string[]) => {
                setSelectedMonths(val);
                if (selectedEventIds.length > 0) setSelectedEventIds([]);
              }}
              icon={<Calendar className="w-4 h-4" />}
              emptyText="No hay meses"
            />
          </div>

          <div className="w-full md:w-48">
            <ComboBox
              multiple
              options={[
                { value: 'all', label: 'Todos los Estatus' },
                { value: 'registered', label: 'Registrados' },
                { value: 'pending', label: 'Pendientes' }
              ]}
              value={selectedStatuses}
              onChange={(val: string[]) => setSelectedStatuses(val)}
              icon={<Filter className="w-4 h-4" />}
              emptyText="No hay estatus"
            />
          </div>

          <div className="w-full md:w-48">
            <ComboBox
              multiple
              options={[
                { value: 'all', label: 'Todas las Unidades' },
                { value: 'Agencia Móvil', label: 'Agencia Móvil' },
                { value: 'Unidad Móvil', label: 'Unidad Móvil' }
              ]}
              value={selectedUnitTypes}
              onChange={(val: string[]) => {
                setSelectedUnitTypes(val);
                if (selectedEventIds.length > 0) setSelectedEventIds([]);
              }}
              icon={<Truck className="w-4 h-4" />}
              emptyText="No hay tipos"
            />
          </div>

          <div className="w-full md:flex-1">
            <ComboBox
              multiple
              options={[{ value: 'all', label: 'Todos los Eventos / Agencias' }, ...availableEvents]}
              value={selectedEventIds}
              onChange={(val: string[]) => setSelectedEventIds(val)}
              icon={<Search className="w-4 h-4" />}
              emptyText="No hay operativos"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedMonths([]);
              setSelectedEventIds([]);
              setSelectedStatuses([]);
              setSelectedUnitTypes([]);
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
                  .sort((a, b) => {
                    const aHasGastos = !!a.gastos;
                    const bHasGastos = !!b.gastos;
                    
                    if (aHasGastos && !bHasGastos) return -1;
                    if (!aHasGastos && bHasGastos) return 1;
                    
                    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                  });

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
                            g.estado === 'Convalidado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-[#00205B]'
                          }`}>
                            {g.estado === 'Pendiente' ? 'Registrado' : g.estado}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-[#FE5000]">
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
