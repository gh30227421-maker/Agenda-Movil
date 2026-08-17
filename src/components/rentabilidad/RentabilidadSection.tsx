"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Info,
  Plus,
  Edit2,
  X,
  Save,
  Calculator,
  MapPin,
  ChevronLeft,
  Filter,
  Search,
  XCircle,
  Calendar,
  Truck
} from 'lucide-react';
import { useAgenda, type EventRow } from '@/context/AgendaContext';
import { useToast } from '@/context/ToastContext';
import ComboBox from '@/components/ui/ComboBox';
import CierresImport from './CierresImport';
import ExportDropdown from '@/components/ui/ExportDropdown';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';

// ... Add CurrencyInput component right after imports
function CurrencyInput({ label, name, value, onChange, prefix = "Bs." }: { label: string, name: string, value: number, prefix?: string, onChange: (name: string, val: number) => void }) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (value === 0) return '';
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  });
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
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
    onChange(name, Number(numericStr) || 0);
  };

  const handleBlur = () => setIsFocused(false);
  const handleFocus = () => setIsFocused(true);

  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold text-sm">{prefix}</span>
        <input 
          type="text" 
          name={name} 
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className="w-full bg-white border border-gray-300 text-gray-900 text-base font-bold rounded-xl pl-12 pr-4 py-3 focus:ring-[#009639] focus:border-[#009639] transition-colors"
          placeholder="0,00" 
        />
      </div>
    </div>
  );
}

// Umbrales de rentabilidad
const UMBRAL_RENTABLE = 60;    // margenPct >= 60% → Rentable
const UMBRAL_LIMITE  = 20;    // margenPct >= 20% → Al Límite; debajo → No Rentable

type EstadoRentabilidad = 'Rentable' | 'Al Límite' | 'No Rentable' | 'Sin Datos';

function calcularEstado(margenPct: number, tieneDatos: boolean): EstadoRentabilidad {
  if (!tieneDatos) return 'Sin Datos';
  if (margenPct >= UMBRAL_RENTABLE) return 'Rentable';
  if (margenPct >= UMBRAL_LIMITE)  return 'Al Límite';
  return 'No Rentable';
}

/**
 * Formateador de números estándar venezolano:
 * Miles con punto (.) y decimales con coma (,)
 * Ej: 350000 -> "350.000,00"
 */
function fmtVE(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0,00';
  const parts = Math.abs(val).toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const formatted = parts.join(',');
  return val < 0 ? `-${formatted}` : formatted;
}

