"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { MapPin, ChevronDown } from 'lucide-react';

export default function GlobalEventFilter() {
  const { events, globalSelectedEventId, setGlobalSelectedEventId } = useAgenda();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar eventos de móviles
  const mobileEvents = events.filter(e => e.type === 'Agencia Móvil' || e.type === 'Unidad Móvil')
                             .sort((a, b) => new Date(b.startDate || '').getTime() - new Date(a.startDate || '').getTime());

  // Detectar click fuera para cerrar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedEvent = globalSelectedEventId ? mobileEvents.find(e => e.id === globalSelectedEventId) : null;
  const displayText = selectedEvent ? selectedEvent.eventName || selectedEvent.location || selectedEvent.state : 'Todos los Despliegues';

  return (
    <div className="relative z-[100]" ref={dropdownRef}>
      {/* Etiqueta / Trigger Invisible */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#00205B] transition-colors group cursor-pointer"
      >
        <MapPin className="w-3.5 h-3.5 group-hover:text-[#FE5000] transition-colors" />
        <span>Evento Activo:</span>
        <span className="text-[#00205B] ml-1">{displayText}</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover / Menú Flotante */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-100 py-2 origin-top-left animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-64 overflow-y-auto hide-scrollbar">
            <button
              onClick={() => { setGlobalSelectedEventId(null); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${!globalSelectedEventId ? 'bg-slate-50 text-[#FE5000]' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Todos los Despliegues
            </button>
            {mobileEvents.map((ev) => (
              <button
                key={ev.id}
                onClick={() => { setGlobalSelectedEventId(ev.id); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors truncate ${globalSelectedEventId === ev.id ? 'bg-slate-50 text-[#FE5000]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {ev.eventName || ev.location || ev.state}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
