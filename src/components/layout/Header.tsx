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

    <header className="h-28 bg-[#00205B] text-white fixed top-0 left-0 right-0 z-50 shadow-md w-full border-b-4 border-[#FE5000]">
      <div className="flex items-center justify-start gap-2 lg:gap-4 flex-nowrap px-6 md:px-10 w-full max-w-[1920px] mx-auto h-full">
      
      {/* Izquierda: Logo y Menú */}
      <div className="flex items-center flex-nowrap shrink-0 lg:gap-8">

      {/* Logotipo / Título - Izquierda */}
      <Link href="/rutas" onClick={(e) => handleNavClick(e, '/rutas')} className="flex items-center gap-6 shrink-0 ml-4 lg:ml-6 mr-4 lg:mr-8 hover:opacity-90 transition-opacity">
        <div className="relative flex items-center justify-end w-28 md:w-36 h-16 md:h-20 flex-shrink-0">
          <img src="/unidad movil.png" alt="Unidad Móvil BNC" className="w-[120%] h-[120%] max-w-none object-contain drop-shadow-[0_8px_15px_rgba(0,0,0,0.6)]" />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-xl md:text-[30px] font-black tracking-tighter text-white font-[family-name:var(--font-montserrat)] uppercase leading-none drop-shadow-sm whitespace-nowrap mt-2">
            Agenda Móvil
          </h1>
        </div>
      </Link>

      {/* Navegación */}
      <nav id="header-nav" className="hidden lg:flex flex-wrap lg:flex-nowrap items-center justify-center gap-1 xl:gap-2 shrink min-w-0">
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
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold transition-all ${
                  isActive
                    ? shouldHighlightLive ? 'bg-red-500/20 text-white shadow-inner border-b-2 border-red-500' : 'bg-white/15 text-white shadow-inner border-b-2 border-[#FE5000]'
                    : shouldHighlightLive 
                      ? 'bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-white border-b-2 border-transparent hover:border-red-400'
                      : 'bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white border-b-2 border-transparent hover:border-white/20'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${shouldHighlightLive && !isActive ? 'text-red-400' : ''}`} />
                  {shouldHighlightLive && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 m-auto bg-red-500"></span>
                    </span>
                  )}
                </div>
                <span>{group.name}</span>
              </Link>
            );
          }

          const hasPending = false && group.name === 'Auditoría y Reportes' && pendingRentabilityCount > 0; // Deshabilitado temporalmente por UX

          return (
            <div key={group.name} className="relative group">
              <button
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/15 text-white shadow-inner border-b-2 border-[#FE5000]'
                    : 'bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white border-b-2 border-transparent hover:border-white/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{group.name}</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-70 group-hover:opacity-100 transition-transform group-hover:translate-y-0.5" />
                {hasPending && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FE5000] text-[9px] font-bold text-white shadow-md">
                    !
                  </span>
                )}
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-56 flex flex-col">
                  {group.items.map((item) => {
                    const isSubActive = pathname === item.href;
                    const showBadge = false && item.name === 'Seg. de Efectividad Operativa' && pendingRentabilityCount > 0; // Deshabilitado temporalmente por UX
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className={`relative px-4 py-3 text-[13px] font-bold uppercase flex items-center justify-between transition-colors border-l-4 ${
                          isSubActive ? 'text-[#FE5000] bg-orange-50/50 border-[#FE5000]' : 'text-gray-600 border-transparent hover:text-[#FE5000] hover:bg-orange-50 hover:border-[#FE5000]'
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

      {/* Perfil y Notificaciones - Derecha (Ahora ubicado junto a la navegación) */}
      <div id="header-user-menu" className="flex items-center ml-2 lg:ml-6 shrink-0">
        <div className="relative group flex items-center pl-4 lg:pl-6 border-l border-white/20">
          <button className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all focus:outline-none">
            <UserCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
          
          {/* Menú Desplegable de Usuario */}
          <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-64 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 mb-1">
                <p className="text-[13px] font-bold text-[#00205B] truncate">{user?.email || 'Usuario'}</p>
                <div className="flex items-center mt-1">
                  <span className="text-[10px] font-bold text-[#FE5000] bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {isAdmin ? 'Administrador' : 'Usuario Activo'}
                  </span>
                </div>
              </div>
              <button 
                onClick={signOut}
                className="mx-2 px-3 py-2.5 flex items-center gap-2.5 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors group/logout"
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
