"use client";

import { Box, Bell, Truck, LayoutDashboard, CalendarRange, Users, BarChart3, Receipt, TrendingUp, UserCircle, LogOut, Settings, Wifi, Building2, ChevronDown, MapPinned, Activity } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRentability } from '@/context/RentabilityContext';
import { isPast, isSameMonth } from 'date-fns';
import NotificationsDropdown from './NotificationsDropdown';
import PWAInstallButton from './PWAInstallButton';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, signOut } = useAuth();
  const { trackings } = useRentability();
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (pathname === href) return;
    e.preventDefault();
    setIsNavigating(true);
    setTimeout(() => {
      router.push(href);
      setIsNavigating(false);
    }, 1000); // 1 segundo de animación
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchLiveConfig = async () => {
      const { data } = await supabase.from('live_config').select('active_event_id').eq('id', 1).maybeSingle();
      setIsLiveActive(!!data?.active_event_id);
    };
    
    fetchLiveConfig();
    
    const channel = supabase.channel('header_live_config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_config' }, (payload: any) => {
        if (payload.new && payload.new.id === 1) {
          setIsLiveActive(!!payload.new.active_event_id);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  const pendingRentabilityCount = trackings.filter(t => {
    if (t.status !== 'Pendiente') return false;
    const cellDate = new Date(t.monthDate);
    return isPast(cellDate) && !isSameMonth(cellDate, new Date());
  }).length;

  const navGroups: any[] = [
    { name: 'Rutas y Despliegues', icon: MapPinned, href: '/rutas' },
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  ];

  if (isAdmin) {
    navGroups.push({ 
      name: 'Gestión Operativa', 
      icon: CalendarRange, 
      items: [
        { name: 'Agenda', href: '/agenda' },
        { name: 'Personal', href: '/personal' },
        { name: 'Activos', href: '/activos' },
      ]
    });
    navGroups.push({ 
      name: 'Auditoría y Reportes', 
      icon: TrendingUp, 
      items: [
        { name: 'Cifras', href: '/cifras' },
        { name: 'Gastos', href: '/gastos' },
        { name: 'Cierre de Operativo', href: '/rentabilidad' },
        { name: 'Seg. de Efectividad Operativa', href: '/seguimiento' },
      ]
    });
    navGroups.push({
      name: 'Administración', 
      icon: Settings, 
      items: [
        { name: 'Usuarios', href: '/admin/users' },
        { name: 'Agencias', href: '/admin/agencies' },
        { name: 'Galería de Eventos', href: '/admin/photos' },
        { name: 'Gestión en Vivo', href: '/admin/gestion-en-vivo' }
      ]
    });
  } else {
    // Usuario regular: Solo acceso a la Agenda en Gestión Operativa
    navGroups.push({ 
      name: 'Gestión Operativa', 
      icon: CalendarRange, 
      items: [
        { name: 'Agenda', href: '/agenda' }
      ]
    });
  }

  // Agregamos Gestión en Vivo al final
  navGroups.push({ name: 'Gestión en Vivo', icon: Activity, href: '/gestion-en-vivo' });

  return (
    <>
      {/* Pantalla de Transición Global */}
      {isNavigating && (
        <div className="fixed inset-0 z-[99999] backdrop-blur-md bg-black/40 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center w-48 h-48 mb-8">
            {/* Anillo de carga animado (Spinner) */}
            <div className="absolute inset-0 border-4 border-[#FE5000]/20 border-t-[#FE5000] rounded-full animate-[spin_2s_linear_infinite]" />
            <div className="absolute inset-4 border-4 border-[#009639]/20 border-b-[#009639] rounded-full animate-[spin_3s_linear_infinite_reverse]" />
            
            <img src="/unidad movil.png" alt="Cargando..." className="w-32 h-32 object-contain drop-shadow-2xl animate-pulse relative z-10" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-2 font-[family-name:var(--font-montserrat)] drop-shadow-md">
            Agenda Móvil
          </h2>
          <p className="text-gray-200 text-sm font-medium">Cargando módulo, por favor espere...</p>
        </div>
      )}

    <header className="h-16 lg:h-[68px] bg-white/95 backdrop-blur-md text-slate-800 fixed top-0 left-0 right-0 z-50 shadow-[0_4px_25px_-4px_rgba(0,32,91,0.08)] w-full border-b-2 border-[#FE5000]">
      <div className="flex items-center justify-between gap-3 lg:gap-6 flex-nowrap px-4 sm:px-6 lg:px-8 xl:px-10 w-full max-w-[1920px] mx-auto h-full">
      
      {/* Izquierda: Logo y Menú */}
      <div className="flex items-center flex-nowrap shrink-0 gap-4 lg:gap-6">

      {/* Logotipo / Título - Izquierda */}
      <Link href="/rutas" onClick={(e) => handleNavClick(e, '/rutas')} className="flex items-center gap-2.5 sm:gap-3 shrink-0 hover:opacity-90 transition-opacity group">
        <img 
          src="/bnc-logo.png" 
          alt="BNC" 
          className="h-8 sm:h-9 w-auto object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="h-6 sm:h-7 w-[1.5px] bg-slate-200" />
        <div className="flex items-center gap-1.5">
          <span className="text-base sm:text-lg font-black tracking-tight text-[#00205B] uppercase leading-none font-[family-name:var(--font-montserrat)]">
            AGENDA
          </span>
          <span className="text-base sm:text-lg font-normal tracking-wider text-slate-500 uppercase leading-none font-[family-name:var(--font-montserrat)]">
            MÓVIL
          </span>
        </div>
      </Link>

      {/* Navegación */}
      <nav id="header-nav" className="hidden lg:flex items-center justify-center gap-1 xl:gap-1.5 shrink min-w-0">
        {navGroups.map((group) => {
          const Icon = group.icon;
          const isActive = group.href === pathname || group.items?.some(i => i.href === pathname);
          
          if (!group.items) {
            const isLive = group.name === 'Gestión en Vivo';
            // Solo resaltamos si isLive y ademas hay un evento activo (isLiveActive)
            const shouldHighlightLive = isLive && isLiveActive;

            return (
              <Link
                key={group.name}
                href={group.href!}
                onClick={(e) => handleNavClick(e, group.href!)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs xl:text-[13px] font-bold transition-all ${
                  isActive
                    ? shouldHighlightLive 
                      ? 'bg-red-600 text-white shadow-xs' 
                      : 'bg-[#00205B] text-white shadow-xs'
                    : shouldHighlightLive 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                      : 'text-slate-600 hover:text-[#00205B] hover:bg-slate-100/80'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${shouldHighlightLive && !isActive ? 'text-red-600' : ''}`} />
                  {shouldHighlightLive && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 m-auto bg-red-600"></span>
                    </span>
                  )}
                </div>
                <span>{group.name}</span>
              </Link>
            );
          }

          const hasPending = false && group.name === 'Auditoría y Reportes' && pendingRentabilityCount > 0;

          return (
            <div key={group.name} className="relative group">
              <button
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs xl:text-[13px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00205B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#00205B] hover:bg-slate-100/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{group.name}</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-60 group-hover:opacity-100 transition-transform group-hover:translate-y-0.5" />
                {hasPending && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FE5000] text-[9px] font-bold text-white shadow-md">
                    !
                  </span>
                )}
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 w-60 flex flex-col text-slate-800">
                  {group.items.map((item) => {
                    const isSubActive = pathname === item.href;
                    const showBadge = false && item.name === 'Seg. de Efectividad Operativa' && pendingRentabilityCount > 0;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className={`relative px-4 py-2.5 text-xs xl:text-[13px] font-bold uppercase flex items-center justify-between transition-colors border-l-4 ${
                          isSubActive 
                            ? 'text-[#FE5000] bg-orange-50/70 border-[#FE5000]' 
                            : 'text-slate-600 border-transparent hover:text-[#00205B] hover:bg-slate-50 hover:border-[#00205B]'
                        }`}
                      >
                        <span>{item.name}</span>
                        {showBadge && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FE5000] text-[10px] font-bold text-white shadow-sm">
                            {pendingRentabilityCount > 9 ? '9+' : pendingRentabilityCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                  {group.name === 'Administración' && <PWAInstallButton />}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
      </div>

      {/* Perfil y Notificaciones - Derecha */}
      <div id="header-user-menu" className="flex items-center ml-2 lg:ml-6 shrink-0">
        <div className="relative group flex items-center pl-4 lg:pl-6 border-l border-slate-200">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all focus:outline-none cursor-pointer text-[#00205B]">
            <UserCircle className="w-5 h-5 text-[#00205B]" />
          </button>
          
          {/* Menú Desplegable de Usuario */}
          <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 w-64 flex flex-col text-slate-800">
              <div className="px-4 py-3 border-b border-slate-100 mb-1">
                <p className="text-[13px] font-bold text-[#00205B] truncate">{user?.email || 'Usuario'}</p>
                <div className="flex items-center mt-1">
                  <span className="text-[10px] font-bold text-[#FE5000] bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {isAdmin ? 'Administrador' : 'Usuario Activo'}
                  </span>
                </div>
              </div>
              <button 
                onClick={signOut}
                className="mx-2 px-3 py-2.5 flex items-center gap-2.5 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer group/logout"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4 group-hover/logout:scale-110 transition-transform" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </header>
    </>
  );
}
