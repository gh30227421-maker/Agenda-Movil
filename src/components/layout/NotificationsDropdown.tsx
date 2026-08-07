"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, AlertCircle, TrendingUp, Check, X, DollarSign } from 'lucide-react';
import { useAgenda } from '@/context/AgendaContext';
import { useRentability } from '@/context/RentabilityContext';
import { isPast, isSameMonth } from 'date-fns';

interface Notification {
  id: string;
  type: 'agenda' | 'alert' | 'expense';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { events } = useAgenda();
  const { trackings } = useRentability();

  // Generar notificaciones dinámicas basadas en los eventos y rentabilidad
  useEffect(() => {
    if (!events.length) return;
    
    const newNotifs: Notification[] = [];
    const today = new Date();
    
    events.forEach(ev => {
      // Eventos Planificados próximos
      if (ev.status === 'Planificado' && ev.startDate) {
        const evDate = new Date(ev.startDate);
        const diffDays = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          newNotifs.push({
            id: `notif-agenda-${ev.id}`,
            type: 'agenda',
            title: 'Próximo Operativo',
            message: `${ev.eventName} comienza en ${diffDays} día(s).`,
            date: new Date().toISOString(),
            read: false
          });
        }
      }

      // Eventos en proceso pendientes de cierre
      if (ev.status === 'En Proceso') {
         newNotifs.push({
            id: `notif-alert-${ev.id}`,
            type: 'alert',
            title: 'Jornada Activa',
            message: `Faltan datos de cifras o cierre en ${ev.eventName}.`,
            date: new Date().toISOString(),
            read: false
         });
      }

      // Gastos altos
      if (ev.gastos && ev.gastos.totalUsd > 200) {
         newNotifs.push({
            id: `notif-expense-${ev.id}`,
            type: 'expense',
            title: 'Alerta de Gastos',
            message: `${ev.eventName} registra gastos de $${ev.gastos.totalUsd}.`,
            date: new Date().toISOString(),
            read: false
         });
      }
    });

    // Añadir notificaciones de rentabilidad pendiente
    trackings.forEach(t => {
      if (t.status === 'Pendiente') {
        const cellDate = new Date(t.monthDate);
        if (isPast(cellDate) && !isSameMonth(cellDate, new Date())) {
          const ev = events.find(e => e.id === t.eventId);
          newNotifs.push({
            id: `notif-rent-${t.id}`,
            type: 'expense',
            title: 'Rentabilidad Pendiente',
            message: `Registra el Mes ${t.monthIndex} del operativo ${ev?.eventName || 'desconocido'}.`,
            date: new Date().toISOString(),
            read: false
          });
        }
      }
    });

    // Añadir algunas notificaciones del sistema
    newNotifs.push({
      id: 'sys-1',
      type: 'alert',
      title: 'Cierre de Mes',
      message: 'Recuerda consolidar los gastos operativos de esta semana.',
      date: new Date().toISOString(),
      read: false
    });

    // Setear notificaciones (máximo 10 para diseño limpio)
    setNotifications(newNotifs.slice(0, 10));
  }, [events, trackings]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleDropdown = () => setIsOpen(!isOpen);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'agenda': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'alert': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'expense': return <TrendingUp className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="relative p-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FE5000]/50"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-[#FE5000] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#00205B] shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-500" />
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-[#00205B] hover:text-[#FE5000] transition-colors flex items-center gap-1 bg-gray-200/50 hover:bg-[#FE5000]/10 px-2 py-1 rounded-md"
              >
                <Check className="w-3 h-3" />
                Marcar leídas
              </button>
            )}
          </div>

          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mb-3 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">No hay notificaciones</p>
                <p className="text-xs text-gray-400">Estás al día con tus avisos.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 flex gap-3 hover:bg-gray-50 transition-colors group relative ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                    {!notif.read && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#FE5000] rounded-r-md shadow-sm"></div>}
                    
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-xs font-bold mb-0.5 ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>{notif.title}</p>
                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight">{notif.message}</p>
                    </div>
                    
                    <button 
                      onClick={() => removeNotification(notif.id)}
                      title="Eliminar notificación"
                      className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
              <button className="text-xs font-bold text-[#00205B] hover:text-[#FE5000] transition-colors px-4 py-1.5 rounded-full hover:bg-[#FE5000]/10 w-full">
                Ver historial de alertas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
