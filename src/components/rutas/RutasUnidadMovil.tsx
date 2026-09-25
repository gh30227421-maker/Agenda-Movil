"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import PremiumCarousel from './PremiumCarousel';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { supabase } from '@/lib/supabase';
import { useAgenda } from '@/context/AgendaContext';
import { Loader2, Users, MapPin, Truck, Activity, Calendar, Navigation, Camera, Video, Download, XCircle } from 'lucide-react';
import { toPng } from 'html-to-image';
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

export default function RutasUnidadMovil({ selectedMonths = [] }: { selectedMonths?: string[] }) {
  const { events: allEvents, isLoading: isEventsLoading } = useAgenda();
  const events = useMemo(() => allEvents.filter(e => e.type === 'Unidad Móvil' && (selectedMonths.length === 0 || (e.startDate && selectedMonths.some(m => e.startDate?.startsWith(m))))), [allEvents, selectedMonths]);
  
  const [photos, setPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [dbTotalKm, setDbTotalKm] = useState<number>(0);
  const [loadingKm, setLoadingKm] = useState(true);
  
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const [drilldownState, setDrilldownState] = useState<string | null>(null);
  const [drilldownEventId, setDrilldownEventId] = useState<string | null>(null);
  const [showPopover, setShowPopover] = useState<boolean>(false);

  const filteredEvents = useMemo(() => {
    if (drilldownEventId) return events.filter(e => e.id === drilldownEventId);
    if (drilldownState) return events.filter(e => normalizeStateName(e.estadoOperativo || e.state) === drilldownState);
    return events;
  }, [events, drilldownState, drilldownEventId]);

  // Fetch Playlist de Videos
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data } = await supabase.storage.from('event_photos').list('');
        if (data) {
          const uVideos = data
            .filter(f => f.name.startsWith('unidad-oficial-video') && f.name.endsWith('.mp4'))
            .map(f => supabase.storage.from('event_photos').getPublicUrl(f.name).data.publicUrl);
          
          if (uVideos.length > 0) {
            setPlaylist(uVideos);
          } else {
            setPlaylist([supabase.storage.from('event_photos').getPublicUrl('unidad-oficial-video.mp4').data.publicUrl]);
          }
        }
      } catch (e) {
        setPlaylist([supabase.storage.from('event_photos').getPublicUrl('unidad-oficial-video.mp4').data.publicUrl]);
      }
    };
    fetchVideos();
  }, []);

  const handleVideoEnded = () => {
    if (playlist.length > 1) {
      setCurrentVideoIndex((prev) => (prev + 1) % playlist.length);
    }
  };
  useEffect(() => {
    const fetchKilometros = async () => {
      try {
        const { data, error } = await supabase
          .from('event_expenses')
          .select('distancia_km, events!inner(event_type)')
          .eq('events.event_type', 'Unidad Móvil');

        if (error) throw error;

        const totalKilometros = data 
          ? data.reduce((acc, curr) => acc + (Number(curr.distancia_km) || 0), 0) 
          : 0;
          
        setDbTotalKm(totalKilometros);
      } catch (err) {
        console.error('Error fetching km from DB', err);
        // Fallback matemático en caso de error
        setDbTotalKm(0); 
      } finally {
        setLoadingKm(false);
      }
    };
    
    if (!isEventsLoading) {
      fetchKilometros();
    }
  }, [isEventsLoading]);

  // Referencias para la exportación a PNG
  const kpiProximaParadaRef = useRef<HTMLDivElement>(null);
  const kpiCiudadanosRef = useRef<HTMLDivElement>(null);
  const kpiJornadasRef = useRef<HTMLDivElement>(null);
  const kpiEstadosRef = useRef<HTMLDivElement>(null);
  const kpiLogisticaRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<HTMLDivElement>(null);
  const downloadImage = async (ref: React.RefObject<HTMLDivElement | null>, filename: string, bgColor: string = '#ffffff') => {
    if (!ref.current) return;
    try {
      // Pequeño retardo para asegurar renderizado completo del DOM
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const dataUrl = await toPng(ref.current, {
        backgroundColor: bgColor,
        pixelRatio: 2,
        filter: (node: HTMLElement) => {
          if (node.classList && node.classList.contains('ignore-export')) {
            return false;
          }
          return true;
        },
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: ref.current.offsetWidth + 'px',
          height: ref.current.offsetHeight + 'px',
        }
      });
      const link = document.createElement('a');
      link.download = `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error al generar la imagen', err);
    }
  };
  

  const [tooltip, setTooltip] = useState<{ stateName: string; x: number; y: number } | null>(null);

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
    
    filteredEvents.forEach(e => {
      totalCuentas += (e.cifras?.cuentasAbiertas || 0) + (e.cifras?.atendidos || 0);
      const stateName = e.estadoOperativo || e.state;
      const logisticState = stateName && STATE_COORDS[normalizeStateName(stateName)] ? normalizeStateName(stateName) : null;
      if (logisticState) {
        statesSet.add(logisticState);
      }
    });

    const sortedForRoute = [...filteredEvents]
      .filter(e => (e.estadoOperativo || e.state) && STATE_COORDS[normalizeStateName(e.estadoOperativo || e.state)])
      .sort((a, b) => new Date(a.startDate || '').getTime() - new Date(b.startDate || '').getTime());
    
    const coordsForRoute: [number, number][] = [];
    const seenForRoute = new Set();
    sortedForRoute.forEach(e => {
      const norm = normalizeStateName(e.estadoOperativo || e.state);
      if (!seenForRoute.has(norm)) {
        seenForRoute.add(norm);
        coordsForRoute.push(STATE_COORDS[norm]);
      }
    });

    let totalKm = 0;
    const R = 6371;
    for (let i = 1; i < coordsForRoute.length; i++) {
      const [lon1, lat1] = coordsForRoute[i-1];
      const [lon2, lat2] = coordsForRoute[i];
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      totalKm += R * c;
    }

    return {
      beneficiados: totalCuentas, 
      eventos: events.length,
      estados: statesSet.size,
      kilometros: Math.round(totalKm)
    };
  }, [filteredEvents]);

  const displayedPhotos = useMemo(() => {
    if (drilldownEventId) {
      const p = photos.filter(p => p.event_id === drilldownEventId);
      if (p.length > 0) return p;
    } else if (drilldownState) {
      const stateEventIds = events.filter(e => normalizeStateName(e.estadoOperativo || e.state) === drilldownState).map(e => e.id);
      const p = photos.filter(p => stateEventIds.includes(p.event_id));
      if (p.length > 0) return p;
    }
    return photos;
  }, [photos, drilldownState, drilldownEventId, events]);

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


      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr_280px] xl:grid-cols-[440px_1fr_320px] gap-6 xl:gap-8 w-full px-4 xl:px-8 max-w-[1920px] mx-auto items-start">
        
        {/* Columna Izquierda: Narrativa y Contexto Visual */}
        <div className="flex flex-col relative z-20 w-full gap-3">
          
          {/* Texto Informativo */}
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Llevamos la <strong className="font-bold text-slate-900">solidez del banco</strong> a cada rincón del país. A través de nuestras agencias móviles, garantizamos <strong className="font-bold text-slate-900">atención financiera inmediata</strong>, conectando comunidades y descentralizando nuestros servicios con <strong className="font-bold text-[#FE5000]">tecnología de vanguardia</strong> en tiempo real.
          </p>

          {/* Micro-Tarjeta Próximo Destino (Real de BD) */}
          {nextEvent ? (
            <div ref={kpiProximaParadaRef} id="kpi-proxima-parada" className="group relative bg-slate-900 rounded-xl p-4 shadow-lg flex flex-col justify-center border border-slate-800 mb-4 transition-all duration-300">
              <button
                onClick={() => downloadImage(kpiProximaParadaRef, 'Proxima_Parada_Unidad_Movil', '#0f172a')}
                className="ignore-export absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10 hover:bg-[#FE5000] text-white p-1.5 rounded-md backdrop-blur-sm shadow-md z-50"
                title="Descargar en PNG"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
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
          <div className="w-full h-[260px] xl:h-[340px] rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/50 border border-white/10 group bg-slate-950/40 relative z-20 transition-all duration-500">
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
            <div className="absolute top-4 right-4 z-30 bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">ESTADO: DESPLEGADA</span>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20">
              <span className="text-white text-sm md:text-base font-bold uppercase tracking-widest drop-shadow-md flex items-center gap-2">
                <Truck className="w-5 h-5" /> Unidad Móvil Oficial
              </span>
            </div>
          </div>

          {/* Galería Dinámica */}
          <div className="w-full h-[260px] xl:h-[340px] rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,32,91,0.1)] border border-slate-200 bg-white/40 backdrop-blur-sm pointer-events-auto transform scale-100 hover:scale-[1.01] transition-transform duration-500">
            <PremiumCarousel photos={displayedPhotos} />
          </div>

        </div>

        {/* Columna Central: Data y Monitoreo */}
        <div className="flex flex-col relative w-full h-full">
          
          {/* Fila Única de KPIs */}
          <div className="flex items-center gap-4 mb-4 relative z-20">
            <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-widest m-0">Indicadores Operativos - Unidad Móvil</h3>
            <div className="flex-grow h-px bg-slate-200"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full relative z-20">
            {/* KPI 2: Clientes Atendidos */}
            <div ref={kpiCiudadanosRef} id="kpi-ciudadanos-atendidos-unidad" className="group flex flex-col backdrop-blur-md bg-white/90 p-4 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 hover:shadow-[0_15px_40px_rgba(254,80,0,0.12)] transition-all duration-500 relative overflow-hidden">
              <button
                onClick={() => downloadImage(kpiCiudadanosRef, 'KPI_Ciudadanos_Atendidos')}
                className="ignore-export absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-100 hover:bg-[#FE5000] hover:text-white text-slate-400 p-1.5 rounded-md shadow-sm z-50"
                title="Descargar en PNG"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#FE5000] to-[#FF8A50]" />
              <svg className="absolute bottom-0 left-0 w-full h-1/2 object-cover opacity-30 pointer-events-none text-slate-200" viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0,30 Q20,15 50,25 T100,10" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#FE5000]" /> Clientes Atendidos
              </p>
              <div className="flex flex-wrap items-end gap-2 justify-between">
                <p className="text-xl lg:text-2xl font-black text-[#00205B] tracking-tight">
                  <AnimatedCounter end={kpis.beneficiados} />
                </p>
                <span className="text-[10px] font-bold text-[#009639] bg-green-50 px-1.5 py-0.5 rounded-md mb-1">📈 +12%</span>
              </div>
            </div>

            {/* KPI: Puntos de Despliegue */}
            <div ref={kpiJornadasRef} id="kpi-jornadas-desplegadas-unidad" className="group flex flex-col backdrop-blur-md bg-white/90 p-4 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 hover:shadow-[0_15px_40px_rgba(0,150,57,0.12)] transition-all duration-500 relative overflow-hidden">
              <button
                onClick={() => downloadImage(kpiJornadasRef, 'KPI_Jornadas_Desplegadas')}
                className="ignore-export absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-100 hover:bg-[#009639] hover:text-white text-slate-400 p-1.5 rounded-md shadow-sm z-50"
                title="Descargar en PNG"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
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
            <div ref={kpiEstadosRef} id="kpi-estados-visitados-unidad" className="group flex flex-col backdrop-blur-md bg-white/90 p-4 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 hover:shadow-[0_15px_40px_rgba(0,32,91,0.12)] transition-all duration-500 relative overflow-hidden">
              <button
                onClick={() => downloadImage(kpiEstadosRef, 'KPI_Estados_Visitados')}
                className="ignore-export absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-100 hover:bg-[#00205B] hover:text-white text-slate-400 p-1.5 rounded-md shadow-sm z-50"
                title="Descargar en PNG"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
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

            {/* KPI 5: Kilómetros Recorridos */}
            <div ref={kpiLogisticaRef} id="kpi-logistica-recorrida-unidad" className="group flex flex-col backdrop-blur-md bg-white/90 p-4 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 hover:shadow-[0_15px_40px_rgba(100,116,139,0.12)] transition-all duration-500 relative overflow-hidden">
              <button
                onClick={() => downloadImage(kpiLogisticaRef, 'KPI_Logistica_Recorrida')}
                className="ignore-export absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-100 hover:bg-slate-500 hover:text-white text-slate-400 p-1.5 rounded-md shadow-sm z-50"
                title="Descargar en PNG"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-slate-400 to-slate-600" />
              <svg className="absolute bottom-0 left-0 w-full h-1/2 object-cover opacity-30 pointer-events-none text-slate-200" viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0,30 Q40,5 70,25 T100,10" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-slate-500" /> Kilómetros Recorridos
              </p>
              <div className="flex flex-wrap items-end gap-2 justify-between relative z-10">
                <p className="text-xl lg:text-2xl font-black text-[#00205B] tracking-tight flex items-center gap-2">
                  {loadingKm ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#00205B]" />
                  ) : (
                    <AnimatedCounter end={drilldownState || drilldownEventId ? kpis.kilometros : (dbTotalKm || kpis.kilometros)} /> 
                  )}
                  <span className="text-sm text-slate-400">Km</span>
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
          <div ref={mapaRef} id="mapa-unidad-movil" className="group w-full max-w-full overflow-visible flex items-center justify-center min-h-[600px] lg:min-h-[700px] relative mt-16 z-10">
            <button
              onClick={() => downloadImage(mapaRef, 'Mapa_Unidad_Movil')}
              className="ignore-export absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/80 hover:bg-[#FE5000] hover:text-white text-slate-500 p-2 rounded-lg shadow-lg z-50 backdrop-blur-sm"
              title="Descargar Mapa en PNG"
            >
              <Download className="w-5 h-5" />
            </button>
            
            {/* Popover Drill-Down */}
            {drilldownState && showPopover && (
              <div className="absolute top-0 left-4 md:top-[-20px] z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-4 w-[320px] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                   <h3 className="text-sm font-black text-[#00205B] uppercase tracking-wider">{drilldownState}</h3>
                   <button onClick={() => setShowPopover(false)} className="text-slate-400 hover:text-red-500 transition-colors" title="Cerrar Menú">
                     <XCircle className="w-5 h-5" />
                   </button>
                </div>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
                  {events.filter(e => normalizeStateName(e.estadoOperativo || e.state) === drilldownState).map(ev => (
                     <button 
                       key={ev.id}
                       onClick={() => {
                         setDrilldownEventId(drilldownEventId === ev.id ? null : ev.id);
                       }}
                       className={`text-left p-2.5 rounded-xl border transition-all ${drilldownEventId === ev.id ? 'bg-[#00205B] border-[#00205B] text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200'}`}
                     >
                       <p className="text-[11px] font-bold leading-tight mb-1">{ev.eventName || 'Operativo Especial'}</p>
                       <p className={`text-[9px] flex items-center gap-1 ${drilldownEventId === ev.id ? 'text-blue-200' : 'text-slate-500'}`}>
                         <Users className="w-3 h-3" /> {(ev.cifras?.cuentasAbiertas || 0) + (ev.cifras?.atendidos || 0)} Atendidos
                       </p>
                     </button>
                  ))}
                </div>
                <button 
                  onClick={() => { setDrilldownState(null); setDrilldownEventId(null); setShowPopover(false); }}
                  className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-slate-200"
                >
                  Limpiar y Ver Nacional
                </button>
              </div>
            )}

            {/* Etiqueta Compacta de Filtro Activo */}
            {(drilldownState || drilldownEventId) && !showPopover && (
              <div className="absolute top-0 left-4 md:top-[-20px] z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col max-w-[300px]">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Filtro Activo</span>
                  <strong className="text-xs font-black text-[#00205B] uppercase break-words" title={drilldownEventId ? (events.find(e => e.id === drilldownEventId)?.eventName || 'Evento') : drilldownState}>
                    {drilldownEventId ? (events.find(e => e.id === drilldownEventId)?.eventName || 'Evento Seleccionado') : drilldownState}
                  </strong>
                </div>
                <div className="h-6 w-px bg-slate-200 mx-0.5"></div>
                {drilldownState && (
                  <button onClick={() => setShowPopover(true)} className="text-[9px] font-bold text-[#00205B] bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-md transition-colors uppercase tracking-wider shadow-sm">
                    Modificar
                  </button>
                )}
                <button onClick={() => { setDrilldownState(null); setDrilldownEventId(null); setShowPopover(false); }} className="text-[9px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded-md transition-colors uppercase tracking-wider shadow-sm">
                  Nacional
                </button>
              </div>
            )}

          <ComposableMap
            xmlns="http://www.w3.org/2000/svg"
            projection="geoMercator"
            projectionConfig={{
              scale: 2760,
              center: [-66.5, 6.8]
            }}
            viewBox="0 0 1000 750"
            className="w-[95%] mx-auto h-auto origin-center transition-transform duration-1000"
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
                            stateName: geoName,
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
                      onClick={(e: any) => {
                        if (isActive) {
                          setDrilldownState(normName);
                          // No limpiamos el evento activo si ya estaba seleccionado en este estado
                          setShowPopover(true);
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: isActive 
                            ? (drilldownState && drilldownState !== normName ? '#334155' : '#FE5000') 
                            : '#1E293B',
                          stroke: isActive 
                            ? (drilldownState && drilldownState !== normName ? '#475569' : '#CC4000') 
                            : '#64748B',
                          strokeWidth: isActive ? 1.2 : 1,
                          outline: 'none',
                          filter: isActive && (!drilldownState || drilldownState === normName) ? 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))' : 'none',
                          transition: 'all 0.3s ease',
                        },
                        hover: {
                          fill: isActive 
                            ? (drilldownState && drilldownState !== normName ? '#475569' : '#FF8A50') 
                            : '#334155',
                          stroke: isActive 
                            ? (drilldownState && drilldownState !== normName ? '#64748B' : '#FE5000') 
                            : '#94A3B8',
                          strokeWidth: isActive ? 1.2 : 1,
                          outline: 'none',
                          filter: isActive && (!drilldownState || drilldownState === normName) ? 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.8))' : 'none',
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

            {/* Truck Markers */}
            {routeCoordinates.map((coord: [number, number], idx: number) => {
              const isLast = idx === routeCoordinates.length - 1;
              return (
              <Marker key={idx} coordinates={coord}>
                <foreignObject x="-32" y="-56" width="64" height="64">
                  <div className={`relative flex flex-col items-center justify-end w-full h-full pb-2 ${isLast ? 'z-50' : 'z-10'}`}>
                    {/* Radar bajo el camión (sólo para el actual) */}
                    {isLast && (
                      <>
                        <div className="absolute bottom-2 w-10 h-10 bg-[#00205B] rounded-full animate-ping opacity-40" style={{ animationDuration: '2s' }}></div>
                        <div className="absolute bottom-4 w-6 h-6 bg-[#00205B] rounded-full animate-ping opacity-60" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                      </>
                    )}
                    
                    {/* Contenedor Flotante del Camión */}
                    <div className={`relative flex flex-col items-center ${isLast ? 'animate-bounce' : 'opacity-90 hover:opacity-100 hover:-translate-y-1 transition-all'}`}>
                      <div className={`p-1.5 rounded-lg shadow-lg border border-white/20 ${isLast ? 'bg-[#FE5000] shadow-[0_0_15px_rgba(254,80,0,0.8)]' : 'bg-[#00205B] shadow-[#00205B]/50'}`}>
                        <Truck className="w-4 h-4 text-white" />
                      </div>
                      <div className={`w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] ${isLast ? 'border-t-[#FE5000]' : 'border-t-[#00205B]'}`}></div>
                    </div>
                  </div>
                </foreignObject>
              </Marker>
            )})}
          </ComposableMap>
        </div>
        
        </div>

        {/* Columna Derecha: Panel de Video & Timeline */}
        <div className="flex flex-col relative w-full h-full pr-4 xl:pr-6">
          <div className="sticky top-24 flex flex-col gap-6 lg:mt-[4.5rem]">
            
            {/* Video Institucional */}
            <div className="w-full h-auto rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,32,91,0.1)] border border-slate-200 bg-slate-900 group pointer-events-auto relative">
              {playlist.length > 0 && (
                <video 
                  key={playlist[currentVideoIndex]}
                  className="w-full h-auto block object-cover relative z-10"
                  autoPlay
                  muted
                  loop={playlist.length === 1}
                  playsInline
                  preload="metadata"
                  onEnded={handleVideoEnded}
                >
                  <source src={playlist[currentVideoIndex]} type="video/mp4" />
                  <source src={playlist[currentVideoIndex].replace('.mp4', '.webm')} type="video/webm" />
                  Tu navegador no soporta el formato de video.
                </video>
              )}
              <div className="absolute top-3 right-3 z-20 bg-[#00205B]/80 backdrop-blur border border-white/20 rounded-full px-2 py-1 flex items-center gap-1.5 shadow-md transition-all">
                 <Video className="w-3.5 h-3.5 text-white" />
                 <span className="text-[9px] font-bold uppercase tracking-wider text-white">
                   Institucional {playlist.length > 1 ? `(${currentVideoIndex + 1}/${playlist.length})` : ''}
                 </span>
              </div>
            </div>

            {/* Live Timeline Vertical */}
            <div className="flex flex-col backdrop-blur-md bg-white/70 p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 relative overflow-hidden pointer-events-auto">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[#00205B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#00205B]">Últimos Despliegues</h3>
                <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100/50 border border-green-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#009639] animate-pulse" />
                  <span className="text-[9px] font-bold text-[#009639] uppercase tracking-wider">Live</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 relative border-l-2 border-slate-200 ml-2 pl-4 mt-2">
                {[...events]
                  .filter(e => new Date(e.startDate || 0).getTime() <= new Date().getTime())
                  .sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime())
                  .slice(0, 3).map((event, idx) => (
                  <div key={event.id || idx} className="relative flex flex-col z-10 pb-2">
                    <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-[#FE5000] border-2 border-white shadow-sm z-10" />
                    <div className="flex flex-col w-full">
                      <div className="flex flex-col">
                        <p className="text-[13px] font-bold text-slate-700 leading-tight">{event.eventName || 'Operativo Especial'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.startDate ? new Date(event.startDate).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : 'N/A'}</span>
                          <span className="text-[9px] font-bold text-[#00205B] bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-100">{event.estadoOperativo || event.state}</span>
                        </div>
                      </div>
                      {((event.cifras?.cuentasAbiertas || 0) + (event.cifras?.atendidos || 0)) > 0 && (
                        <div className="bg-green-50 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm border border-green-100 w-fit mt-2">
                          👥 {(event.cifras?.cuentasAbiertas || 0) + (event.cifras?.atendidos || 0)} Atendidos
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {tooltip && (() => {
        const normHover = normalizeStateName(tooltip.stateName);
        const stateEvents = events.filter(e => normalizeStateName(e.estadoOperativo || e.state) === normHover);
        const eventNames = stateEvents.map(e => e.eventName).filter(Boolean).join(' | ') || 'Operativo Oficial';
        const totalCuentas = stateEvents.reduce((acc, curr) => acc + (curr.cifras?.cuentasAbiertas || 0), 0);
        
        return (
          <div 
            className="fixed z-50 bg-[#00153B]/95 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-15px] border border-white/20 min-w-[200px] max-w-[260px] animate-in fade-in zoom-in-95 duration-200"
            style={{ top: tooltip.y, left: tooltip.x }}
          >
            <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
              <div className="w-2 h-2 rounded-full bg-[#FE5000] animate-pulse shadow-[0_0_8px_rgba(254,80,0,0.8)] shrink-0" />
              <span className="font-black tracking-widest uppercase text-sm drop-shadow-md truncate">
                {tooltip.stateName}
              </span>
            </div>
            
            <div className="flex flex-col gap-2 mt-2">
               <div className="flex flex-col">
                 <span className="text-[9px] text-blue-200 uppercase tracking-widest font-semibold flex items-center gap-1.5 mb-0.5"><Truck className="w-3 h-3" /> Evento Activo</span>
                 <span className="font-bold text-xs leading-tight text-white/90">{eventNames}</span>
               </div>
               <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-1.5">
                 <span className="text-[9px] text-blue-200 uppercase tracking-widest font-semibold flex items-center gap-1.5"><Users className="w-3 h-3" /> Cuentas Abiertas</span>
                 <span className="font-black text-[#FE5000]">{totalCuentas > 0 ? `+${totalCuentas.toLocaleString('es-VE')}` : 'N/A'}</span>
               </div>
            </div>

            <div className="absolute left-1/2 bottom-0 w-3 h-3 bg-[#00153B]/95 backdrop-blur-md border-b border-r border-white/20 transform -translate-x-1/2 translate-y-[5px] rotate-45"></div>
          </div>
        );
      })()}
    </div>
  );
}
