"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AgendaEvent, EventType } from '@/lib/mock-data';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Truck, Building2, Store, Printer, Menu } from 'lucide-react';
import { useAgenda } from '@/context/AgendaContext';
import Loader from '@/components/ui/Loader';

interface EventCalendarProps {
  events: AgendaEvent[];
  onToggleSidebar?: () => void;
}

export default function EventCalendar({ events, onToggleSidebar }: EventCalendarProps) {
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
      case 'Agencia Móvil': return { bg: 'bg-[#00205B]', border: 'border-transparent', text: 'text-white', icon: <Building2 className="w-3 h-3 text-white" />, solid: '#00205B' };
      case 'Unidad Móvil': return { bg: 'bg-[#FE5000]', border: 'border-transparent', text: 'text-white', icon: <Truck className="w-3 h-3 text-white" />, solid: '#FE5000' };
      case 'Red de Agencias': return { bg: 'bg-[#009639]', border: 'border-transparent', text: 'text-white', icon: <Store className="w-3 h-3 text-white" />, solid: '#009639' };
      default: return { bg: 'bg-gray-500', border: 'border-transparent', text: 'text-white', icon: <Calendar className="w-3 h-3 text-white" />, solid: '#6b7280' };
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
             padding: 4px !important;
          }
          /* Day names compacting */
          #print-calendar-container > div:nth-child(2) {
             padding-top: 2px !important;
             padding-bottom: 2px !important;
          }
          /* Legend hidden in print to save space if desired, or compact it */
          #print-calendar-container > div:last-of-type {
             padding: 2px !important;
          }
        }
      `}} />
      <div className="w-full h-full min-h-0 flex flex-col gap-3">
      {events.length === 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 text-center shrink-0">
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

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { 
            size: landscape; 
            margin: 5mm !important; 
          }
          html, body, main, #__next, .pantalla-completa {
            padding: 0 !important;
            margin: 0 !important;
            height: 100vh !important;
            min-height: 100vh !important;
            background: white !important;
            overflow: hidden !important;
            display: block !important; /* Evita que el body centre el contenido */
          }
          .print-wrapper {
            height: 98vh !important;
            max-height: 98vh !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important; /* ESTO PEGA TODO ARRIBA */
            padding-top: 0 !important;
            margin-top: 0 !important;
            overflow: hidden !important;
          }
          /* Eliminar paddings del título y su contenedor */
          .print-wrapper > div:first-child,
          .print-wrapper h1, 
          .print-wrapper h2 {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          .print-grid {
            flex-grow: 1 !important; 
            height: 100% !important;
            display: grid !important;
            grid-auto-rows: minmax(0, 1fr) !important; 
          }
          ::-webkit-scrollbar { display: none; }
        }
      `}} />

      <div id="print-calendar-container" className="w-full flex-1 min-h-0 flex flex-col relative z-10 print-wrapper">
        {/* Header Superior: Año y Controles */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-2 pt-1 mb-1 gap-3 print:p-0 print:m-0">
          <div className="flex items-center gap-4">
            {onToggleSidebar && (
              <button 
                onClick={onToggleSidebar}
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600 print:hidden"
                title="Abrir Panel de Control"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-2xl font-black text-[#00205B] tracking-tight">
              <span className="print:hidden">{year}</span>
              <span className="hidden print:inline">{monthNames[month]} {year}</span>
            </h2>
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm print:hidden">
              <span className="font-bold text-[#00205B]">{eventsInMonth.length} Eventos</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 print:hidden">
            <button onClick={() => window.print()} className="px-4 py-2.5 bg-[#FE5000] text-white rounded-xl text-xs font-bold hover:bg-[#E04700] transition-colors shadow-sm flex items-center gap-2 mr-2">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
              <button onClick={handlePrevMonth} className="p-1.5 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#00205B] transition-colors">
                Hoy
              </button>
              <button onClick={handleNextMonth} className="p-1.5 text-slate-500 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Meses Premium Simétrica */}
        <div className="flex w-full bg-white rounded-t-2xl shadow-sm border border-slate-200 print:hidden mb-2 overflow-hidden divide-x divide-slate-100">
          {monthNames.map((mName, idx) => (
            <button
              key={mName}
              onClick={() => handleSetMonth(idx)}
              className={`flex-1 text-center py-2 px-1 text-[11px] lg:text-xs font-semibold tracking-wide uppercase transition-all border-b-4 ${
                month === idx 
                  ? 'border-[#FE5000] text-[#00205B] bg-slate-50 shadow-inner' 
                  : 'border-transparent text-slate-500 hover:text-[#00205B] hover:bg-slate-50'
              }`}
            >
              <span className="block truncate w-full">{mName}</span>
            </button>
          ))}
        </div>

        {/* Cabecera de los Días */}
        <div className="grid grid-cols-7 shrink-0 mb-1 print:mb-0.5">
          {dayNames.map(day => (
            <div key={day} className="py-1 text-center text-xs font-bold tracking-wider text-slate-400 uppercase">
              {day}
            </div>
          ))}
        </div>
        
        {/* Unified Canvas Grid */}
        <div id="print-calendar-grid" className="print-grid grid grid-cols-7 auto-rows-fr gap-[1px] bg-slate-200 border border-slate-200 rounded-b-2xl shadow-md flex-1 min-h-0 overflow-hidden print:h-[calc(100vh-80px)] print:grid-rows-[repeat(auto-fit,minmax(0,1fr))] print:overflow-hidden print:border-none print:bg-transparent print:gap-0">
          {/* Blanks */}
          {blanks.map(blank => (
            <div key={`blank-${blank}`} className="bg-slate-50/50 h-full min-h-0 print:hidden"></div>
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
                className={`bg-white h-full min-h-0 p-2 print:p-1 flex flex-col group transition-colors hover:bg-slate-50 cursor-pointer overflow-hidden print:min-h-0 print:h-auto print:overflow-hidden print:border print:border-slate-300`}
              >
                <div className="flex justify-between items-center mb-1.5 px-1 shrink-0 print:mb-0.5">
                  <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-[#FE5000] text-white shadow-sm' : 'text-slate-700 group-hover:bg-slate-200'}`}>
                    {day}
                  </span>
                  <span className="text-[10px] text-[#FE5000] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 print:hidden">
                    <Calendar className="w-3 h-3" />
                  </span>
                </div>
                <div className="flex-1 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent pr-0.5 print:space-y-0.5 print:overflow-hidden flex flex-col">
                  {dayEvents.map(event => {
                    const style = getEventStyle(event.type);
                    return (
                      <button 
                        key={`${event.id}-${day}`} 
                        onClick={(e) => { e.stopPropagation(); openModal('menu', false, event.id); }}
                        className={`w-full text-left px-2.5 py-1 print:py-1 print:px-2 rounded-md transition-all hover:brightness-95 cursor-pointer flex flex-row items-center gap-1.5 ${style.bg} shrink-0`}
                        title={`${event.type} - ${event.eventName}`}
                      >
                        <div className={`flex items-center gap-1.5 font-semibold text-[13px] leading-tight ${style.text} w-full print:text-[10px] print:truncate print:whitespace-nowrap`}>
                          <div className="shrink-0 scale-90 print:hidden">{style.icon}</div>
                          <span className="truncate print:truncate print:whitespace-nowrap">{event.eventName}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            );
          })}
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
