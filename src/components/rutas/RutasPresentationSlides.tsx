"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Tv, 
  X, 
  PauseCircle, 
  PlayCircle, 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  Users, 
  CreditCard, 
  CalendarRange, 
  BarChart3
} from 'lucide-react';
import { useAgenda } from '@/context/AgendaContext';
import RutasUnidadMovil from '@/components/rutas/RutasUnidadMovil';
import RutasAgenciaMovil from '@/components/rutas/RutasAgenciaMovil';

interface RutasPresentationSlidesProps {
  selectedMonths?: string[];
  isOpen: boolean;
  onClose: () => void;
}

const SLIDE_DURATION = 30; // 30 Segundos por cabina (Rotación ejecutiva en bucle)

export default function RutasPresentationSlides({
  selectedMonths = [],
  isOpen,
  onClose
}: RutasPresentationSlidesProps) {
  const { events } = useAgenda();
  const [mounted, setMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0); // 0: Unidad Móvil, 1: Agencia Móvil
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Solo las 2 Cabinas de Mando Estelares
  const slides = [
    { id: 0, label: 'Unidad Móvil', sub: 'Cabina Operativa Oficial' },
    { id: 1, label: 'Agencia Móvil', sub: 'Despliegues y Red' },
  ];

  // Cálculo de Métricas Globales para la Barra Ejecutiva Superior
  const globals = useMemo(() => {
    let clientesAtendidos = 0;
    let totalTdd = 0;
    let totalOtrasOperaciones = 0;
    let totalOperaciones = 0;
    let totalJornadas = 0;

    events.forEach(e => {
      if (e.type !== 'Agencia Móvil' && e.type !== 'Unidad Móvil' && e.type !== 'Red de Agencias') return;
      if (selectedMonths.length > 0 && (!e.startDate || !selectedMonths.some(m => e.startDate?.startsWith(m)))) return;

      totalJornadas++;
      clientesAtendidos += (e.cifras?.cuentasAbiertas || 0);
      totalTdd += (e.cifras?.tdd || 0);
      totalOtrasOperaciones += (e.cifras?.reclamos || 0);
      totalOperaciones += (e.cifras?.cuentasAbiertas || 0) + (e.cifras?.tdd || 0) + (e.cifras?.reclamos || 0);
    });

    return {
      clientesAtendidos,
      totalTdd,
      totalOtrasOperaciones,
      totalJornadas,
      totalOperaciones
    };
  }, [events, selectedMonths]);

  // Manejo de Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Timer de auto-avance en bucle perpetuo (Loop continuo garantizado)
  useEffect(() => {
    if (!isOpen || isPaused) return;

    setProgress(0);
    const intervalMs = 50;
    const totalMs = SLIDE_DURATION * 1000;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / totalMs) * 100);

      if (elapsed >= totalMs) {
        clearInterval(timer);
        setProgress(0);
        setCurrentSlide(prev => (prev + 1) % slides.length);
      } else {
        setProgress(pct);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, currentSlide, slides.length]);

  // Navegación por teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentSlide(s => (s + 1) % slides.length);
        setProgress(0);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentSlide(s => (s - 1 + slides.length) % slides.length);
        setProgress(0);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slides.length, onClose]);

  // Auto-hide controls
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  useEffect(() => {
    if (!isOpen) return;
    handleUserActivity();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isOpen, currentSlide]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className="fixed inset-0 z-[99999] bg-[#F1F5F9] text-slate-800 flex flex-col overflow-hidden select-none animate-in fade-in duration-300"
    >
      {/* Barra de progreso de auto-avance en bucle */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-200/90 z-[100] overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#FE5000] via-[#FF7A00] to-[#00205B] shadow-[0_0_8px_rgba(254,80,0,0.8)] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header Superior (h-14 / 56px) con Métricas de Impacto Nacional Integradas */}
      <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-50 shadow-xs">
        {/* Marca BNC y Título */}
        <div className="flex items-center gap-3">
          <img src="/bnc-logo.png" alt="BNC" className="h-7 sm:h-8 w-auto object-contain" />
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-black tracking-tight text-[#00205B] uppercase">AGENDA</span>
            <span className="text-xs sm:text-sm font-normal tracking-wider text-slate-500 uppercase">MÓVIL</span>
          </div>
          <span className="hidden md:inline-flex items-center gap-1.5 ml-2 bg-[#FE5000]/10 text-[#FE5000] border border-[#FE5000]/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            <Tv className="w-3 h-3" /> Modo TV
          </span>
        </div>

        {/* Píldoras de Diapositiva / Selector de las 2 Cabinas */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-full border border-slate-200/70 shadow-xs">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                setCurrentSlide(idx);
                setProgress(0);
              }}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                currentSlide === idx 
                  ? 'bg-[#00205B] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${currentSlide === idx ? 'bg-[#FE5000]' : 'bg-slate-400'}`} />
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Micro-Ticker de Impacto Nacional Consolidado en el Header (Mayor tamaño y visibilidad) */}
        <div className="hidden xl:flex items-center gap-3 bg-slate-100/90 py-1.5 px-4 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-1.5 font-black text-[#00205B]">
            <span className="w-2 h-2 rounded-full bg-[#FE5000] animate-pulse"></span>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Impacto Nacional:</span>
          </div>
          <div className="flex items-center gap-3.5 divide-x divide-slate-200 text-xs sm:text-[13px] font-black">
            <span className="text-[#00205B] pl-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#FE5000]" /> {globals.clientesAtendidos.toLocaleString('es-VE')} <span className="text-slate-500 font-medium text-[11px]">Atendidos</span>
            </span>
            <span className="text-[#00205B] pl-3 flex items-center gap-1.5">
              <CalendarRange className="w-3.5 h-3.5 text-emerald-600" /> {globals.totalJornadas.toLocaleString('es-VE')} <span className="text-slate-500 font-medium text-[11px]">Jornadas</span>
            </span>
            <span className="text-[#00205B] pl-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" /> {globals.totalOperaciones.toLocaleString('es-VE')} <span className="text-slate-500 font-medium text-[11px]">Operaciones</span>
            </span>
            <span className="text-[#00205B] pl-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> {globals.totalTdd.toLocaleString('es-VE')} <span className="text-slate-500 font-medium text-[11px]">TDDs</span>
            </span>
          </div>
        </div>

        {/* Acciones Rápidas Derecha */}
        <div className="flex items-center gap-2">
          {/* Badge en vivo */}
          <div className="hidden lg:flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200/70 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title={isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1 bg-[#FE5000] hover:bg-[#E04700] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs transition-colors"
            title="Salir del Modo Presentación (Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SALIR</span>
          </button>
        </div>
      </header>

      {/* Área Central de Diapositiva (Permite scroll vertical suave en cualquier pantalla) */}
      <main tabIndex={0} className="flex-1 min-h-0 w-full relative overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-5 flex flex-col justify-start max-w-[1920px] mx-auto custom-scrollbar focus:outline-none">
        
        {/* SLIDE 0: Cabina de Mando Unidad Móvil */}
        {currentSlide === 0 && (
          <div className="w-full flex flex-col justify-start pb-16 animate-in fade-in duration-500">
            <RutasUnidadMovil selectedMonths={selectedMonths} isPresentation={true} />
          </div>
        )}

        {/* SLIDE 1: Cabina de Mando Agencia Móvil */}
        {currentSlide === 1 && (
          <div className="w-full flex flex-col justify-start pb-16 animate-in fade-in duration-500">
            <RutasAgenciaMovil selectedMonths={selectedMonths} isPresentation={true} />
          </div>
        )}

      </main>

      {/* Barra Flotante de Control (Media Player) con Auto-Hide */}
      <div 
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-full px-5 py-2 shadow-2xl transition-all duration-500 ${
          showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <button
          onClick={() => {
            setCurrentSlide(s => (s - 1 + slides.length) % slides.length);
            setProgress(0);
          }}
          className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          title="Diapositiva Anterior (Flecha Izquierda)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsPaused(p => !p)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            isPaused 
              ? 'bg-[#FE5000] text-white shadow-sm' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={isPaused ? 'Reanudar Rotación' : 'Pausar Rotación'}
        >
          {isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
          <span>{isPaused ? 'REANUDAR' : 'PAUSAR'}</span>
        </button>

        <button
          onClick={() => {
            setCurrentSlide(s => (s + 1) % slides.length);
            setProgress(0);
          }}
          className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          title="Diapositiva Siguiente (Flecha Derecha)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <span className="text-white/60 text-xs font-bold tracking-wider">
          {currentSlide + 1} / {slides.length}
        </span>
      </div>

    </div>,
    document.body
  );
}