export default function RentabilidadSection() {
  const { events, updateEvent } = useAgenda();
  const { showToast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [filterEventId, setFilterEventId] = useState<string | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Sin Datos' | 'Rentable' | 'No Rentable'>('all');
  const [filterUnitType, setFilterUnitType] = useState<'all' | 'Agencia Móvil' | 'Unidad Móvil'>('all');

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const availableMonths = useMemo(() => {
    const validMonths = new Set<number>();
    events.forEach(ev => {
      if (ev.type === 'Red de Agencias') return;
      if (filterUnitType !== 'all' && ev.type !== filterUnitType) return;
      if (filterEventId !== 'all' && ev.id !== filterEventId) return;
      if (ev.startDate) {
        const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
        validMonths.add(evMonth);
      }
    });
    return Array.from(validMonths).sort((a, b) => a - b).map(m => ({ value: m.toString(), label: months[m] }));
  }, [events, filterEventId]);

  const availableEvents = useMemo(() => {
    const evs: { value: string, label: string }[] = [];
    events.forEach(ev => {
      if (ev.type === 'Red de Agencias') return;
      if (filterUnitType !== 'all' && ev.type !== filterUnitType) return;
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
      if (ev.type === 'Red de Agencias') return false; // Excluir Red de Agencias de módulos financieros

      const matchEvent = filterEventId === 'all' || ev.id === filterEventId;
      let matchMonth = true;
      if (selectedMonth !== 'all' && ev.startDate) {
        const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
        matchMonth = evMonth === selectedMonth;
      }
      
      const matchUnit = filterUnitType === 'all' || ev.type === filterUnitType;
      
      return matchEvent && matchMonth && matchUnit;
    }).sort((a, b) => {
      const aHasData = !!a.cifras && ((a.cifras.saldosCaptadosBs || 0) > 0 || (a.cifras.saldoCierreDivisas || 0) > 0);
      const bHasData = !!b.cifras && ((b.cifras.saldosCaptadosBs || 0) > 0 || (b.cifras.saldoCierreDivisas || 0) > 0);
      
      if (aHasData && !bHasData) return -1;
      if (!aHasData && bHasData) return 1;
      
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [events, filterEventId, selectedMonth, filterUnitType]);

  const [isSaldoModalOpen, setIsSaldoModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [saldoInputBs, setSaldoInputBs] = useState<number>(0);
  const [saldoInputUsd, setSaldoInputUsd] = useState<number>(0);

  const [saldoSearchQuery, setSaldoSearchQuery] = useState('');
  const [saldoSearchMonth, setSaldoSearchMonth] = useState<number | 'all'>('all');

  const availableSaldoMonths = useMemo(() => {
    const validMonths = new Set<number>();
    events.forEach(ev => {
      if (ev.type === 'Red de Agencias') return;
      if (ev.cifras && ((ev.cifras.saldosCaptadosBs && ev.cifras.saldosCaptadosBs > 0) || (ev.cifras.saldoCierreDivisas && ev.cifras.saldoCierreDivisas > 0))) return;
      
      if (ev.startDate) {
        const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
        validMonths.add(evMonth);
      }
    });
    return Array.from(validMonths).sort((a, b) => a - b);
  }, [events]);

  const filteredSaldoEvents = useMemo(() => {
    return events.filter(ev => {
      if (ev.type === 'Red de Agencias') return false;
      if (ev.cifras && ((ev.cifras.saldosCaptadosBs && ev.cifras.saldosCaptadosBs > 0) || (ev.cifras.saldoCierreDivisas && ev.cifras.saldoCierreDivisas > 0))) return false;

      const query = saldoSearchQuery.toLowerCase();
      if (query && !ev.eventName.toLowerCase().includes(query) && !ev.agencyCode?.toLowerCase().includes(query) && !(ev.location || '').toLowerCase().includes(query)) {
        return false;
      }
      
      if (saldoSearchMonth !== 'all' && ev.startDate) {
        const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
        if (evMonth !== saldoSearchMonth) return false;
      }
      
      return true;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, saldoSearchQuery, saldoSearchMonth]);

  useEffect(() => {
    if (isSaldoModalOpen) {
      setSaldoSearchQuery('');
      setSaldoSearchMonth('all');
    }
  }, [isSaldoModalOpen]);

  const openSaldoModalForEvent = (eventId: string, currentSaldoBs: number = 0, currentSaldoUsd: number = 0) => {
    setSelectedEventId(eventId);
    setSaldoInputBs(currentSaldoBs);
    setSaldoInputUsd(currentSaldoUsd);
    setIsSaldoModalOpen(true);
  };

  const handleSaveSaldo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      showToast('Por favor selecciona una jornada', 'info');
      return;
    }

    const targetEvent = events.find(ev => ev.id === selectedEventId);
    if (!targetEvent) return;

    const newSaldoBs = saldoInputBs;
    const newSaldoUsd = saldoInputUsd;
    const currentCifras = targetEvent.cifras || { cuentasAbiertas: 0, tdd: 0, reclamos: 0 };

    updateEvent(selectedEventId, {
      cifras: {
        ...currentCifras,
        saldosCaptadosBs: newSaldoBs,
        saldoCierreDivisas: newSaldoUsd,
      },
    });

    showToast('Saldo de fin de mes registrado exitosamente', 'success');
    setIsSaldoModalOpen(false);
    setSelectedEventId('');
    setSaldoInputUsd(0);
  };

  const filasRaw = filteredEvents.map((ev) => {
    const tieneCifras   = !!ev.cifras;
    const tieneGastos   = !!ev.gastos;
    const tasaBcv       = ev.gastos?.tasaBcv ?? 1; // fallback 1 para evitar div/0

    // 📊 SALDOS E INGRESOS 📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊📊
    const saldosBs      = ev.cifras?.saldosCaptadosBs ?? 0;
    const saldoDivisas  = ev.cifras?.saldoCierreDivisas ?? 0;
    const saldosUsd     = (tasaBcv > 0 ? saldosBs / tasaBcv : 0) + saldoDivisas;

    // ── COSTOS ──────────────────────────────────────────────────────────────
    const costosUsd     = ev.gastos?.totalUsd ?? 0;
    let costosBs        = 0;
    if (tieneGastos) {
      const g = ev.gastos!;
      costosBs =
        g.alimentacionBs + g.hospedajeBs + g.transporteBs +
        g.soporteTecnicoBs + g.bancaElectronicaBs + g.gastosTributariosBs +
        g.conductorAyudanteBs + g.mantenimientoLimpiezaBs + (g.gastoCombustibleBs || 0);
    } else if (costosUsd > 0 && tasaBcv > 0) {
      costosBs = costosUsd * tasaBcv;
    }

    // ── MARGEN Y RENTABILIDAD ───────────────────────────────────────────────
    const margenUsd     = saldosUsd - costosUsd;
    const margenPct     = saldosUsd > 0 ? (margenUsd / saldosUsd) * 100 : 0;
    const tieneDatos    = saldosBs > 0 || saldoDivisas > 0;
    const estado        = calcularEstado(margenPct, tieneDatos);

    return {
      ev, tieneDatos, tasaBcv,
      saldosBs, saldosUsd,
      costosBs, costosUsd,
      margenUsd, margenPct, estado,
    };
  });

  const filas = filasRaw.filter(f => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'Rentable') return f.estado === 'Rentable' || f.estado === 'Al Límite';
    return f.estado === filterStatus;
  });

  const mobileEvents = filteredEvents.filter(e => e.type === 'Agencia Móvil' || e.type === 'Unidad Móvil');
  const cerradosCount = mobileEvents.filter(e => e.cifras && ((e.cifras.saldosCaptadosBs || 0) > 0 || (e.cifras.saldoCierreDivisas || 0) > 0)).length;
  const missingCount = mobileEvents.length - cerradosCount;

  // ── TOTALES GLOBALES ───────────────────────────────────────────────────────

  // ── TOTALES GLOBALES ───────────────────────────────────────────────────────
  const totSaldosBs       = filas.reduce((a, f) => a + f.saldosBs,     0);
  const totSaldosUsd      = filas.reduce((a, f) => a + f.saldosUsd,    0);
  const totCostosBs       = filas.reduce((a, f) => a + f.costosBs,     0);
  const totCostosUsd      = filas.reduce((a, f) => a + f.costosUsd,    0);
  const totMargenUsd      = totSaldosUsd - totCostosUsd;
  const rentabilidadGlobal = totSaldosUsd > 0
    ? (totMargenUsd / totSaldosUsd) * 100
    : 0;
  const estadoGlobal      = calcularEstado(rentabilidadGlobal, totSaldosUsd > 0);

  // Colores por estado
  const colorPalette: Record<EstadoRentabilidad, { badge: string; text: string; bar: string }> = {
    'Rentable':    { badge: 'bg-green-50 text-[#009639] border-green-200',  text: 'text-[#009639]', bar: 'bg-[#009639]' },
    'Al Límite':   { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'text-yellow-700', bar: 'bg-yellow-500' },
    'No Rentable': { badge: 'bg-red-50 text-red-600 border-red-200',         text: 'text-red-600',   bar: 'bg-red-500' },
    'Sin Datos':   { badge: 'bg-gray-100 text-gray-400 border-gray-200',     text: 'text-gray-400',  bar: 'bg-gray-300' },
  };

  const iconoPorEstado = (e: EstadoRentabilidad) => {
    if (e === 'Rentable')    return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (e === 'Al Límite')   return <MinusCircle className="w-3.5 h-3.5" />;
    if (e === 'No Rentable') return <AlertCircle className="w-3.5 h-3.5" />;
    return <Info className="w-3.5 h-3.5" />;
  };

  const activeEventForModal = events.find(ev => ev.id === selectedEventId);
  const isGlobalMarginPositive = totMargenUsd >= 0;

  const handleExport = (type: 'pdf' | 'excel') => {
    const data = filas.map(({ ev, tieneDatos, tasaBcv, saldosBs, saldosUsd, costosBs, costosUsd, margenUsd, margenPct, estado }) => {
      return [
        ev.eventName,
        ev.agencyCode || '',
        tieneDatos ? saldosBs : 'Sin Datos',
        tieneDatos ? tasaBcv : 'Sin Datos',
        tieneDatos ? saldosUsd : 'Sin Datos',
        costosBs,
        costosUsd,
        margenUsd,
        margenPct,
        estado
      ];
    });

    const filterText = [
      selectedMonth !== 'all' ? `Mes: ${months[Number(selectedMonth)]}` : '',
      filterUnitType !== 'all' ? `Tipo: ${filterUnitType}` : '',
      filterStatus !== 'all' ? `Estado: ${filterStatus}` : ''
    ].filter(Boolean).join(' | ');

    const config = {
      title: 'Rentabilidad y Cierre Financiero',
      filename: 'Cierre_Operativo_Rentabilidad_BNC',
      headers: ['Jornada', 'Agencia', 'Cierre Bs.', 'Tasa BCV', 'Cierre USD', 'Costo Bs.', 'Costo USD', 'Margen USD', 'Rentab. %', 'Estado'],
      data,
      filters: filterText || 'Vista Global'
    };

    if (type === 'pdf') exportToPDF(config);
    if (type === 'excel') exportToExcel(config);
  };

  return (
    <div className="space-y-8 w-full max-w-[95%] xl:max-w-[98%] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#00205B]">Rentabilidad y Cierre Financiero</h2>
            <p className="text-gray-500 text-sm mt-1">
              Resumen contable de Saldos Fin de Mes (Bs. y USD) vs. Costos Operativos (Bs. y USD).
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
            <span className="font-bold text-gray-800">{mobileEvents.length} Total</span>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-[#009639]">{cerradosCount} Cerrados</span>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-[#FE5000]">{missingCount} Faltantes</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ExportDropdown 
            onExportPDF={() => handleExport('pdf')}
            onExportExcel={() => handleExport('excel')}
          />
          <CierresImport />
          <button
            onClick={() => {
              setSelectedEventId('');
              setSaldoInputBs(0);
              setIsSaldoModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#009639] text-white px-5 h-10 rounded-xl font-medium hover:bg-[#007a2e] shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Registrar Saldo Fin de Mes</span>
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
                if (numVal !== 'all' && filterEventId !== 'all') {
                  const ev = events.find(e => e.id === filterEventId);
                  if (ev && ev.startDate) {
                    const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
                    if (evMonth !== numVal) setFilterEventId('all');
                  }
                }
              }}
              icon={<Calendar className="w-4 h-4" />}
              emptyText="No hay meses"
            />
          </div>

          <div className="w-full md:w-48">
            <ComboBox
              options={[
                { value: 'all', label: 'Todos los Estatus' },
                { value: 'Sin Datos', label: 'Sin Datos' },
                { value: 'Rentable', label: 'Rentable' },
                { value: 'No Rentable', label: 'No Rentable' }
              ]}
              value={filterStatus}
              onChange={(val) => setFilterStatus(val as 'all' | 'Sin Datos' | 'Rentable' | 'No Rentable')}
              icon={<Filter className="w-4 h-4" />}
              emptyText="No hay estatus"
            />
          </div>

          <div className="w-full md:w-48">
            <ComboBox
              options={[
                { value: 'all', label: 'Todas las Unidades' },
                { value: 'Agencia Móvil', label: 'Agencia Móvil' },
                { value: 'Unidad Móvil', label: 'Unidad Móvil' }
              ]}
              value={filterUnitType}
              onChange={(val) => {
                setFilterUnitType(val as 'all' | 'Agencia Móvil' | 'Unidad Móvil');
                setFilterEventId('all'); // Reset event if type changes
              }}
              icon={<Truck className="w-4 h-4" />}
              emptyText="No hay tipos"
            />
          </div>

          <div className="w-full md:flex-1">
            <ComboBox
              options={[{ value: 'all', label: 'Todos los Eventos / Agencias' }, ...availableEvents]}
              value={filterEventId}
              onChange={(val) => {
                setFilterEventId(val);
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
              setFilterUnitType('all');
              setFilterEventId('all');
              setFilterStatus('all');
            }}
            className="shrink-0 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#FE5000] transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span className="hidden md:inline">Limpiar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-full">

        {/* Saldo Fin de Mes (USD) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#00205B]" />
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Saldos</span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">SALDO FIN DE MES (USD)</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">
              ${fmtVE(totSaldosUsd)}
            </h3>
          </div>
          <p className="text-[11px] font-medium text-gray-400 mt-3 pt-3 border-t border-gray-100">
            Bs. {fmtVE(totSaldosBs)}
          </p>
        </div>

        {/* Costo Total (USD) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-[#FE5000]" />
              </div>
              <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">Costos</span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">COSTO TOTAL (USD)</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">
              ${fmtVE(totCostosUsd)}
            </h3>
          </div>
          <p className="text-[11px] font-medium text-gray-400 mt-3 pt-3 border-t border-gray-100">
            Bs. {fmtVE(totCostosBs)} operativos
          </p>
        </div>

        {/* Margen Neto Total */}
        <div className={`rounded-2xl p-5 shadow-sm border flex flex-col justify-between hover:shadow-md transition-shadow ${isGlobalMarginPositive ? 'bg-[#00205B] text-white' : 'bg-red-50/30 border-red-200'}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isGlobalMarginPositive ? 'bg-white/10' : 'bg-red-100'}`}>
                {isGlobalMarginPositive
                  ? <ArrowUpRight className="w-5 h-5 text-white" />
                  : <ArrowDownRight className="w-5 h-5 text-red-600" />}
              </div>
            </div>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${isGlobalMarginPositive ? 'text-blue-200' : 'text-gray-500'}`}>MARGEN NETO (USD)</p>
            <h3 className={`text-2xl font-bold mt-1 tracking-tight ${isGlobalMarginPositive ? 'text-white' : 'text-red-600'}`}>
              {isGlobalMarginPositive ? '+' : ''}${fmtVE(totMargenUsd)}
            </h3>
          </div>
          <p className={`text-[11px] font-medium mt-3 pt-3 border-t ${isGlobalMarginPositive ? 'text-blue-200 border-white/10' : 'text-gray-500 border-gray-200/60'}`}>
            Saldo − Costos
          </p>
        </div>

        {/* Rentabilidad Global */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#009639]" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorPalette[estadoGlobal].badge}`}>
                {estadoGlobal}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">RENTABILIDAD GLOBAL (%)</p>
            <h3 className={`text-2xl font-bold mt-1 tracking-tight ${colorPalette[estadoGlobal].text}`}>
              {fmtVE(rentabilidadGlobal)}%
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${colorPalette[estadoGlobal].bar}`}
                style={{ width: `${Math.min(Math.abs(rentabilidadGlobal), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda de umbrales */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="w-3 h-3 rounded-full bg-[#009639] inline-block" /> Rentable ≥ {UMBRAL_RENTABLE}%
        </span>
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Al Límite {UMBRAL_LIMITE}% – {UMBRAL_RENTABLE - 1}%
        </span>
        <span className="flex items-center gap-1.5 text-gray-500">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> No Rentable &lt; {UMBRAL_LIMITE}%
        </span>
      </div>

      {/* Tabla por Jornada - Diseño compacto sin scrollbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Cierre Contable por Jornada</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Comparativa de Saldo Fin de Mes vs. Costos Operativos en Bolívares y Dólares.
            </p>
          </div>
          <BarChart2 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="w-full overflow-hidden">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-3 py-3">JORNADA</th>
                <th className="px-2 py-3 text-right">CIERRE BS.</th>
                <th className="px-2 py-3 text-center">TASA</th>
                <th className="px-2 py-3 text-right">CONVERSIÓN $</th>
                <th className="px-2 py-3 text-right">CIERRE $</th>
                <th className="px-2 py-3 text-right">TOTAL CIERRE</th>
                <th className="px-2 py-3 text-right">COSTO BS.</th>
                <th className="px-2 py-3 text-right">COSTO $</th>
                <th className="px-2 py-3 text-right">MARGEN $</th>
                <th className="px-2 py-3 text-center">RENTAB. %</th>
                <th className="px-2 py-3 text-center">ESTADO</th>
                <th className="px-2 py-3 text-center">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filas.map(({ ev, tieneDatos, tasaBcv, saldosBs, saldosUsd, costosBs, costosUsd, margenUsd, margenPct, estado }) => (
                <tr key={ev.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-gray-900 leading-tight text-xs truncate max-w-[140px] sm:max-w-none">{ev.eventName}</p>
                    <span className="text-[10px] text-gray-400">{ev.agencyCode} · {ev.type}</span>
                  </td>

                  {/* 1. CIERRE BS. */}
                  <td className="px-2 py-3 text-right font-medium">
                    {tieneDatos
                      ? <span className="bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100 font-bold text-[#00205B] text-xs">
                          {fmtVE(saldosBs)}
                        </span>
                      : <span className="text-gray-300 font-semibold">—</span>}
                  </td>

                  {/* 2. TASA */}
                  <td className="px-2 py-3 text-center">
                    {ev.gastos
                      ? <span className="text-[11px] font-bold bg-orange-50 text-[#FE5000] border border-orange-200 px-1.5 py-0.5 rounded">{fmtVE(tasaBcv)}</span>
                      : <span className="text-gray-300 font-semibold">—</span>}
                  </td>

                  {/* 3. CONVERSIÓN EN $ */}
                  <td className="px-2 py-3 text-right font-medium text-gray-700">
                    {tieneDatos ? `$${fmtVE(tasaBcv > 0 ? saldosBs / tasaBcv : 0)}` : <span className="text-gray-300 font-semibold">—</span>}
                  </td>

                  {/* 4. CIERRE $ (DIVISAS DIRECTAS) */}
                  <td className="px-2 py-3 text-right font-medium text-emerald-600">
                    {tieneDatos ? `$${fmtVE(ev.cifras?.saldoCierreDivisas || 0)}` : <span className="text-gray-300 font-semibold">—</span>}
                  </td>

                  {/* 5. TOTAL CIERRE (USD) */}
                  <td className="px-2 py-3 text-right font-bold text-[#00205B] text-[13px]">
                    {tieneDatos ? `$${fmtVE(saldosUsd)}` : <span className="text-gray-300 font-semibold">—</span>}
                  </td>

                  {/* 6. COSTO BS. */}
                  <td className="px-2 py-3 text-right font-medium">
                    {costosBs > 0
                      ? <span className="bg-orange-50/80 px-2 py-0.5 rounded-md border border-orange-100 font-bold text-[#FE5000] text-[11px]">
                          {fmtVE(costosBs)}
                        </span>
                      : <span className="text-gray-300 font-semibold">—</span>}
                  </td>

                  {/* 7. COSTO $ */}
                  <td className="px-2 py-3 text-right font-bold text-[#FE5000]">
                    {costosUsd > 0
                      ? `$${fmtVE(costosUsd)}`
                      : <span className="text-gray-300 font-semibold">—</span>}
                  </td>

                  {/* 8. MARGEN $ */}
                  <td className="px-2 py-3 text-right">
                    {tieneDatos
                      ? <span className={`font-bold ${margenUsd >= 0 ? 'text-[#009639]' : 'text-red-600'}`}>
                          {margenUsd >= 0 ? '+' : ''}${fmtVE(margenUsd)}
                        </span>
                      : <span className="text-gray-300 font-semibold">—</span>}
                  </td>

                  {/* 7. RENTAB. % */}
                  <td className="px-2 py-3 text-center">
                    {tieneDatos
                      ? <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-[11px] font-bold ${colorPalette[estado].text}`}>
                            {fmtVE(margenPct)}%
                          </span>
                          <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${colorPalette[estado].bar}`}
                              style={{ width: `${Math.min(Math.max(margenPct, 0), 100)}%` }}
                            />
                          </div>
                        </div>
                      : <span className="text-gray-300 font-semibold">—</span>}
                  </td>

                  {/* 8. ESTADO */}
                  <td className="px-2 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colorPalette[estado].badge}`}>
                      {iconoPorEstado(estado)} {estado}
                    </span>
                  </td>

                  {/* 9. ACCIÓN */}
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => openSaldoModalForEvent(ev.id, saldosBs, ev.cifras?.saldoCierreDivisas || 0)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-gray-100 hover:bg-[#00205B] hover:text-white text-gray-700 transition-colors shadow-sm"
                      title="Registrar o Modificar Saldo de Fin de Mes"
                    >
                      <Edit2 className="w-3 h-3" />
                      {saldosBs > 0 ? 'Editar' : 'Ingresar'}
                    </button>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-16 text-center text-gray-400">
                    <TrendingUp className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="font-medium">No hay jornadas registradas.</p>
                    <p className="text-sm mt-1">Registra eventos en la Agenda para visualizar el análisis aquí.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de totales */}
        {events.length > 0 && (
          <div className="px-6 py-4 bg-[#00205B]/5 border-t border-[#00205B]/10 flex flex-wrap justify-end gap-6 text-xs font-bold">
            <span className="text-[#00205B]">
              Total Saldos: <span className="text-sm">Bs. {fmtVE(totSaldosBs)}</span> (${fmtVE(totSaldosUsd)})
            </span>
            <span className="text-[#FE5000]">
              Total Costos: <span className="text-sm">Bs. {fmtVE(totCostosBs)}</span> (${fmtVE(totCostosUsd)})
            </span>
            <span className={totMargenUsd >= 0 ? 'text-[#009639]' : 'text-red-600'}>
              Margen Final: <span className="text-sm">{totMargenUsd >= 0 ? '+' : ''}${fmtVE(totMargenUsd)}</span>
            </span>
            <span className={colorPalette[estadoGlobal].text}>
              Rentabilidad: <span className="text-sm">{fmtVE(rentabilidadGlobal)}%</span>
            </span>
          </div>
        )}
      </div>

      {/* MODAL DE REGISTRO DE SALDOS A FIN DE MES */}
      {isSaldoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header Modal */}
            <div className="bg-[#00205B] p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Registro de Saldo a Fin de Mes</h3>
                  <p className="text-xs text-blue-200">Módulo de Cierre Financiero</p>
                </div>
              </div>
              <button
                onClick={() => setIsSaldoModalOpen(false)}
                className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Modal */}
            <div className="p-6">
              {!selectedEventId ? (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 mb-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar por nombre, C.C o ubicación..."
                        value={saldoSearchQuery}
                        onChange={(e) => setSaldoSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-[#00205B] focus:border-[#00205B]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
                    <button
                      onClick={() => setSaldoSearchMonth('all')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                        saldoSearchMonth === 'all' 
                          ? 'bg-[#00205B] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Todos
                    </button>
                    {availableSaldoMonths.map((mIdx: number) => (
                      <button
                        key={mIdx}
                        onClick={() => setSaldoSearchMonth(mIdx)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                          saldoSearchMonth === mIdx 
                            ? 'bg-[#00205B] text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {months[mIdx]}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                    {filteredSaldoEvents.length === 0 ? (
                      <div className="col-span-1 md:col-span-2 text-center py-8 text-gray-500">
                        No hay operativos pendientes de cierre que coincidan con la búsqueda.
                      </div>
                    ) : (
                      filteredSaldoEvents.map((ev: any) => (
                        <div
                          key={ev.id}
                          onClick={() => {
                            setSelectedEventId(ev.id);
                            setSaldoInputBs(ev.cifras?.saldosCaptadosBs || 0);
                            setSaldoInputUsd(ev.cifras?.saldoCierreDivisas || 0);
                          }}
                          className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#009639] hover:shadow-md hover:bg-green-50/30 transition-all text-left flex flex-col"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-gray-900 line-clamp-1">{ev.eventName}</span>
                            <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-lg whitespace-nowrap">{ev.agencyCode}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-auto pt-2">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveSaldo} className="space-y-5">
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedEventId('');
                      setSaldoInputBs(0);
                      setSaldoInputUsd(0);
                    }}
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#00205B] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Volver a la lista de eventos
                  </button>

                  {/* Detalle del evento seleccionado */}
                  {activeEventForModal && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-1.5 text-xs text-gray-700">
                      <p><strong>Operativo:</strong> {activeEventForModal.eventName}</p>
                      <p><strong>Tasa BCV del Mes:</strong> Bs. {fmtVE(activeEventForModal.gastos?.tasaBcv || 1)}</p>
                      <p><strong>Costos Operativos Congelados:</strong> ${fmtVE(activeEventForModal.gastos?.totalUsd || 0)}</p>
                    </div>
                  )}

                  {/* Input Saldo en Bs */}
                  <div className="space-y-4">
                    <CurrencyInput 
                      label="SALDO FIN DE MES (BS.)" 
                      name="saldosCaptadosBs" 
                      value={saldoInputBs} 
                      onChange={(_, val) => setSaldoInputBs(val)} 
                    />

                    <CurrencyInput 
                      label="SALDO DE CIERRE EN DIVISAS (USD)" 
                      name="saldoCierreDivisas" 
                      value={saldoInputUsd} 
                      prefix="$"
                      onChange={(_, val) => setSaldoInputUsd(val)} 
                    />

                    {/* Previsualizaciones con formato venezolano */}
                    {activeEventForModal && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl space-y-2 text-sm">
                        <div className="flex justify-between font-medium text-gray-700">
                          <span>Conversión de Bs a USD:</span>
                          <span>$ {fmtVE(saldoInputBs / (activeEventForModal.gastos?.tasaBcv || 1))}</span>
                        </div>
                        <div className="flex justify-between font-medium text-gray-700">
                          <span>Divisas ingresadas (USD):</span>
                          <span>$ {fmtVE(saldoInputUsd)}</span>
                        </div>
                        <div className="pt-2 border-t border-green-200 flex justify-between font-bold text-[#00205B] text-base">
                          <span>TOTAL CIERRE (USD):</span>
                          <span>$ {fmtVE((saldoInputBs / (activeEventForModal.gastos?.tasaBcv || 1)) + saldoInputUsd)}</span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                      El monto en Bolívares se divide entre la Tasa BCV para obtener su equivalente en dólares, al cual se le suma el Saldo en Divisas para obtener el Total del Cierre Financiero.
                    </p>
                  </div>

                  {/* Footer Modal Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsSaldoModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#009639] text-white text-sm font-semibold hover:bg-[#007a2e] transition-colors shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      Guardar Cierre
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
