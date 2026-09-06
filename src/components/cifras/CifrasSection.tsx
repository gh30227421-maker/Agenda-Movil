"use client";

import { useState, useMemo } from 'react';
import { CreditCard, Users, PiggyBank, Plus, Edit2, Filter, Search, BarChart3, CalendarRange, XCircle, Calendar, Truck } from 'lucide-react';
import { useAgenda } from '@/context/AgendaContext';
import { useToast } from '@/context/ToastContext';
import ComboBox from '@/components/ui/ComboBox';
import CifrasImport from './CifrasImport';
import ExportDropdown from '@/components/ui/ExportDropdown';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';

export default function CifrasSection() {
  const { events, openModal } = useAgenda();
  const { showToast } = useToast();

  const currentMonth = new Date().getMonth().toString();
  const [selectedMonths, setSelectedMonths] = useState<string[]>([currentMonth]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
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
      
      const matchUnit = selectedUnitTypes.length === 0 || selectedUnitTypes.includes(ev.type);
      
      return matchEvent && matchMonth && matchUnit;
    });
  }, [events, selectedEventIds, selectedMonths, selectedUnitTypes]);

  const totales = filteredEvents.reduce((acc, ev) => {
    if (ev.cifras) {
      acc.cuentasAbiertas += ev.cifras.cuentasAbiertas || 0;
      acc.tdd += ev.cifras.tdd || 0;
      acc.reclamos += ev.cifras.reclamos || 0;
    }
    return acc;
  }, { cuentasAbiertas: 0, tdd: 0, reclamos: 0 });

  const formatNumber = (num: number) => {
    return num.toLocaleString('es-VE');
  };

  const eventosConCifras = filteredEvents.filter(e => e.cifras).length;
  const eventosSinCifras = filteredEvents.length - eventosConCifras;
  const totalOperaciones = totales.cuentasAbiertas + totales.tdd + totales.reclamos;
  const totalJornadas = filteredEvents.length;

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [filteredEvents]);

  const handleExport = (type: 'pdf' | 'excel') => {
    const data = filteredEvents.filter(e => e.cifras).map(ev => {
      const c = ev.cifras!;
      const totalOps = c.cuentasAbiertas + c.tdd + c.reclamos;
      return [
        ev.eventName,
        ev.agencyCode || '',
        ev.type,
        c.cuentasAbiertas,
        c.tdd,
        c.reclamos,
        totalOps
      ];
    });
    
    const filterText = [
      selectedMonths.length > 0 ? `Meses: ${selectedMonths.map(m => months[Number(m)]).join(', ')}` : '',
      selectedUnitTypes.length > 0 ? `Tipos: ${selectedUnitTypes.join(', ')}` : ''
    ].filter(Boolean).join(' | ');

    const config = {
      title: 'Auditoría Global de Cifras',
      filename: 'Cifras_Operativas_BNC',
      headers: ['Evento / C.C.', 'Agencia', 'Tipo', 'Cuentas Abiertas', 'BNC TDD', 'Otras Ops/Reclamos', 'Total Ops'],
      data,
      filters: filterText || 'Vista Global'
    };

    if (type === 'pdf') exportToPDF(config);
    if (type === 'excel') exportToExcel(config);
  };

  return (
    <div className="space-y-6 w-full max-w-[95%] xl:max-w-[98%] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#00205B]">Auditoría Global de Cifras</h2>
        <div className="flex flex-wrap items-center gap-3">
          <ExportDropdown 
            onExportPDF={() => handleExport('pdf')}
            onExportExcel={() => handleExport('excel')}
          />
          <CifrasImport />
          <button 
            onClick={() => openModal('cifras', true)}
            className="flex items-center justify-center gap-2 bg-[#009639] text-white px-5 h-10 rounded-xl font-medium hover:bg-[#007a2e] shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Añadir Cifras
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
                // Si cambiamos meses y hay eventos seleccionados, limpiamos por simplicidad
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
                { value: 'all', label: 'Todas las Unidades' },
                { value: 'Agencia Móvil', label: 'Agencia Móvil' },
                { value: 'Unidad Móvil', label: 'Unidad Móvil' },
                { value: 'Red de Agencias', label: 'Red de Agencias' }
              ]}
              value={selectedUnitTypes}
              onChange={(val: string[]) => {
                setSelectedUnitTypes(val);
                if (selectedEventIds.length > 0) setSelectedEventIds([]); // Reset event si type cambia
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
              icon={<Filter className="w-4 h-4" />}
              emptyText="No hay operativos"
            />
          </div>
          
          <button
            type="button"
            onClick={() => {
              setSelectedMonths([new Date().getMonth().toString()]);
              setSelectedUnitTypes([]);
              setSelectedEventIds([]);
            }}
            className="shrink-0 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#FE5000] transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span className="hidden md:inline">Limpiar</span>
          </button>
        </div>

        {/* KPIs Compactos Integrados */}
        <div className="flex items-center gap-6 md:border-l md:border-gray-200 md:pl-6 md:ml-2 w-full md:w-auto justify-around md:justify-start pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1">
              <CalendarRange className="w-3.5 h-3.5 text-[#009639]" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Jornadas</span>
            </div>
            <span className="text-xl font-black text-[#00205B]">{formatNumber(totalJornadas)}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Registradas</span>
            </div>
            <span className="text-lg font-bold text-green-600">{eventosConCifras}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
               <span className="w-2 h-2 rounded-full bg-orange-400"></span>
               <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pendientes</span>
            </div>
            <span className="text-lg font-bold text-orange-500">{eventosSinCifras}</span>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Global */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col justify-center">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">Cuentas Abiertas</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#00205B]">
              <PiggyBank className="w-5 h-5" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{formatNumber(totales.cuentasAbiertas)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col justify-center">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">TDD Entregadas</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#009639]">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{formatNumber(totales.tdd)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col justify-center">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">Otras Operaciones</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{formatNumber(totales.reclamos)}</h3>
          </div>
        </div>

        <div className="bg-[#00205B] rounded-2xl p-4 shadow-sm border border-[#00205B] flex flex-col justify-center text-white">
          <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-2">Total Consolidado</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-3xl font-bold text-white">{formatNumber(totalOperaciones)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col justify-center">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">TDD Prom. / Jornada</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">
              {eventosConCifras > 0 ? formatNumber(Math.round(totales.tdd / eventosConCifras)) : 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabla Global */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Desglose Operativo por Jornada</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-4">Evento / C.C.</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-center">Cuentas Abiertas</th>
                <th className="px-6 py-4 text-center text-[#009639]">BNC TDD</th>
                <th className="px-6 py-4 text-center">Total Ops</th>
                <th className="px-6 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedEvents.map(ev => {
                const c = ev.cifras;
                const totalOps = c ? c.cuentasAbiertas + c.tdd + c.reclamos : 0;
                
                // Formato de fecha básico YYYY-MM-DD a DD/MM/YYYY si existe
                let displayDate = 'N/A';
                if (ev.startDate) {
                  const parts = ev.startDate.split('-');
                  if (parts.length === 3) {
                    displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                  } else {
                    displayDate = ev.startDate;
                  }
                }

                return (
                  <tr key={ev.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {ev.eventName} <br/>
                      <span className="text-xs text-gray-500 font-normal">{ev.agencyCode}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600 whitespace-nowrap">{displayDate}</td>
                    <td className="px-6 py-4 text-xs font-medium">{ev.type}</td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-800">{c ? formatNumber(c.cuentasAbiertas) : '-'}</td>
                    <td className="px-6 py-4 text-center font-bold text-[#009639] bg-green-50/30">{c ? formatNumber(c.tdd) : '-'}</td>
                    <td className="px-6 py-4 text-center font-bold text-[#00205B]">{c ? formatNumber(totalOps) : '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openModal('cifras', true, ev.id)}
                        className={`inline-flex items-center justify-center w-24 gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm ${
                          c ? 'bg-gray-100 hover:bg-[#00205B] hover:text-white text-gray-700' : 'bg-orange-100 hover:bg-orange-600 hover:text-white text-orange-700'
                        }`}
                        title={c ? 'Editar cifras' : 'Registrar cifras'}
                      >
                        {c ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {c ? 'Editar' : 'Registrar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedEvents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No hay eventos en este mes o con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
