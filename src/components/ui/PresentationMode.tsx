"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Tv, X, PauseCircle, Activity } from 'lucide-react';

export default function PresentationMode() {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls logic
  useEffect(() => {
    if (!isActive) return;
    
    let hideTimeout: NodeJS.Timeout;
    
    const handleActivity = () => {
      if (controlsRef.current) {
        controlsRef.current.style.opacity = '1';
        controlsRef.current.style.transform = 'translate(-50%, 0)';
        controlsRef.current.style.pointerEvents = 'auto';
      }
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        if (controlsRef.current) {
          controlsRef.current.style.opacity = '0';
          controlsRef.current.style.transform = 'translate(-50%, 10px)';
          controlsRef.current.style.pointerEvents = 'none';
        }
      }, 3000);
    };

    handleActivity();
    
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('click', handleActivity);

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('click', handleActivity);
      clearTimeout(hideTimeout);
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      document.body.classList.add('presentation-mode-active');
      
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
      } catch (e) {
        console.error("Fullscreen API not supported or blocked.", e);
      }

      // Auto-scroll logic (State-Driven Scrolling)
      let scrollInterval: NodeJS.Timeout;
      let resetTimeout: NodeJS.Timeout;
      let isResetting = false; // Máquina de estados: false = bajando, true = pausado arriba

      const startScrolling = () => {
        scrollInterval = setInterval(() => {
          if (isPausedRef.current || isResetting) return;
          
          let container: Element | Window = window;
          const overflowContainers = Array.from(document.querySelectorAll('.overflow-y-auto, .overflow-y-scroll, main'));
          for (const el of overflowContainers) {
            if (el.scrollHeight > el.clientHeight) {
              container = el;
              break;
            }
          }

          const scrollTop = container === window ? window.scrollY : (container as Element).scrollTop;
          const scrollHeight = container === window ? document.documentElement.scrollHeight : (container as Element).scrollHeight;
          const clientHeight = container === window ? window.innerHeight : (container as Element).clientHeight;

          // Update progress bar
          if (progressBarRef.current) {
            const maxScroll = scrollHeight - clientHeight;
            const currentProgress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
            progressBarRef.current.style.width = `${currentProgress}%`;
          }

          const maxScroll = scrollHeight - clientHeight;
          
          // Evaluar si llegó al fondo (tolerancia de 20px)
          if (scrollTop >= maxScroll - 20) {
            // Cambiar estado a 'up' / 'resetting'
            isResetting = true;
            
            // Salto inmediato a cero
            if (container === window) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              (container as Element).scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Pausa de 2 segundos en el tope antes de reanudar la bajada
            resetTimeout = setTimeout(() => {
              isResetting = false;
            }, 2000);
          } else {
            // Seguir bajando
            if (container === window) {
              window.scrollBy({ top: 1, left: 0, behavior: 'auto' });
            } else {
              (container as Element).scrollBy({ top: 1, left: 0, behavior: 'auto' });
            }
          }
        }, 30);
      };

      // Start scrolling after a brief pause
      const initialPause = setTimeout(startScrolling, 3000);

      return () => {
        document.body.classList.remove('presentation-mode-active');
        clearInterval(scrollInterval);
        clearTimeout(initialPause);
        clearTimeout(resetTimeout);
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen();
          }
        } catch (e) {}
      };
    }
  }, [isActive]);

  return (
    <>
      {/* Estilos globales inyectados dinámicamente cuando el modo está activo */}
      {isActive && (
        <style dangerouslySetInnerHTML={{__html: `
          body.presentation-mode-active #header-nav,
          body.presentation-mode-active #header-user-menu {
            display: none !important;
          }
          body.presentation-mode-active aside {
            display: none !important;
          }
          body.presentation-mode-active main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          body.presentation-mode-active .presentation-toggle {
            opacity: 0.1;
          }
          body.presentation-mode-active .presentation-toggle:hover {
            opacity: 1;
          }
        `}} />
      )}

      {isActive && (
        <>
          {/* Progress Bar (Timeline Superior) */}
          <div className="fixed top-28 left-0 w-full h-1 bg-slate-200 z-[100]">
            <div 
              ref={progressBarRef}
              className="h-full bg-[#FE5000] transition-all duration-75 ease-linear"
              style={{ width: '0%' }}
            />
          </div>

          {/* Indicador visual Live - Posicionado en el Header global usando Portals o clases (Acoplado arriba, ocultado de abajo) */}
          <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] bg-slate-900/80 backdrop-blur-md rounded-full px-6 py-2 shadow-xl flex items-center gap-3 border border-slate-700">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className="text-sm font-bold text-white tracking-wide">
              MODO PRESENTACIÓN EN VIVO
            </span>
          </div>

          {/* Controles de Presentación (Media Player Flotante) */}
          <div 
            ref={controlsRef}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full px-6 py-2.5 shadow-2xl transition-all duration-700 ease-out"
            style={{ opacity: 1, pointerEvents: 'auto' }}
          >
            
            {/* Indicador Visual En Vivo */}
            {!isPaused && (
              <div className="flex items-center gap-2 pr-4 border-r border-slate-700/50">
                <div className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
                <span className="text-white text-[10px] font-bold uppercase tracking-widest drop-shadow-md hidden md:inline-block">
                  En Vivo
                </span>
              </div>
            )}

            <button
              onClick={() => {
                const newState = !isPaused;
                setIsPaused(newState);
                isPausedRef.current = newState;
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 font-bold text-sm ${
                isPaused 
                  ? 'bg-orange-500/90 text-white hover:bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title="Pausar / Reanudar Presentación"
            >
              {isPaused ? <Tv className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
              <span className="hidden md:inline-block tracking-wide">
                {isPaused ? 'REANUDAR' : 'PAUSAR'}
              </span>
            </button>

            <button
              onClick={() => {
                setIsActive(false);
                setIsPaused(false);
                isPausedRef.current = false;
              }}
              className="flex items-center gap-2 bg-[#FE5000]/90 text-white px-4 py-2 rounded-full hover:bg-[#FE5000] transition-all duration-500 font-bold text-sm shadow-[0_0_15px_rgba(254,80,0,0.3)]"
              title="Salir del Modo TV"
            >
              <X className="w-5 h-5" />
              <span className="hidden md:inline-block tracking-wide">
                SALIR
              </span>
            </button>
          </div>
        </>
      )}

      {/* Botón para ACTIVAR el Modo TV (Solo visible cuando NO está activo) */}
      {!isActive && (
        <button
          onClick={() => setIsActive(true)}
          className="presentation-toggle fixed bottom-6 right-6 z-[100] flex items-center gap-2 bg-[#00205B] text-white px-4 py-2.5 rounded-full shadow-2xl hover:bg-[#FE5000] transition-all duration-500 font-bold text-sm group border border-white/20"
          title="Modo Presentación 📺"
        >
          <Tv className="w-5 h-5" />
          <span className="hidden md:inline-block tracking-wide">
            MODO TV
          </span>
        </button>
      )}
    </>
  );
}
