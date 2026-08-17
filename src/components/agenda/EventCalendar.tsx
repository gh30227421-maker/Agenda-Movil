"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AgendaEvent, EventType } from '@/lib/mock-data';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Truck, Building2, Store, Printer } from 'lucide-react';
import { useAgenda } from '@/context/AgendaContext';
import Loader from '@/components/ui/Loader';

interface EventCalendarProps {
  events: AgendaEvent[];
}

export default function EventCalendar({ events }: EventCalendarProps) {
  const { isLoading, handleSeed, isSeeding, openModal } = useAgenda();
  // Start in July 2026 for the demo, or fallback to current month
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // State for the confirmation modal when clicking an empty day
  const [confirmDateModal, setConfirmDateModal] = useState<{isOpen: boolean, date: string | null}>({isOpen: false, date: null});
  // State for the overflow events popover
  const [popoverState, setPopoverState] = useState<{isOpen: boolean, day: number, events: any[]}>({isOpen: false, day: 0, events: []});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsInMonth = events.filter(event => {
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`;
    if (event.segments && event.segments.length > 0) {
      return event.segments.some(seg => seg.startDate <= endStr && seg.endDate >= startStr);
    }
    return event.startDate <= endStr && event.endDate >= startStr;
  });

  const getEventStyle = (type: EventType) => {
    switch (type) {
      case 'Agencia Móvil': return { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-[#00205B]', icon: <Building2 className="w-3 h-3" />, solid: '#00205B' };
      case 'Unidad Móvil': return { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-[#FE5000]', icon: <Truck className="w-3 h-3" />, solid: '#FE5000' };
      case 'Red de Agencias': return { bg: 'bg-green-50', border: 'border-green-100', text: 'text-[#009639]', icon: <Store className="w-3 h-3" />, solid: '#009639' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: <Calendar className="w-3 h-3" />, solid: '#6b7280' };
    }
  };

  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => {
      if (event.segments && event.segments.length > 0) {
        return event.segments.some(seg => seg.startDate <= dateStr && seg.endDate >= dateStr);
      }
      return event.startDate <= dateStr && event.endDate >= dateStr;
    });
  };

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleSetMonth = (m: number) => setCurrentDate(new Date(year, m, 1));

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setConfirmDateModal({ isOpen: true, date: dateStr });
  };

  const formatDateLabel = (dateStr: string | null) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return `${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`;
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: landscape;
            margin: 5mm;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide EVERYTHING */
          body * {
            visibility: hidden;
          }
          /* Show ONLY the calendar container */
          #print-calendar-container, #print-calendar-container * {
            visibility: visible;
          }
          #print-calendar-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
            transform: scale(0.9);
            transform-origin: top center;
          }
          
          /* The grid containing the days */
          #print-calendar-grid {
            flex-grow: 1;
            height: auto !important;
          }
          
          /* Cell styling for print to avoid truncation */
          #print-calendar-grid > div {
             min-height: 0 !important;
             height: 100% !important;
             overflow: hidden !important;
             page-break-inside: avoid;
             padding: 2px !important;
          }
          
          /* Adjust event buttons to be more compact in print */
          #print-calendar-grid button {
             padding: 2px 4px !important;
             margin-bottom: 2px !important;
             box-shadow: none !important;
             border-left-width: 3px !important;
          }
          
          #print-calendar-grid span, #print-calendar-grid div {
             line-height: 1.1 !important;
          }
          
          /* Header compacting */
          #print-calendar-container > div:first-child {
             padding: 8px !important;
          }
          /* Day names compacting */
          #print-calendar-container > div:nth-child(2) {
             padding-top: 2px !important;
             padding-bottom: 2px !important;
          }
          /* Legend compacting */
          #print-calendar-container > div:last-of-type {
             padding: 5px !important;
          }
        }
      `}} />
      <div className="space-y-6">
      {events.length === 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 text-center">
          <h3 className="text-xl font-bold text-[#FE5000] mb-2">Base de Datos Vacía</h3>
          <p className="text-gray-600 mb-4">No se encontraron operativos. Puedes comenzar a crearlos manualmente o sembrar la base de datos con los datos de prueba.</p>
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className="px-6 py-3 bg-[#FE5000] text-white rounded-xl font-bold shadow-md hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {isSeeding ? 'Sembrando Datos...' : 'Sembrar Datos de Prueba (Seed)'}
          </button>
        </div>
      )}

      {/* Month Selector Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex items-center gap-2 overflow-x-auto hide-scrollbar print:hidden">
        {monthNames.map((mName, idx) => (
          <button
            key={mName}
            onClick={() => handleSetMonth(idx)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              month === idx 
                ? 'bg-[#00205B] text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-[#00205B]'
            }`}
          >
            {mName}
          </button>
        ))}
      </div>

      <div id="print-calendar-container" className="bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
        {/* Header del Calendario */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 gap-4">
          <div className="flex flex-col xl:flex-row xl:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-[#00205B] tracking-tight">
                {monthNames[month]} {year}
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Programación mensual de operativos</p>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">
              <span className="font-bold text-[#00205B]">{eventsInMonth.length} Eventos en {monthNames[month]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="px-4 py-2.5 bg-[#FE5000] text-white rounded-xl text-sm font-bold hover:bg-[#E04700] transition-colors shadow-sm flex items-center gap-2 hide-on-download print:hidden">
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button onClick={handlePrevMonth} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:border-[#00205B] hover:text-[#00205B] transition-colors shadow-sm print:hidden">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-[#00205B] hover:text-[#00205B] transition-colors shadow-sm print:hidden">
              Hoy
            </button>
            <button onClick={handleNextMonth} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:border-[#00205B] hover:text-[#00205B] transition-colors shadow-sm print:hidden">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grid del Calendario */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-white">
          {dayNames.map(day => (
            <div key={day} className="py-4 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>
        
        <div id="print-calendar-grid" className="grid grid-cols-7 grid-rows-6 bg-gray-100 gap-[1px] flex-grow min-h-[60vh] lg:min-h-[70vh]">
          {/* Blanks */}
          {blanks.map(blank => (
            <div key={`blank-${blank}`} className="bg-white min-h-[100px] lg:min-h-[110px] h-full opacity-40"></div>
          ))}
          
          {/* Days */}
          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            const today = new Date();
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isEmpty = dayEvents.length === 0;
            
            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`bg-white min-h-[100px] lg:min-h-[110px] h-full p-2 flex flex-col group transition-colors hover:bg-blue-50/10 cursor-pointer overflow-hidden`}
              >
                <div className="flex justify-between items-center mb-2 px-1 pt-1">
                  <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-[#FE5000] text-white shadow-md' : 'text-gray-700 group-hover:bg-gray-100'}`}>
                    {day}
                  </span>
                  <span className="text-[10px] text-[#FE5000] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Añadir
                  </span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {dayEvents.slice(0, 2).map(event => {
                    const style = getEventStyle(event.type);
                    return (
                      <button 
                        key={`${event.id}-${day}`} 
                        onClick={(e) => { e.stopPropagation(); openModal('menu', false, event.id); }}
                        className={`w-full text-left p-2.5 rounded-xl border-l-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col gap-1.5 ${style.bg} ${style.border}`}
                        title={`${event.type} - ${event.eventName}`}
                        style={{ borderLeftColor: style.solid }}
                      >
                        <div className={`flex items-start gap-1.5 font-bold text-[10px] sm:text-[11px] leading-tight ${style.text}`}>
                          <div className="mt-0.5">{style.icon}</div>
                          <span className="line-clamp-2">{event.eventName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-gray-500 font-medium ml-4">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </button>
                    )
                  })}
                  
                  {dayEvents.length > 2 && (
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setPopoverState({ isOpen: true, day, events: dayEvents }); 
                      }}
                      className="w-full text-left px-2 py-1 text-[11px] font-bold text-[#00205B] hover:bg-blue-50 rounded-lg transition-colors mt-1"
                    >
                      +{dayEvents.length - 2} más
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Leyenda */}
        <div className="p-5 bg-white flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-bold text-gray-600 border-t border-gray-100">
          <div className="flex items-center gap-2 bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100 text-[#00205B]">
            <Building2 className="w-4 h-4" />
            <span>Agencia Móvil</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50/50 px-4 py-2 rounded-xl border border-orange-100 text-[#FE5000]">
            <Truck className="w-4 h-4" />
            <span>Unidad Móvil</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50/50 px-4 py-2 rounded-xl border border-green-100 text-[#009639]">
            <Store className="w-4 h-4" />
            <span>Red de Agencias</span>
          </div>
        </div>

        {/* Modal de Confirmación Global usando Portal */}
        {mounted && confirmDateModal.isOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#00205B]/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#00205B]">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-[#00205B] mb-2 tracking-tight">¿Registrar operativo?</h3>
                <p className="text-sm text-gray-600 mb-6 font-medium">
                  Has seleccionado el día:<br/>
                  <strong className="text-base text-gray-900 mt-1 block">{formatDateLabel(confirmDateModal.date)}</strong>
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setConfirmDateModal({isOpen: false, date: null})}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    No
                  </button>
                  <button 
                    onClick={() => {
                      openModal('create', false, null, confirmDateModal.date);
                      setConfirmDateModal({isOpen: false, date: null});
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#FE5000] text-white font-bold hover:bg-[#e04700] transition-colors shadow-md"
                  >
                    Sí, Registrar
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Modal Popover para exceso de eventos */}
        {mounted && popoverState.isOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#00205B]/20 backdrop-blur-sm p-4" onClick={() => setPopoverState({isOpen: false, day: 0, events: []})}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                <h3 className="font-bold text-[#00205B] flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {popoverState.day} de {monthNames[month]}
                </h3>
                <button 
                  onClick={() => setPopoverState({isOpen: false, day: 0, events: []})} 
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors text-xl font-bold"
                >
                  &times;
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-3">
                  {popoverState.events.map(event => {
                    const style = getEventStyle(event.type);
                    return (
                      <button 
                        key={`popover-${event.id}`} 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setPopoverState({isOpen: false, day: 0, events: []});
                          openModal('menu', false, event.id); 
                        }}
                        className={`w-full text-left p-3 rounded-xl border-l-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col gap-1.5 ${style.bg} ${style.border}`}
                        style={{ borderLeftColor: style.solid }}
                      >
                        <div className={`flex items-start gap-2 font-bold text-xs sm:text-sm leading-tight ${style.text}`}>
                          <div className="mt-0.5">{style.icon}</div>
                          <span>{event.eventName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium ml-5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </button>
                    )
                  })}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
      </div>
    </>
  );
}
