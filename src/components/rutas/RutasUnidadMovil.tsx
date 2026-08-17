"use client";

import React, { useState, useMemo, useEffect } from 'react';
import PremiumCarousel from './PremiumCarousel';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { supabase } from '@/lib/supabase';
import { useAgenda } from '@/context/AgendaContext';
import { Loader2, Users, MapPin, Truck, Activity, Calendar, Navigation, Camera } from 'lucide-react';
// @ts-ignore
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';

// Diccionario de coordenadas para trazar la ruta nacional
const STATE_COORDS: Record<string, [number, number]> = {
  'distrito capital': [-66.9167, 10.5], 'miranda': [-66.5, 10.25], 'la guaira': [-66.9333, 10.6], 'vargas': [-66.9333, 10.6], 
  'carabobo': [-68.0, 10.1667], 'lara': [-69.3333, 10.0667], 'falcon': [-69.6667, 11.4167], 'yaracuy': [-68.7333, 10.3333], 
  'portuguesa': [-69.25, 9.1667], 'cojedes': [-68.3, 9.6333], 'aragua': [-67.6, 10.25], 'guarico': [-66.9167, 8.9167], 
  'apure': [-68.4167, 7.8833], 'zulia': [-71.6333, 10.6333], 'tachira': [-72.2333, 7.7667], 'merida': [-71.1333, 8.6], 
  'trujillo': [-70.4333, 9.3667], 'barinas': [-70.2, 8.6333], 'anzoategui': [-64.6167, 9.1667], 'monagas': [-63.1833, 9.75], 
  'sucre': [-63.1833, 10.45], 'nueva esparta': [-63.9167, 11.0333], 'delta amacuro': [-61.9167, 8.6333], 'bolivar': [-63.55, 7.1333], 
  'amazonas': [-65.5833, 3.1667]
};

const normalizeStateName = (name: string) => {
  if (!name) return '';
  const normalized = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace('estado ', '')
    .trim();
  if (normalized === 'capital' || normalized === 'distrito capital') return 'distrito capital';
  if (normalized === 'la guaira' || normalized === 'vargas') return 'la guaira';
  return normalized;
};

const geoUrl = '/venezuela.json';

