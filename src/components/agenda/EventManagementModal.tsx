"use client";

import { X, Save, FileText, BarChart2, DollarSign, ChevronLeft, Calendar as CalendarIcon, Briefcase, Users, Search, MapPin, ChevronDown, Trash2, CreditCard } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { useToast } from '@/context/ToastContext';
import { EventType, EventStatus } from '@/lib/mock-data';
import ComboBox from '@/components/ui/ComboBox';

function CurrencyInput({ label, name, value, onChange }: { label: string, name: string, value: number, onChange: (name: string, val: number) => void }) {
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

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input 
        type="text" 
        name={name} 
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className="w-full border-gray-200 rounded-lg text-sm bg-white focus:ring-[#FE5000] focus:border-[#FE5000] transition-colors"
        placeholder="0,00" 
      />
    </div>
  );
}

function TasaInput({ value, onChange }: { value: number, onChange: (val: number) => void }) {
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
    onChange(Number(numericStr) || 0);
  };

  return (
    <input 
      type="text" 
      value={displayValue}
      onChange={handleChange}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      placeholder="0,00"
      className="text-gray-900 font-bold text-xl w-32 bg-transparent border-none focus:ring-0 p-0 text-right outline-none" 
    />
  );
}

export default function EventManagementModal() {
  const { events, agencies, updateEvent, deleteEvent, addEvent, modalState, closeModal, setModalMode, setModalEventId } = useAgenda();
  const { showToast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const event = events.find(e => e.id === modalState.eventId);
  
  // Local states for the selection filters
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventSearchMonth, setEventSearchMonth] = useState<number | 'all'>('all');
  
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Calculate available months for pending events
  const availableModalMonths = useMemo(() => {
    const validMonths = new Set<number>();
    events.forEach(ev => {
      if (modalState.mode === 'gastos' && ev.gastos) return;
      if (modalState.mode === 'cifras' && ev.cifras) return;
      if (modalState.mode === 'gastos' && ev.type === 'Red de Agencias') return;
      
      if (ev.startDate) {
        const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
        validMonths.add(evMonth);
      }
    });
    return Array.from(validMonths).sort((a, b) => a - b);
  }, [events, modalState.mode]);

  // Filter events for selection lists
  const filteredModalEvents = useMemo(() => {
    return events.filter(ev => {
      if (modalState.mode === 'gastos' && ev.gastos) return false;
      if (modalState.mode === 'cifras' && ev.cifras) return false;
      if (modalState.mode === 'gastos' && ev.type === 'Red de Agencias') return false;

      const query = eventSearchQuery.toLowerCase();
      if (query && !ev.eventName.toLowerCase().includes(query) && !ev.agencyCode?.toLowerCase().includes(query) && !(ev.location || '').toLowerCase().includes(query)) {
        return false;
      }
      
      if (eventSearchMonth !== 'all' && ev.startDate) {
        const evMonth = parseInt(ev.startDate.split('-')[1], 10) - 1;
        if (evMonth !== eventSearchMonth) return false;
      }
      
      return true;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [events, modalState.mode, eventSearchQuery, eventSearchMonth]);

  // Reset filters when modal opens/closes
  useEffect(() => {
    setEventSearchQuery('');
    setEventSearchMonth('all');
  }, [modalState.isOpen, modalState.mode]);
  
  // Local states for the forms
  const [bcvRate, setBcvRate] = useState<number>(0);
  
  // Gastos state
  const [gastosValues, setGastosValues] = useState({
    alimentacion: 0,
    hospedaje: 0,
    transporte: 0,
    soporteTecnico: 0,
    bancaElectronica: 0,
    gastosTributarios: 0,
    conductorAyudante: 0,
    mantenimientoLimpieza: 0,
    combustible: 0,
    distancia: 0,
  });
  
  const handleGastosChange = (name: string, val: number) => {
    setGastosValues(prev => ({ ...prev, [name]: val }));
  };

  // Resumen calculations
  const totalBs = 
    gastosValues.alimentacion + 
    gastosValues.hospedaje + 
    gastosValues.transporte + 
    gastosValues.soporteTecnico + 
    gastosValues.bancaElectronica + 
    gastosValues.gastosTributarios + 
    gastosValues.conductorAyudante + 
    gastosValues.mantenimientoLimpieza + 
    (event?.type === 'Unidad Móvil' ? gastosValues.combustible : 0);
    
  const totalUsd = bcvRate > 0 ? totalBs / bcvRate : 0;
  
  // Custom dropdown state
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(ev: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(ev.target as Node)) {
        setIsEventDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Local states for the Edit Event form
  const [editType, setEditType] = useState<EventType>('Agencia Móvil');
  const [editCc, setEditCc] = useState('');
  const [editAgencyName, setEditAgencyName] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editZone, setEditZone] = useState('');
  const [editState, setEditState] = useState('');
  const [isSameLocation, setIsSameLocation] = useState<boolean>(true);
  const [editEstadoOperativo, setEditEstadoOperativo] = useState<string>('');
  const [editStatus, setEditStatus] = useState<EventStatus>('Planificado');
  const [editSegments, setEditSegments] = useState<{startDate: string, endDate: string}[]>([{ 
    startDate: new Date().toISOString().split('T')[0], 
    endDate: new Date().toISOString().split('T')[0] 
  }]);

  // Sync edit form state when event changes
  useEffect(() => {
    if (modalState.mode === 'create') {
      setEditType('Agencia Móvil');
      setEditCc('');
      setIsSameLocation(true);
      setEditEstadoOperativo('');
      setEditStatus('Planificado');
      setEditSegments([{ 
        startDate: modalState.defaultDate || new Date().toISOString().split('T')[0], 
        endDate: modalState.defaultDate || new Date().toISOString().split('T')[0] 
      }]);
    } else if (event) {
      setEditType(event.type);
      // Extract code from agencyCode like "025 - Centro"
      const codeMatch = event.agencyCode?.split(' - ')[0]?.trim() || '';
      setEditCc(codeMatch);
      setIsSameLocation(!event.estadoOperativo);
      setEditEstadoOperativo(event.estadoOperativo || event.state || '');
      setEditStatus(event.status);
      if (event.segments && event.segments.length > 0) {
        setEditSegments(event.segments);
      } else {
        setEditSegments([{ 
          startDate: event.startDate || modalState.defaultDate || new Date().toISOString().split('T')[0], 
          endDate: event.endDate || modalState.defaultDate || new Date().toISOString().split('T')[0] 
        }]);
      }
    }
    if (event?.gastos) {
      setBcvRate(event.gastos.tasaBcv || 0);
      setGastosValues({
        alimentacion: event.gastos.alimentacionBs || 0,
        hospedaje: event.gastos.hospedajeBs || 0,
        transporte: event.gastos.transporteBs || 0,
        soporteTecnico: event.gastos.soporteTecnicoBs || 0,
        bancaElectronica: event.gastos.bancaElectronicaBs || 0,
        gastosTributarios: event.gastos.gastosTributariosBs || 0,
        conductorAyudante: event.gastos.conductorAyudanteBs || 0,
        mantenimientoLimpieza: event.gastos.mantenimientoLimpiezaBs || 0,
        combustible: event.gastos.gastoCombustibleBs || 0,
        distancia: event.gastos.distanciaKm || 0,
      });
    } else {
      setBcvRate(0);
      setGastosValues({
        alimentacion: 0, hospedaje: 0, transporte: 0, soporteTecnico: 0, 
        bancaElectronica: 0, gastosTributarios: 0, conductorAyudante: 0, mantenimientoLimpieza: 0,
        combustible: 0, distancia: 0,
      });
    }
  }, [event?.id, modalState.mode]);

  // Autocomplete for edit form
  useEffect(() => {
    const cleanInput = editCc.trim();
    if (cleanInput.length > 0) {
      const match = agencies.find(cc => {
        const dbCode = cc.code?.toString().trim();
        return dbCode === cleanInput || (Number(dbCode) === Number(cleanInput) && !isNaN(Number(cleanInput)));
      });
      if (match) {
        setEditAgencyName(match.name);
        setEditRegion(match.region);
        setEditZone(match.zone);
        setEditState(match.state);
      } else {
        setEditAgencyName('');
        setEditRegion('');
        setEditZone('');
        setEditState('');
      }
    } else {
      setEditAgencyName('');
      setEditRegion('');
      setEditZone('');
      setEditState('');
    }
  }, [editCc, agencies]);

  if (!modalState.isOpen) return null;

  const handleSaveCifras = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const isUnidadMovil = event.type === 'Unidad Móvil';
    
    const cifras = {
      cuentasAbiertas: Math.max(0, parseInt(formData.get('cuentasAbiertas') as string) || 0),
      tdd: Math.max(0, parseInt(formData.get('tdd') as string) || 0),
      reclamos: Math.max(0, parseInt(formData.get('reclamos') as string) || 0),
      saldosCaptadosBs: event.cifras?.saldosCaptadosBs || 0,
      atmConsultas: isUnidadMovil ? Math.max(0, parseInt(formData.get('atmConsultas') as string) || 0) : 0,
      atmRetiros: isUnidadMovil ? Math.max(0, parseInt(formData.get('atmRetiros') as string) || 0) : 0,
      atmCambioClave: isUnidadMovil ? Math.max(0, parseInt(formData.get('atmCambioClave') as string) || 0) : 0,
    };
    try {
        updateEvent(event.id, { cifras, status: 'Culminado' }).catch(console.error);
        showToast('Cifras guardadas y evento culminado', 'success');
        if (modalState.isGlobal) closeModal(); else setModalMode('menu');
      } finally {
        setIsSubmitting(false);
      }
  };

  const handleSaveGastos = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;
    
    if (bcvRate === 0) {
      showToast('Por favor, ingresa una tasa BCV mayor a 0', 'info');
      return;
    }
    
    setIsSubmitting(true);
    const gastos = {
      alimentacionBs: gastosValues.alimentacion,
      hospedajeBs: gastosValues.hospedaje,
      transporteBs: gastosValues.transporte,
      soporteTecnicoBs: gastosValues.soporteTecnico,
      bancaElectronicaBs: gastosValues.bancaElectronica,
      gastosTributariosBs: gastosValues.gastosTributarios,
      conductorAyudanteBs: gastosValues.conductorAyudante,
      mantenimientoLimpiezaBs: gastosValues.mantenimientoLimpieza,
      gastoCombustibleBs: event.type === 'Unidad Móvil' ? gastosValues.combustible : 0,
      distanciaKm: event.type === 'Unidad Móvil' ? gastosValues.distancia : 0,
      tasaBcv: bcvRate,
      totalUsd: Number(totalUsd.toFixed(2)),
      estado: 'Pendiente' as const
    };
    
    try {
        updateEvent(event.id, { gastos }).catch(console.error);
        showToast(`Gastos guardados. Equivalente: $${totalUsd.toFixed(2)}`, 'success');
        if (modalState.isGlobal) closeModal(); else setModalMode('menu');
      } finally {
        setIsSubmitting(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#00205B]">
            <div className="flex items-center gap-4">
              {modalState.mode !== 'menu' && !modalState.isGlobal && (
                <button 
                  onClick={() => setModalMode('menu')}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {modalState.mode === 'menu' ? 'Opciones del Evento' : 
                   modalState.mode === 'create' ? 'Registrar Nuevo Evento' :
                   modalState.mode === 'datos' ? 'Editar Evento' : 
                   modalState.mode === 'cifras' ? 'Cifras Atendidas' : 'Gastos y Viáticos'}
                </h3>
                {event && (
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-blue-200 text-sm font-medium">{event.eventName} ({event.agencyCode})</p>
                    {modalState.mode === 'menu' && (
                      <div className="relative" ref={dropdownRef}>
                        <button 
                          onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer ${
                            event.status === 'Culminado' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                            event.status === 'En Proceso' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                            event.status === 'Cancelado' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                            'bg-orange-100 text-[#FE5000] hover:bg-orange-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {event.status}
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </button>
                        
                        {isEventDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            {(['Planificado', 'En Proceso', 'Culminado', 'Cancelado'] as EventStatus[]).map(s => (
                              <button
                                key={s}
                                onClick={async () => {
                                  setIsEventDropdownOpen(false);
                                  await updateEvent(event.id, { status: s });
                                  showToast(`Estatus actualizado a ${s}`, 'success');
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                                  event.status === s ? 'bg-gray-50 text-[#00205B]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#00205B]'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={closeModal}
              className="text-blue-200 bg-transparent hover:bg-white/10 hover:text-white rounded-lg text-sm w-8 h-8 flex justify-center items-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-8 overflow-y-auto flex-1 bg-gray-50/50">
            
            {/* VIEW 1: MENU (Solo visible si no es modo global y el evento está seleccionado) */}
            {modalState.mode === 'menu' && event && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                <button 
                  onClick={() => setModalMode('datos')}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-[#00205B] hover:shadow-lg transition-all group"
                >
                  <div className="w-14 h-14 bg-blue-50 text-[#00205B] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-base">Editar Evento</h4>
                  <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">Modificar nombre, fechas, centro de costo o estatus.</p>
                </button>

                <button 
                  onClick={() => setModalMode('cifras')}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-[#009639] hover:shadow-lg transition-all group"
                >
                  <div className="w-14 h-14 bg-green-50 text-[#009639] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <BarChart2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-base">Cifras Atendidas</h4>
                  <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">Registrar cuentas, TDD y terminales POS.</p>
                </button>

                <button 
                  onClick={() => setModalMode('gastos')}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-indigo-600 hover:shadow-lg transition-all group"
                >
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-base">Gastos y Viáticos</h4>
                  <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">Detallar gastos y fijar la tasa BCV del operativo.</p>
                </button>

                <button 
                  onClick={async () => {
                    if (window.confirm(`¿Estás seguro de que deseas eliminar el evento "${event.eventName}"? Esta acción no se puede deshacer.`)) {
                      await deleteEvent(event.id);
                      closeModal();
                    }
                  }}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-red-600 hover:bg-red-50 hover:shadow-lg transition-all group"
                >
                  <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Trash2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-red-600 text-base">Eliminar Evento</h4>
                  <p className="text-xs text-red-500/80 text-center mt-2 leading-relaxed">Borrar de forma permanente este operativo.</p>
                </button>
              </div>
            )}

            {/* VIEW 2: DATOS DEL EVENTO O CREAR */}
            {(modalState.mode === 'datos' || modalState.mode === 'create') && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  const fd = new FormData(e.currentTarget);
                  const ccCode = editCc;
                  const ccMatch = agencies.find(c => c.code === ccCode);
                  
                  // Calcular startDate y endDate globales basados en los tramos
                  const sortedSegments = [...editSegments].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                  const globalStartDate = sortedSegments.length > 0 ? sortedSegments[0].startDate : new Date().toISOString().split('T')[0];
                  
                  // endDate global debe ser el endDate más lejano
                  const globalEndDate = sortedSegments.length > 0 
                    ? [...sortedSegments].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0].endDate 
                    : new Date().toISOString().split('T')[0];

                  const payload = {
                    type: editType,
                    eventName: String(fd.get('eventName')),
                    agencyCode: ccMatch ? `${ccMatch.code} - ${ccMatch.name}` : ccCode,
                    region: editRegion || event?.region || '',
                    state: editState || event?.state || '',
                    zone: editZone || event?.zone || '',
                    location: String(fd.get('location')),
                    estadoOperativo: isSameLocation ? undefined : editEstadoOperativo,
                    vpSolicitante: String(fd.get('vpSolicitante')),
                    responsable: String(fd.get('responsable')),
                    startDate: globalStartDate,
                    endDate: globalEndDate,
                    segments: editSegments,
                    status: editStatus,
                  };

                  try {
                    if (modalState.mode === 'create') {
                      addEvent(payload).catch(console.error);
                      showToast('Evento creado correctamente', 'success');
                      closeModal();
                    } else if (event) {
                      updateEvent(event.id, payload).catch(console.error);
                      showToast('Evento actualizado correctamente', 'success');
                      setModalMode('menu');
                    }
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="space-y-6"
              >
                {/* Tipo de Evento */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-gray-900">Tipo de Evento</label>
                  <div className="flex gap-3">
                    {(['Agencia Móvil', 'Unidad Móvil', 'Red de Agencias'] as EventType[]).map((type) => (
                      <label
                        key={type}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 border rounded-xl cursor-pointer transition-all text-center ${
                          editType === type
                            ? 'border-[#00205B] bg-blue-50/50 text-[#00205B] ring-1 ring-[#00205B]'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio" name="eventType" value={type}
                          className="sr-only"
                          checked={editType === type}
                          onChange={() => setEditType(type)}
                        />
                        <span className="font-medium text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Centro de Costo y Autocompletado */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="md:col-span-1">
                    <label className="block mb-1 text-xs font-bold text-gray-700">Cód. Centro Costo</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 start-0 flex items-center ps-2.5 pointer-events-none">
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={editCc}
                        onChange={(e) => setEditCc(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#00205B] focus:border-[#00205B] block w-full ps-8 p-2.5 shadow-sm"
                        placeholder="Ej: 001"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-xs font-bold text-gray-700">Nombre de Agencia</label>
                    <input
                      type="text"
                      disabled
                      value={editAgencyName || event?.agencyCode || ''}
                      className="bg-gray-100 border border-gray-200 text-gray-500 font-medium text-sm rounded-xl block w-full p-3"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block mb-1 text-xs font-bold text-gray-700">Región</label>
                    <input
                      type="text" disabled value={editRegion}
                      className="bg-gray-100/50 border border-transparent text-gray-600 font-medium text-sm rounded-xl block w-full p-2.5"
                      placeholder="Autocompletado"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block mb-1 text-xs font-bold text-gray-700">Estado</label>
                    <input
                      type="text" disabled value={editState}
                      className="bg-gray-100/50 border border-transparent text-gray-600 font-medium text-sm rounded-xl block w-full p-2.5"
                      placeholder="Autocompletado"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block mb-1 text-xs font-bold text-gray-700">Zona</label>
                    <input
                      type="text" disabled value={editZone}
                      className="bg-gray-100/50 border border-transparent text-gray-600 font-medium text-sm rounded-xl block w-full p-2.5"
                      placeholder="Autocompletado"
                    />
                  </div>
                </div>

                {/* Switch de Ubicación Real */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 my-4 flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={isSameLocation}
                        onChange={(e) => setIsSameLocation(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00205B]"></div>
                    </div>
                    <span className="text-sm font-semibold text-[#00205B]">
                      ¿El operativo es en la misma localidad del Centro de Costo?
                    </span>
                  </label>
                  
                  {!isSameLocation && (
                    <div className="pt-2 border-t border-blue-200/50 mt-2">
                      <label className="block mb-2 text-sm font-semibold text-gray-900">Estado Físico del Operativo</label>
                      <ComboBox
                        value={editEstadoOperativo}
                        onChange={(val) => setEditEstadoOperativo(val)}
                        placeholder="Seleccione el estado logístico real..."
                        options={['Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'].map(st => ({
                          value: st,
                          label: st
                        }))}
                      />
                    </div>
                  )}
                </div>

                {/* Nombre del Operativo y Estado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-900">Nombre del Operativo Especial</label>
                    <input
                      type="text"
                      name="eventName"
                      defaultValue={event?.eventName || ''}
                      className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#00205B] focus:border-[#00205B] block w-full p-3 transition-colors"
                      placeholder="Ej: Operativo Plaza Bolívar"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-900">Estado del Evento</label>
                    <ComboBox
                      options={[
                        { value: 'Planificado', label: 'Planificado' },
                        { value: 'En Proceso', label: 'En Proceso' },
                        { value: 'Culminado', label: 'Culminado' },
                        { value: 'Cancelado', label: 'Cancelado' }
                      ]}
                      value={editStatus}
                      onChange={(val) => setEditStatus(val as EventStatus)}
                    />
                  </div>
                </div>

                {/* Campos Organizacionales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-900">VP Solicitante</label>
                    <input
                      type="text"
                      name="vpSolicitante"
                      defaultValue={event?.vpSolicitante || ''}
                      placeholder="Ej: VP Negocios"
                      className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#00205B] focus:border-[#00205B] block w-full p-3 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-900">Responsable del Evento</label>
                    <input
                      type="text"
                      name="responsable"
                      defaultValue={event?.responsable || ''}
                      placeholder="Ej: Nombre Apellido"
                      className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#00205B] focus:border-[#00205B] block w-full p-3 transition-colors"
                    />
                  </div>
                </div>

                {/* Ubicación y Tramos */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-900">Ubicación Específica</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        <MapPin className="w-4 h-4 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        name="location"
                        defaultValue={event?.location || ''}
                        placeholder="Dirección exacta de instalación..."
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#00205B] focus:border-[#00205B] block w-full ps-10 p-3 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 mt-2">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-900">Tramos de Fechas del Operativo</label>
                      <button 
                        type="button" 
                        onClick={() => setEditSegments([...editSegments, { startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }])}
                        className="text-xs font-bold text-[#00205B] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        + Añadir Tramo
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {editSegments.map((segment, index) => (
                        <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="text-xs font-bold text-gray-400 w-6">#{index + 1}</span>
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <div className="relative">
                                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                                </div>
                                <input
                                  type="date"
                                  required
                                  value={segment.startDate}
                                  onChange={(e) => {
                                    const newSegments = [...editSegments];
                                    newSegments[index].startDate = e.target.value;
                                    setEditSegments(newSegments);
                                  }}
                                  className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-[#00205B] focus:border-[#00205B] block w-full ps-10 p-2 transition-colors shadow-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <div className="relative">
                                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                                </div>
                                <input
                                  type="date"
                                  required
                                  value={segment.endDate}
                                  onChange={(e) => {
                                    const newSegments = [...editSegments];
                                    newSegments[index].endDate = e.target.value;
                                    setEditSegments(newSegments);
                                  }}
                                  className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-[#00205B] focus:border-[#00205B] block w-full ps-10 p-2 transition-colors shadow-sm"
                                />
                              </div>
                            </div>
                          </div>
                          {editSegments.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => setEditSegments(editSegments.filter((_, i) => i !== index))}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button disabled={isSubmitting} type="submit" className="flex items-center gap-2 bg-[#00205B] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#00153b] shadow-sm disabled:opacity-50">
                    <Save className="w-4 h-4" /> {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 3: CIFRAS */}
            {modalState.mode === 'cifras' && (
              <div className="space-y-6">
                {modalState.isGlobal && !event && (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 mb-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Buscar por nombre, C.C o ubicación..."
                          value={eventSearchQuery}
                          onChange={(e) => setEventSearchQuery(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-[#00205B] focus:border-[#00205B]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
                      <button
                        onClick={() => setEventSearchMonth('all')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                          eventSearchMonth === 'all' 
                            ? 'bg-[#00205B] text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Todos
                      </button>
                      {availableModalMonths.map(mIdx => (
                        <button
                          key={mIdx}
                          onClick={() => setEventSearchMonth(mIdx)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                            eventSearchMonth === mIdx 
                              ? 'bg-[#00205B] text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {months[mIdx]}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                      {filteredModalEvents.length === 0 ? (
                        <div className="col-span-1 md:col-span-2 text-center py-8 text-gray-500">
                          No hay operativos pendientes que coincidan con la búsqueda.
                        </div>
                      ) : (
                        filteredModalEvents.map(ev => (
                          <div
                            key={ev.id}
                            onClick={() => setModalEventId(ev.id)}
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
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              <span>{ev.startDate}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                
                {event ? (
                  <div>
                    {modalState.isGlobal && (
                      <button 
                        onClick={() => setModalEventId(null)}
                        className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#00205B] transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" /> Volver a la lista de eventos
                      </button>
                    )}
                    <form onSubmit={handleSaveCifras} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block mb-2 text-sm font-semibold text-gray-900">Cuentas Abiertas</label>
                    <input type="number" name="cuentasAbiertas" defaultValue={event.cifras?.cuentasAbiertas || 0} min="0" className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg w-full p-2.5" />
                  </div>
                  <div className="bg-green-50/50 p-4 rounded-xl border border-green-200 shadow-sm">
                    <label className="block mb-2 text-sm font-semibold text-green-900">Tarjetas de Débito BNC (TDD)</label>
                    <input type="number" name="tdd" defaultValue={event.cifras?.tdd || 0} min="0" className="bg-white border border-green-300 text-green-900 font-bold text-sm rounded-lg w-full p-2.5" />
                  </div>
                  <div className={`${event.type === 'Unidad Móvil' ? 'md:col-span-2' : 'md:col-span-2'} bg-white p-4 rounded-xl border border-gray-200 shadow-sm`}>
                    <label className="block mb-2 text-sm font-semibold text-gray-900">Otras Operaciones de Servicios (Reclamos, etc)</label>
                    <input type="number" name="reclamos" defaultValue={event.cifras?.reclamos || 0} min="0" className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg w-full p-2.5" />
                  </div>
                </div>

                {event.type === 'Unidad Móvil' && (
                  <div className="bg-[#00205B]/5 p-5 rounded-xl border border-[#00205B]/20 shadow-sm mt-6">
                    <h4 className="font-bold text-[#00205B] mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Operaciones de ATM (Cajero Automático)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">Consultas</label>
                        <input type="number" name="atmConsultas" defaultValue={event.cifras?.atmConsultas || 0} min="0" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg w-full p-2.5 focus:ring-[#FE5000] focus:border-[#FE5000]" />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">Retiros</label>
                        <input type="number" name="atmRetiros" defaultValue={event.cifras?.atmRetiros || 0} min="0" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg w-full p-2.5 focus:ring-[#FE5000] focus:border-[#FE5000]" />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">Cambio de Clave</label>
                        <input type="number" name="atmCambioClave" defaultValue={event.cifras?.atmCambioClave || 0} min="0" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg w-full p-2.5 focus:ring-[#FE5000] focus:border-[#FE5000]" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button disabled={isSubmitting} type="submit" className="flex items-center gap-2 bg-[#009639] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#007a2e] shadow-sm disabled:opacity-50">
                    <Save className="w-4 h-4" /> {isSubmitting ? 'Guardando...' : (modalState.isGlobal ? 'Guardar Cifras' : 'Guardar y Volver')}
                  </button>
                </div>
              </form>
                  </div>
                ) : null}
              </div>
            )}

            {/* VIEW 4: GASTOS DETALLADOS */}
            {modalState.mode === 'gastos' && (
              <div className="space-y-6">
                {modalState.isGlobal && !event && (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 mb-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Buscar por nombre, C.C o ubicación..."
                          value={eventSearchQuery}
                          onChange={(e) => setEventSearchQuery(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-[#00205B] focus:border-[#00205B]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
                      <button
                        onClick={() => setEventSearchMonth('all')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                          eventSearchMonth === 'all' 
                            ? 'bg-[#00205B] text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Todos
                      </button>
                      {availableModalMonths.map(mIdx => (
                        <button
                          key={mIdx}
                          onClick={() => setEventSearchMonth(mIdx)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                            eventSearchMonth === mIdx 
                              ? 'bg-[#00205B] text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {months[mIdx]}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                      {filteredModalEvents.length === 0 ? (
                        <div className="col-span-1 md:col-span-2 text-center py-8 text-gray-500">
                          No hay operativos pendientes que coincidan con la búsqueda.
                        </div>
                      ) : (
                        filteredModalEvents.map(ev => (
                          <div
                            key={ev.id}
                            onClick={() => setModalEventId(ev.id)}
                            className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#FE5000] hover:shadow-md hover:bg-orange-50/30 transition-all text-left flex flex-col"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-gray-900 line-clamp-1">{ev.eventName}</span>
                              <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-lg whitespace-nowrap">{ev.agencyCode}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-auto pt-2">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              <span>{ev.startDate}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                
                {event ? (
                  <div>
                    {modalState.isGlobal && (
                      <button 
                        onClick={() => setModalEventId(null)}
                        className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#00205B] transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" /> Volver a la lista de eventos
                      </button>
                    )}
                    <form onSubmit={handleSaveGastos} className="space-y-6">
                
                {/* Tasa BCV Header */}
                <div className="bg-gradient-to-r from-orange-50 to-white border border-orange-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h4 className="font-bold text-[#FE5000] text-lg">Fijación de Tasa Promedio Mensual</h4>
                    <p className="text-sm text-gray-600 mt-1">Este valor en Bs/USD congelará el cálculo del equivalente total del evento.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-orange-200 shadow-inner">
                    <span className="font-bold text-gray-500">Bs.</span>
                    <TasaInput 
                      value={bcvRate} 
                      onChange={(val) => setBcvRate(val)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Bloque 1: Gastos de Personal */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#00205B] border-b border-gray-200 pb-2">
                      <Users className="w-5 h-5" />
                      <h4 className="font-bold text-lg">1. Gastos de Personal</h4>
                    </div>
                          <div className="space-y-3">
                      <CurrencyInput label="Alimentación (Bs.)" name="alimentacion" value={gastosValues.alimentacion} onChange={handleGastosChange} />
                      <CurrencyInput label="Hospedaje (Bs.)" name="hospedaje" value={gastosValues.hospedaje} onChange={handleGastosChange} />
                      <CurrencyInput label="Transporte (Bs.)" name="transporte" value={gastosValues.transporte} onChange={handleGastosChange} />
                    </div>
                  </div>

                  {/* Bloque 2: Gastos Especiales / Técnicos */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#FE5000] border-b border-gray-200 pb-2">
                      <Briefcase className="w-5 h-5" />
                      <h4 className="font-bold text-lg">2. Gastos Especiales Operativos</h4>
                    </div>
                    <div className="space-y-3">
                      <CurrencyInput label="Soporte Técnico (Bs.)" name="soporteTecnico" value={gastosValues.soporteTecnico} onChange={handleGastosChange} />
                      <div className="grid grid-cols-2 gap-3">
                        <CurrencyInput label="Banca Electrónica" name="bancaElectronica" value={gastosValues.bancaElectronica} onChange={handleGastosChange} />
                        <CurrencyInput label="Gastos Tributarios" name="gastosTributarios" value={gastosValues.gastosTributarios} onChange={handleGastosChange} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <CurrencyInput label="Conductor / Ayudante" name="conductorAyudante" value={gastosValues.conductorAyudante} onChange={handleGastosChange} />
                        <CurrencyInput label="Mantto. / Limpieza" name="mantenimientoLimpieza" value={gastosValues.mantenimientoLimpieza} onChange={handleGastosChange} />
                      </div>
                      
                      {event.type === 'Unidad Móvil' && (
                        <div className="mt-6 pt-5 border-t border-gray-200">
                          <h5 className="font-bold text-[#00205B] text-sm mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Traslado de Unidad Móvil
                          </h5>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <CurrencyInput label="Gasto de Combustible" name="combustible" value={gastosValues.combustible} onChange={handleGastosChange} />
                            <div>
                              <label className="block mb-2 text-xs font-bold text-gray-700 uppercase tracking-wide">Distancia (Km)</label>
                              <input 
                                type="number" 
                                value={gastosValues.distancia || ''} 
                                onChange={e => handleGastosChange('distancia', Number(e.target.value) || 0)}
                                className="w-full bg-white border border-gray-300 text-gray-900 text-base font-bold rounded-xl px-4 py-3 focus:ring-[#FE5000] focus:border-[#FE5000] transition-colors" 
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-sm flex justify-between items-center">
                            <span className="font-bold text-gray-600">Costo Estimado por Kilómetro:</span>
                            <span className="font-bold text-[#FE5000] text-base">
                              Bs. {gastosValues.distancia > 0 ? (gastosValues.combustible / gastosValues.distancia).toFixed(2) : '0.00'} / Km
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tarjeta Resumen Financiero Total */}
                <div className="mt-8 bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-inner">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Resumen Financiero Total</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                      <span className="font-semibold text-gray-700">Total en Bolívares</span>
                      <span className="text-xl font-bold text-[#00205B]">Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalBs)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-green-100">
                      <span className="font-semibold text-gray-700">Equivalente en Dólares</span>
                      <span className="text-xl font-bold text-[#009639] flex items-center gap-1">
                        USD $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalUsd)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                  <button disabled={isSubmitting} type="submit" className="flex items-center gap-2 bg-[#FE5000] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e04700] shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                    <Save className="w-5 h-5" /> {isSubmitting ? 'Guardando...' : 'Guardar Gastos'}
                  </button>
                </div>
              </form>
                  </div>
                ) : null}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
