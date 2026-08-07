"use client";

import { Box, Bell, Truck, LayoutDashboard, CalendarRange, Users, BarChart3, Receipt, TrendingUp, UserCircle, LogOut, Settings, Wifi, Building2, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRentability } from '@/context/RentabilityContext';
import { isPast, isSameMonth } from 'date-fns';
import NotificationsDropdown from './NotificationsDropdown';

export default function Header() {
  const pathname = usePathname();
  const { user, isAdmin, signOut } = useAuth();
  const { trackings } = useRentability();

  if (!user) return null;

  const pendingRentabilityCount = trackings.filter(t => {
    if (t.status !== 'Pendiente') return false;
    const cellDate = new Date(t.monthDate);
    return isPast(cellDate) && !isSameMonth(cellDate, new Date());
  }).length;

  const navGroups = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { 
      name: 'Operativa', 
      icon: CalendarRange, 
      items: [
        { name: 'Agenda', href: '/' },
        { name: 'Personal', href: '/personal' },
        { name: 'Activos', href: '/activos' },
      ]
    },
    { 
      name: 'Finanzas & Reportes', 
      icon: TrendingUp, 
      items: [
        { name: 'Cifras', href: '/cifras' },
        { name: 'Gastos', href: '/gastos' },
        { name: 'Cierre de Operativo', href: '/rentabilidad' },
        { name: 'Seg. de Rentabilidad', href: '/seguimiento' },
      ]
    },
  ];

  if (isAdmin) {
    navGroups.push({
      name: 'Administración', 
      icon: Settings, 
      items: [
        { name: 'Usuarios', href: '/admin/users' },
        { name: 'Agencias', href: '/admin/agencies' }
      ]
    });
  }

  return (
    <header className="h-28 bg-[#00205B] text-white flex items-center justify-between px-6 md:px-10 sticky top-0 z-40 shadow-xl w-full border-b-4 border-[#FE5000]">
      
      {/* Logotipo / Título - Izquierda */}
      <div className="flex items-center gap-5">
        <div className="relative flex items-center justify-center w-16 h-16 flex-shrink-0">
          <Wifi className="absolute -top-1 w-8 h-8 text-[#FE5000] animate-pulse drop-shadow-md" />
          <Truck className="absolute bottom-0 w-12 h-12 text-[#FE5000] drop-shadow-md" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-[28px] font-black tracking-tighter text-white font-[family-name:var(--font-montserrat)] uppercase leading-none drop-shadow-sm whitespace-nowrap">
            Agenda Móvil
          </h1>
          <span className="text-[#FE5000] font-bold text-base md:text-lg tracking-[0.2em] uppercase font-[family-name:var(--font-montserrat)] mt-0.5">
            Gestión en Vivo
          </span>
        </div>
      </div>

      {/* Navegación - Centro */}
      <nav className="hidden lg:flex items-center gap-4 xl:gap-6 flex-1 justify-center px-8">
        {navGroups.map((group) => {
          const Icon = group.icon;
          const isActive = group.href === pathname || group.items?.some(i => i.href === pathname);
          
          if (!group.items) {
            return (
              <Link
                key={group.name}
                href={group.href!}
                className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[15px] font-semibold transition-all ${
                  isActive
                    ? 'bg-white/15 text-white shadow-inner border-b-2 border-[#FE5000]'
                    : 'bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white border-b-2 border-transparent hover:border-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{group.name}</span>
              </Link>
            );
          }

          const hasPending = group.name === 'Finanzas & Reportes' && pendingRentabilityCount > 0;

          return (
            <div key={group.name} className="relative group">
              <button
                className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[15px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/15 text-white shadow-inner border-b-2 border-[#FE5000]'
                    : 'bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white border-b-2 border-transparent hover:border-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{group.name}</span>
                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70 group-hover:opacity-100 transition-transform group-hover:translate-y-0.5" />
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
                    const showBadge = item.name === 'Seg. de Rentabilidad' && pendingRentabilityCount > 0;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
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
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Perfil y Notificaciones - Derecha */}
      <div className="flex items-center gap-6">
        <NotificationsDropdown />
        
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-base font-bold truncate max-w-[150px] text-white">{user.email}</span>
            <span className="text-[12px] text-[#FE5000] font-bold uppercase tracking-wider">{isAdmin ? 'Administrador' : 'Usuario Activo'}</span>
          </div>
          <button 
            onClick={signOut}
            className="p-3 ml-2 text-red-300 hover:text-white hover:bg-red-500/20 rounded-full transition-colors flex items-center justify-center group"
            title="Cerrar Sesión"
          >
            <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}