export default function RutasUnidadMovil() {
  const { events: allEvents, isLoading: isEventsLoading } = useAgenda();
  const events = useMemo(() => allEvents.filter(e => e.type === 'Unidad Móvil'), [allEvents]);
  
  const [photos, setPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoadingPhotos(true);
        const eventIds = events.map((e: any) => e.id);
        if (eventIds.length > 0) {
          const { data: photosData, error: photosError } = await supabase
            .from('event_photos')
            .select('*')
            .in('event_id', eventIds)
            .order('created_at', { ascending: false });
          
          if (!photosError) {
            setPhotos(photosData || []);
          }
        }
      } catch (error) {
        console.error('Error fetching photos for RutasUnidadMovil', error);
      } finally {
        setLoadingPhotos(false);
      }
    };
    if (!isEventsLoading) {
      fetchPhotos();
    }
  }, [events, isEventsLoading]);

  const kpis = useMemo(() => {
    let totalCuentas = 0;
    const statesSet = new Set<string>();
    
    events.forEach(ev => {
      if (ev.cifras?.cuentasAbiertas) {
        totalCuentas += ev.cifras.cuentasAbiertas;
      }
      const logisticState = ev.estadoOperativo || ev.state;
      if (logisticState) {
        statesSet.add(logisticState);
      }
    });

    return {
      beneficiados: totalCuentas, 
      eventos: events.length,
      estados: statesSet.size
    };
  }, [events]);

  const nextEvent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const future = events.filter(e => new Date(e.startDate || 0) >= today).sort((a, b) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime());
    return future.length > 0 ? future[0] : null;
  }, [events]);

  // Cálculos para la ruta
  const routeCoordinates = useMemo(() => {
    const sorted = [...events]
      .filter(e => (e.estadoOperativo || e.state) && STATE_COORDS[normalizeStateName(e.estadoOperativo || e.state)])
      .sort((a, b) => new Date(a.startDate || '').getTime() - new Date(b.startDate || '').getTime());
    
    const coords: [number, number][] = [];
    const seen = new Set();
    sorted.forEach(e => {
      const norm = normalizeStateName(e.estadoOperativo || e.state);
      if (!seen.has(norm)) {
        seen.add(norm);
        coords.push(STATE_COORDS[norm]);
      }
    });
    return coords;
  }, [events]);

  if (isEventsLoading || loadingPhotos) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-12 h-12 text-[#FE5000] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-1000 w-full px-4 md:px-8">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dashFlow {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash-flow {
          animation: dashFlow 1s linear infinite;
        }
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .animate-ken-burns {
          animation: kenBurns 20s ease-in-out infinite alternate;
        }
      `}} />


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-[95%] 2xl:max-w-screen-2xl mx-auto items-start">
        
        {/* Columna Izquierda: Narrativa y Contexto Visual (30%) */}
        <div className="flex flex-col lg:col-span-4 relative z-20 w-full gap-4">
          
          {/* Texto Informativo */}
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Llevamos la <strong className="font-bold text-slate-900">solidez del banco</strong> a cada rincón del país. A través de nuestras agencias móviles, garantizamos <strong className="font-bold text-slate-900">atención financiera inmediata</strong>, conectando comunidades y descentralizando nuestros servicios con <strong className="font-bold text-[#FE5000]">tecnología de vanguardia</strong> en tiempo real.
          </p>

          {/* Micro-Tarjeta Próximo Destino (Real de BD) */}
          {nextEvent ? (
            <div className="bg-slate-900 rounded-xl p-4 shadow-lg flex flex-col justify-center border border-slate-800 mb-4 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <MapPin className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs tracking-widest uppercase font-bold mb-0.5">Próxima Parada Programada</span>
                  <strong className="text-white text-base md:text-lg font-bold">{nextEvent.eventName || (nextEvent.estadoOperativo || nextEvent.state)} - {new Date(nextEvent.startDate).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs shadow-sm mb-4 flex items-center justify-center text-slate-500 font-medium">
              Sin paradas programadas próximamente
            </div>
          )}

          {/* Foto Institucional (Con Badge en Vivo) */}
          <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl shadow-slate-900/50 border border-white/10 group bg-slate-950/40 relative z-20 mb-4">
            <div className="absolute inset-0 flex items-center justify-center text-white/20">
              <Camera className="w-8 h-8" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={supabase.storage.from('event_photos').getPublicUrl('unidad-oficial-cover.jpg').data.publicUrl}
              alt="Unidad Móvil Oficial"
              className="w-full h-full object-cover relative z-10 animate-ken-burns"
              onError={(e) => {
                e.currentTarget.style.opacity = '0';
              }}
            />
            
            {/* Badge Animado en Vivo */}
            <div className="absolute top-3 right-3 z-30 bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">ESTADO: DESPLEGADA</span>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20">
              <span className="text-white text-xs md:text-sm font-bold uppercase tracking-widest drop-shadow-md flex items-center gap-2">
                <Truck className="w-4 h-4" /> Unidad Móvil Oficial
              </span>
            </div>
          </div>

          {/* Galería Dinámica */}
          <PremiumCarousel photos={photos} />

          {/* Live Timeline Vertical */}
          <div className="flex flex-col backdrop-blur-md bg-white/70 p-4 rounded-xl shadow-xl shadow-slate-200/50 border border-white/60 relative overflow-hidden mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#00205B]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#00205B]">Últimos Despliegues</h3>
              <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100/50 border border-green-200">
                <div className="w-1.5 h-1.5 rounded-full bg-[#009639] animate-pulse" />
                <span className="text-[9px] font-bold text-[#009639] uppercase tracking-wider">Live</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 relative border-l-2 border-slate-200 ml-2 pl-4 mt-2">
              {[...events].sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()).slice(0, 3).map((event, idx) => (
                <div key={event.id || idx} className="relative flex flex-col z-10 pb-2">
                  <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#FE5000] border-2 border-white shadow-sm z-10" />
                  <div className="flex justify-between items-start w-full">
                    <div className="flex flex-col">
                      <p className="text-xs font-bold text-slate-700 leading-tight">{event.eventName || 'Operativo Especial'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> {event.startDate ? new Date(event.startDate).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : 'N/A'}</span>
                        <span className="text-[9px] font-bold text-[#00205B] bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">{event.estadoOperativo || event.state}</span>
                      </div>
                    </div>
                    {((event.cifras?.cuentasAbiertas || 0) + (event.cifras?.atendidos || 0)) > 0 && (
                      <div className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold shrink-0 ml-2 shadow-sm border border-green-100 whitespace-nowrap">
                        👥 {(event.cifras?.cuentasAbiertas || 0) + (event.cifras?.atendidos || 0)} Atendidos
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Columna Derecha: Data y Monitoreo (70%) */}
        <div className="flex flex-col lg:col-span-8 relative w-full h-full">
          
          {/* Fila Única de KPIs */}
          <div className="flex items-center gap-4 mb-4 relative z-20">
            <h3 className="text-sm md:text-base font-bold text-slate-700 uppercase tracking-widest m-0">Indicadores Operativos - Unidad Móvil</h3>
            <div className="flex-grow h-px bg-slate-200"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full relative z-20">
            {/* KPI: Ciudadanos Atendidos */}
            <div className="group flex flex-col backdrop-blur-md bg-white/90 p-4 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 hover:shadow-[0_15px_40px_rgba(254,80,0,0.12)] transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#FE5000] to-[#FF8A50]" />
              <svg className="absolute bottom-0 left-0 w-full h-1/2 object-cover opacity-30 pointer-events-none text-slate-200" viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0,30 Q20,15 50,25 T100,10" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#FE5000]" /> Ciudadanos Atendidos
              </p>
              <div className="flex flex-wrap items-end gap-2 justify-between">
                <p className="text-xl lg:text-2xl font-black text-[#00205B] tracking-tight">
                  <AnimatedCounter end={kpis.beneficiados} />
                </p>
                <span className="text-[10px] font-bold text-[#009639] bg-green-50 px-1.5 py-0.5 rounded-md mb-1">📈 +12%</span>
              </div>
            </div>

            {/* KPI: Puntos de Despliegue */}
            <div className="group flex flex-col backdrop-blur-md bg-white/90 p-4 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 hover:shadow-[0_15px_40px_rgba(0,150,57,0.12)] transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#009639] to-[#00C04B]" />
              <svg className="absolute bottom-0 left-0 w-full h-1/2 object-cover opacity-30 pointer-events-none text-slate-200" viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0,30 Q30,5 60,20 T100,5" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#009639]" /> Jornadas Desplegadas
              </p>
              <div className="flex flex-wrap items-end gap-2 justify-between">
                <p className="text-xl lg:text-2xl font-black text-[#00205B] tracking-tight">
                  <AnimatedCounter end={kpis.eventos} />
                </p>
                <span className="text-[10px] font-bold text-[#009639] bg-green-50 px-1.5 py-0.5 rounded-md mb-1">📈 +8%</span>
              </div>
            </div>

            {/* KPI: Cobertura Nacional */}
            <div className="group flex flex-col backdrop-blur-md bg-white/90 p-4 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 hover:shadow-[0_15px_40px_rgba(0,32,91,0.12)] transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#00205B] to-[#003A9E]" />
              <svg className="absolute bottom-0 left-0 w-full h-1/2 object-cover opacity-30 pointer-events-none text-slate-200" viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0,30 Q25,10 50,20 T100,5" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#00205B]" /> Estados Visitados
              </p>
              <div className="flex flex-wrap items-end gap-2 justify-between">
                <p className="text-xl lg:text-2xl font-black text-[#00205B] tracking-tight">
                  <AnimatedCounter end={kpis.estados} />
                </p>
                <span className="text-[10px] font-bold text-[#009639] bg-green-50 px-1.5 py-0.5 rounded-md mb-1">📈 +15%</span>
              </div>
            </div>

            {/* KPI: Logística Recorrida */}
            <div className="group flex flex-col backdrop-blur-md bg-white/90 p-4 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 hover:shadow-[0_15px_40px_rgba(100,116,139,0.12)] transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-slate-400 to-slate-600" />
              <svg className="absolute bottom-0 left-0 w-full h-1/2 object-cover opacity-30 pointer-events-none text-slate-200" viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0,30 Q40,5 70,25 T100,10" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-slate-500" /> Logística Recorrida
              </p>
              <div className="flex flex-wrap items-end gap-2 justify-between relative z-10">
                <p className="text-xl lg:text-2xl font-black text-[#00205B] tracking-tight">
                  <AnimatedCounter end={14320} /> <span className="text-sm text-slate-400">Km</span>
                </p>
                <span className="text-[10px] font-bold text-[#009639] bg-green-50 px-1.5 py-0.5 rounded-md mb-1">📈 +5%</span>
              </div>
            </div>
          </div>

          {/* Etiqueta de Actualización */}
          <div className="w-full text-right mt-2 mb-4">
            <span className="text-slate-500 text-[10px] font-medium">Última sincronización de datos: hace 5 minutos</span>
          </div>

          {/* Mapa 3D Protagonista */}
          <div className="w-full max-w-full overflow-visible flex items-center justify-center min-h-[600px] lg:min-h-[700px] relative mt-16 z-10">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 2400,
              center: [-66.5, 6.8]
            }}
            viewBox="0 0 1000 750"
            className="w-full h-auto scale-110 md:scale-115 origin-top transition-transform duration-1000"
            style={{ 
              overflow: 'visible', 
              filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.5))'
            }}
          >
            <defs>
              <filter id="visited-glow">
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#001845" floodOpacity="0.4" />
                <feComponentTransfer in="SourceAlpha">
                  <feFuncA type="linear" slope="0.5"/>
                </feComponentTransfer>
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feOffset dx="0" dy="0"/>
                <feComposite operator="out" in2="SourceAlpha"/>
                <feComposite operator="in" in2="SourceGraphic"/>
                <feBlend mode="multiply" in2="SourceGraphic" result="blendOut"/>
              </filter>
            </defs>
            <Geographies geography={geoUrl}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const geoName = geo.properties.NAME_1 || geo.properties.name || geo.properties.hc_key;
                  const normName = normalizeStateName(geoName);
                  const stateCoords = STATE_COORDS[normName];
                  
                  // Check if state is in route
                  const isActive = stateCoords && routeCoordinates.some(
                    (c: [number, number]) => Math.abs(c[0] - stateCoords[0]) < 0.01 && Math.abs(c[1] - stateCoords[1]) < 0.01
                  );

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(e: any) => {
                        if (isActive) {
                          setTooltip({
                            content: `Operativo en ${geoName}`,
                            x: e.clientX,
                            y: e.clientY
                          });
                        }
                      }}
                      onMouseMove={(e: any) => {
                        if (isActive && tooltip) {
                          setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: isActive ? '#FE5000' : '#1E293B',
                          stroke: isActive ? '#CC4000' : '#64748B',
                          strokeWidth: isActive ? 1.2 : 1,
                          outline: 'none',
                          filter: isActive ? 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))' : 'none',
                          transition: 'all 0.3s ease',
                        },
                        hover: {
                          fill: isActive ? '#FF8A50' : '#334155',
                          stroke: isActive ? '#FE5000' : '#94A3B8',
                          strokeWidth: isActive ? 1.2 : 1,
                          outline: 'none',
                          filter: isActive ? 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.8))' : 'none',
                          cursor: isActive ? 'pointer' : 'default',
                        },
                        pressed: {
                          fill: '#FE5000',
                          outline: 'none',
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Glowing Line */}
            {routeCoordinates.length > 1 && (
              <Line
                coordinates={routeCoordinates}
                stroke="#009639"
                strokeWidth={6}
                strokeOpacity={0.15}
                style={{ strokeLinecap: "round" }}
              />
            )}
            
            {/* Solid Line Animada - Fibra Óptica Neón */}
            {routeCoordinates.length > 1 && (
              <Line
                coordinates={routeCoordinates}
                stroke="#009639"
                strokeWidth={2}
                strokeDasharray="6 4"
                className="animate-dash-flow"
                style={{ 
                  strokeLinecap: "round",
                  filter: 'drop-shadow(0 0 8px rgba(0, 150, 57, 0.6))'
                }}
              />
            )}

            {/* State Markers con Efecto Radar */}
            {routeCoordinates.map((coord: [number, number], idx: number) => (
              <Marker key={idx} coordinates={coord}>
                <foreignObject x="-16" y="-16" width="32" height="32">
                  <div className="relative flex items-center justify-center w-full h-full">
                    {/* Capas concéntricas de radar */}
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-lg shadow-green-500/50"></span>
                    </span>
                  </div>
                </foreignObject>
              </Marker>
            ))}

            {/* Current Position Truck con Pulso Radar */}
            {routeCoordinates.length > 0 && (
              <Marker coordinates={routeCoordinates[routeCoordinates.length - 1]}>
                <foreignObject x="-32" y="-56" width="64" height="64">
                  <div className="relative flex flex-col items-center justify-end w-full h-full pb-2">
                    {/* Radar bajo el camión */}
                    <div className="absolute bottom-2 w-10 h-10 bg-[#009639] rounded-full animate-ping opacity-40" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute bottom-4 w-6 h-6 bg-[#009639] rounded-full animate-ping opacity-60" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                    
                    {/* Contenedor Flotante */}
                    <div className="relative flex flex-col items-center animate-bounce">
                      <div className="bg-[#009639] p-1.5 rounded-lg shadow-[0_0_15px_rgba(0,150,57,0.8)] border border-white/20">
                        <Truck className="w-4 h-4 text-white" />
                      </div>
                      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[#009639]"></div>
                    </div>
                  </div>
                </foreignObject>
              </Marker>
            )}
          </ComposableMap>
        </div>
      </div>
      </div>

      {tooltip && (
        <div 
          className="fixed z-50 bg-slate-900/90 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-lg shadow-2xl shadow-slate-900/50 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-15px] border border-white/10"
          style={{ top: tooltip.y, left: tooltip.x }}
        >
          {tooltip.content}
          <div className="absolute left-1/2 bottom-0 w-2.5 h-2.5 bg-slate-900/90 backdrop-blur-sm border-b border-r border-white/10 transform -translate-x-1/2 translate-y-1/2 rotate-45"></div>
        </div>
      )}
    </div>
  );
}
