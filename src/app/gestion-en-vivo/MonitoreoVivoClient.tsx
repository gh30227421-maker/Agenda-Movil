"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAgenda } from '@/context/AgendaContext';
import { Users, CreditCard, FileText, Activity, MapPin, Truck, Smartphone, RefreshCw, Key, Link as LinkIcon, ShieldAlert, Wifi, UserCheck } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const geoUrl = '/venezuela.json';

const normalizeStateName = (name?: string) => {
  if (!name) return '';
  const normalized = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace('estado ', '')
    .trim();
  if (normalized === 'capital' || normalized === 'distrito capital') return 'distrito capital';
  if (normalized === 'la guaira' || normalized === 'vargas') return 'la guaira';
  return normalized;
};

const STATE_COORDS: Record<string, [number, number]> = {
  'distrito capital': [-66.9036, 10.4806],
  'miranda': [-66.4, 10.25],
  'zulia': [-71.6406, 10.6427],
  'carabobo': [-68.0125, 10.1620],
  'aragua': [-67.5973, 10.2505],
  'lara': [-69.3175, 10.0678],
  'nueva esparta': [-63.9113, 10.9971],
  'anzoategui': [-64.6167, 9.3833],
  'bolivar': [-63.5497, 7.3305],
  'tachira': [-72.2234, 7.7669],
  'falcon': [-69.6738, 11.3802],
  'sucre': [-63.1783, 10.4539],
  'merida': [-71.1449, 8.5983],
  'monagas': [-63.1772, 9.7456],
  'barinas': [-70.2075, 8.6226],
  'trujillo': [-70.6346, 9.3667],
  'portuguesa': [-69.2553, 9.0418],
  'guarico': [-66.9333, 8.8167],
  'cojedes': [-68.3000, 9.6333],
  'yaracuy': [-68.7492, 10.3392],
  'apure': [-68.4500, 7.8833],
  'vargas': [-66.9333, 10.6000],
  'la guaira': [-66.9333, 10.6000],
  'amazonas': [-66.5897, 3.3756],
  'delta amacuro': [-61.3500, 8.9833]
};

const STATE_SCALES: Record<string, number> = {
  'distrito capital': 60000,
  'miranda': 20000,
  'zulia': 7500,
  'carabobo': 30000,
  'aragua': 25000,
  'lara': 15000,
  'nueva esparta': 50000,
  'anzoategui': 9000,
  'bolivar': 4000,
  'tachira': 18000,
  'falcon': 12000,
  'sucre': 15000,
  'merida': 20000,
  'monagas': 12000,
  'barinas': 10000,
  'trujillo': 22000,
  'portuguesa': 14000,
  'guarico': 7000,
  'cojedes': 18000,
  'yaracuy': 25000,
  'apure': 6000,
  'vargas': 30000,
  'la guaira': 30000,
  'amazonas': 4500,
  'delta amacuro': 12000
};

export default function MonitoreoVivoClient() {
  const { events } = useAgenda();
  const searchParams = useSearchParams();
  const historicalId = searchParams.get('historical_id');

  const [eventId, setEventId] = useState<string | null>(historicalId);
  const [isHistorical, setIsHistorical] = useState<boolean>(!!historicalId);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (historicalId) {
      setEventId(historicalId);
      setIsHistorical(true);
      return;
    }

    const fetchActiveEvent = async () => {
      const { data } = await supabase.from('live_config').select('active_event_id').eq('id', 1).maybeSingle();
      if (data && data.active_event_id) {
        setEventId(data.active_event_id);
      } else {
        setLoading(false);
      }
    };
    fetchActiveEvent();
    
    const configChannel = supabase
      .channel('public:live_config')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_config', filter: 'id=eq.1' }, (payload) => {
        setEventId(payload.new.active_event_id);
        setRegistros([]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(configChannel);
    };
  }, [historicalId]);

  const event = events.find(e => e.id === eventId);

  const fetchRegistros = async () => {
    if (!eventId) return;
    try {
      const { data, error } = await supabase
        .from('registros_en_vivo')
        .select('*')
        .eq('event_id', eventId)
        .order('fecha_registro', { ascending: false });
      
      if (error) throw error;
      setRegistros(data || []);
    } catch (err) {
      console.error("Error loading live data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    fetchRegistros();

    if (isHistorical) return;

    const channel = supabase
      .channel(`public:registros_en_vivo:event_id=eq.${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'registros_en_vivo',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          setRegistros((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const kpis = useMemo(() => {
    let tddPrimeraVez = 0;
    let tddReposiciones = 0;
    let tddMigraciones = 0;
    
    let ctasNivel1 = 0;
    let ctasNivel2 = 0;
    let ctasTipoA = 0;
    let ctasTipoB = 0;
    let ctasOtras = 0;
    
    let opsAfiliacionBncnet = 0;
    let opsAfiliacionP2p = 0;
    let opsAsociacionTdd = 0;
    let opsCambioEstatus = 0;
    let opsReseteoAtpw = 0;
    let opsDesbloqueoBncnet = 0;
    let opsTdc = 0;

    let atmConsultas = 0;
    let atmRetiros = 0;
    let atmCambioClave = 0;

    let tipoNuevo = 0;
    let tipoActualizacion = 0;

    let clientesUnicos = new Set();

    registros.forEach(r => {
      clientesUnicos.add(r.cedula_identidad);

      // Estatus de Cliente
      if (r.tipo_solicitud === 'CLIENTE NUEVO') tipoNuevo++;
      else if (r.tipo_solicitud) tipoActualizacion++;

      // TDD
      if (r.modulo_tdd) {
        if (r.modulo_tdd.includes('511 PRIMERA VEZ')) tddPrimeraVez++;
        if (r.modulo_tdd.includes('518 REPOSICION')) tddReposiciones++;
        if (r.modulo_tdd.includes('522 MIGRACION') || r.modulo_tdd.includes('570 MIGRACION')) tddMigraciones++;
      }
      
      // Cuentas
      if (r.modulo_cuenta) {
        const ctas = r.modulo_cuenta.split(';').filter(Boolean);
        ctas.forEach((c: string) => {
          if (c.includes('NIVEL 1')) ctasNivel1++;
          else if (c.includes('NIVEL 2')) ctasNivel2++;
          else if (c.includes('TIPO A $')) ctasTipoA++;
          else if (c.includes('TIPO B $')) ctasTipoB++;
          else ctasOtras++;
        });
      }

      // Otras & TDC & ATM
      if (r.modulo_otras_operaciones) {
         const ops = r.modulo_otras_operaciones.split(';').filter(Boolean);
         ops.forEach((o: string) => {
           const upperOp = o.toUpperCase();
           if (upperOp.includes('AFILIACIÓN BNCNET') || upperOp.includes('AFILIACION BNCNET')) opsAfiliacionBncnet++;
           if (upperOp.includes('P2P')) opsAfiliacionP2p++;
           if (upperOp.includes('ASOCIACION TDD') || upperOp.includes('ASOCIACIÓN TDD')) opsAsociacionTdd++;
           if (upperOp.includes('ESTATUS TDD')) opsCambioEstatus++;
           if (upperOp.includes('RESETEO')) opsReseteoAtpw++;
           if (upperOp.includes('DESBLOQUEO')) opsDesbloqueoBncnet++;

           // ATM Ops in case they are here
           if (upperOp.includes('CONSULTA')) atmConsultas++;
           if (upperOp.includes('RETIRO')) atmRetiros++;
           if (upperOp.includes('CAMBIO DE CLAVE')) atmCambioClave++;
         });
      }
      
      // ATM Ops if they exist in a dedicated column (fallback/future-proofing)
      const modAtm = (r as any).modulo_atm;
      if (modAtm) {
         const atms = modAtm.split(';').filter(Boolean);
         atms.forEach((a: string) => {
           const upperA = a.toUpperCase();
           if (upperA.includes('CONSULTA')) atmConsultas++;
           if (upperA.includes('RETIRO')) atmRetiros++;
           if (upperA.includes('CAMBIO DE CLAVE')) atmCambioClave++;
         });
      }

      if (r.modulo_tdc_opcional) {
        const tdcs = r.modulo_tdc_opcional.split(';').filter(Boolean);
        opsTdc += tdcs.length;
      }
    });

    return {
      clientesAtendidos: clientesUnicos.size,
      atencion: { nuevo: tipoNuevo, actualizacion: tipoActualizacion },
      tdd: { primeraVez: tddPrimeraVez, reposiciones: tddReposiciones, migraciones: tddMigraciones, total: tddPrimeraVez + tddReposiciones + tddMigraciones },
      cuentas: { nivel1: ctasNivel1, nivel2: ctasNivel2, tipoA: ctasTipoA, tipoB: ctasTipoB, otras: ctasOtras, total: ctasNivel1 + ctasNivel2 + ctasTipoA + ctasTipoB + ctasOtras },
      otrasOps: { 
        afiliacionBncnet: opsAfiliacionBncnet, 
        afiliacionP2p: opsAfiliacionP2p, 
        asociacionTdd: opsAsociacionTdd, 
        cambioEstatus: opsCambioEstatus,
        reseteoAtpw: opsReseteoAtpw,
        desbloqueoBncnet: opsDesbloqueoBncnet,
        total: opsAfiliacionBncnet + opsAfiliacionP2p + opsAsociacionTdd + opsCambioEstatus + opsReseteoAtpw + opsDesbloqueoBncnet 
      },
      tdc: { total: opsTdc },
      atm: {
        consultas: atmConsultas,
        retiros: atmRetiros,
        cambioClave: atmCambioClave,
        total: atmConsultas + atmRetiros + atmCambioClave
      }
    };
  }, [registros]);

  if (!eventId || !event) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col pt-[120px] items-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center max-w-lg text-center animate-in fade-in zoom-in-95 duration-500 mt-20">
          <Activity className="w-16 h-16 text-slate-300 mb-6" />
          <h2 className="text-2xl font-black text-[#00205B] uppercase tracking-widest mb-3">Modo Reposo</h2>
          <p className="text-slate-500 font-medium text-lg">No hay ninguna jornada activa ni seleccionada en este momento.</p>
          {!isHistorical && (
            <p className="text-slate-400 text-sm mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">El panel directivo en vivo se activará automáticamente de forma reactiva en cuanto se asigne un evento activo desde el panel de administración.</p>
          )}
        </div>
      </div>
    );
  }

  const eventStateNormalized = normalizeStateName(event.estadoOperativo || event.state || '');
  const markerCoord = STATE_COORDS[eventStateNormalized] || [-66.9036, 10.4806];

  return (
    <div className="w-full min-h-screen flex flex-col -mt-6 lg:-mt-8 -mx-6 lg:-mx-10 px-6 lg:px-10 pt-4">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-slate-100 to-white z-0" />
      
      <div className="relative z-10 w-full max-w-[1920px] mx-auto flex flex-col gap-6">
        
        {/* Cabecera Principal */}
        <div className="flex flex-col xl:flex-row gap-6 mb-2 animate-in fade-in slide-in-from-top-4 duration-500 items-stretch">
          
          {/* Info del Evento */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl py-4 px-6 shadow-sm flex flex-col justify-center xl:min-w-[400px] shrink-0 relative overflow-hidden">
            <div className="flex flex-col justify-center gap-1 mb-1.5">
              {isHistorical ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MODO HISTÓRICO</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">TRANSMITIENDO EN VIVO</span>
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-black text-[#00205B] tracking-tight uppercase leading-none">{event.eventName}</h1>
            </div>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#FE5000]" /> {event.municipality ? `${event.municipality}, ` : ''}{event.estadoOperativo || event.state || 'Venezuela'}
            </p>
          </div>
          
          {/* Tarjetas de KPIs Superiores */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Cuentas */}
            <div className="group flex justify-between items-center bg-white/90 py-3 px-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 relative overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00205B]" />
              <div className="flex flex-col pl-2">
                <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Cuentas Abiertas</span>
                <p className="text-2xl lg:text-3xl font-black text-[#00205B] tracking-tight leading-none">
                  {kpis.cuentas.total}
                </p>
              </div>
              <div className="p-2 bg-blue-50 text-[#00205B] rounded-xl shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Total TDD */}
            <div className="group flex justify-between items-center bg-white/90 py-3 px-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 relative overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FE5000]" />
              <div className="flex flex-col pl-2">
                <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">TDD Entregadas</span>
                <p className="text-2xl lg:text-3xl font-black text-[#00205B] tracking-tight leading-none">
                  {kpis.tdd.total}
                </p>
              </div>
              <div className="p-2 bg-orange-50 text-[#FE5000] rounded-xl shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            {/* Otras Operaciones */}
            <div className="group flex justify-between items-center bg-white/90 py-3 px-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 relative overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00205B]" />
              <div className="flex flex-col pl-2">
                <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Otras Operaciones</span>
                <p className="text-2xl lg:text-3xl font-black text-[#00205B] tracking-tight leading-none">
                  {kpis.otrasOps.total}
                </p>
              </div>
              <div className="p-2 bg-blue-50 text-[#00205B] rounded-xl shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            {/* Clientes */}
            <div className="group flex justify-between items-center bg-white/90 py-3 px-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 relative overflow-hidden h-full">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
              <div className="flex flex-col pl-2">
                <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Clientes Atendidos</span>
                <p className="text-2xl lg:text-3xl font-black text-[#FE5000] tracking-tight leading-none">
                  {kpis.clientesAtendidos}
                </p>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <Activity className="w-5 h-5" />
              </div>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          
          {/* Columna Izquierda: KPIs Detallados */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Módulo Estatus de Cliente */}
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><UserCheck className="w-5 h-5" /></div>
                <h3 className="text-sm font-black text-[#00205B] uppercase tracking-widest">Estatus de Cliente</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 pt-1">
                  <span className="text-sm font-bold text-slate-500">Clientes Nuevos</span>
                  <span className="text-2xl font-black text-[#00205B]">{kpis.atencion.nuevo}</span>
                </div>
                <div className="flex justify-between items-center pb-2 pt-2">
                  <span className="text-sm font-bold text-slate-500">Actualizaciones</span>
                  <span className="text-2xl font-black text-[#00205B]">{kpis.atencion.actualizacion}</span>
                </div>
              </div>
            </div>

            {/* Módulo de Cuentas */}
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00205B]" />
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-[#00205B] rounded-xl"><Users className="w-5 h-5" /></div>
                <h3 className="text-sm font-black text-[#00205B] uppercase tracking-widest">Módulo Cuentas</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 pt-1">
                  <span className="text-sm font-bold text-slate-500">Nivel 1</span>
                  <span className="text-2xl font-black text-[#00205B]">{kpis.cuentas.nivel1}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 pt-2">
                  <span className="text-sm font-bold text-slate-500">Nivel 2</span>
                  <span className="text-2xl font-black text-[#00205B]">{kpis.cuentas.nivel2}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 pt-2">
                  <span className="text-sm font-bold text-slate-500">Divisa Tipo A $</span>
                  <span className="text-2xl font-black text-[#00205B]">{kpis.cuentas.tipoA}</span>
                </div>
                <div className="flex justify-between items-center pb-2 pt-2">
                  <span className="text-sm font-bold text-slate-500">Divisa Tipo B $</span>
                  <span className="text-2xl font-black text-[#00205B]">{kpis.cuentas.tipoB}</span>
                </div>
              </div>
            </div>



          </div>

          {/* Columna Central: Mapa Oficial Flotante */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-start min-h-[500px] w-full">
            <div className="w-full h-full relative z-10 flex items-start justify-center mt-2 lg:mt-6">
              <ComposableMap
                xmlns="http://www.w3.org/2000/svg"
                projection="geoMercator"
                projectionConfig={{ 
                  scale: STATE_SCALES[eventStateNormalized] || 2760, 
                  center: STATE_COORDS[eventStateNormalized] || [-66.5, 6.8] 
                }}
                viewBox="0 0 1000 750"
                className="w-full h-auto origin-center transition-transform duration-1000"
                style={{ overflow: 'visible', filter: 'drop-shadow(0px 30px 40px rgba(0, 32, 91, 0.45)) drop-shadow(0px 10px 15px rgba(0,0,0,0.3))' }}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const isActive = normalizeStateName(geo.properties.ESTADO || geo.properties.NAME_1) === eventStateNormalized;
                      if (!isActive) return null;
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          style={{
                            default: {
                              fill: '#00205B',
                              stroke: '#001235',
                              strokeWidth: 2,
                              outline: 'none',
                            },
                            hover: { fill: '#00205B', outline: 'none' },
                            pressed: { fill: '#00205B', outline: 'none' }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
                {markerCoord && (
                  <Marker coordinates={markerCoord}>
                    <foreignObject x="-32" y="-56" width="64" height="64">
                      <div className="relative flex flex-col items-center justify-end w-full h-full pb-2 z-50">
                        {/* Radar bajo el pin */}
                        <div className="absolute bottom-2 w-10 h-10 bg-[#FE5000] rounded-full animate-ping opacity-40" style={{ animationDuration: '2s' }}></div>
                        <div className="absolute bottom-4 w-6 h-6 bg-[#FE5000] rounded-full animate-ping opacity-60" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                        
                        {/* Contenedor Flotante del Pin */}
                        <div className="relative flex flex-col items-center animate-bounce">
                          <div className="p-2 rounded-full shadow-lg border border-white/20 bg-[#FE5000] shadow-[0_0_15px_rgba(254,80,0,0.8)]">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#FE5000]"></div>
                        </div>
                      </div>
                    </foreignObject>
                    <text
                      textAnchor="start"
                      x={20}
                      y={-30}
                      style={{ fill: "#FFFFFF", fontSize: "16px", fontWeight: "900", letterSpacing: "1px", filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.8))" }}
                    >
                      {event.municipality || event.estadoOperativo || event.state}
                    </text>
                  </Marker>
                )}
              </ComposableMap>
            </div>
          </div>

          {/* Columna Derecha: Feed y Módulos Adicionales */}
          <div className="lg:col-span-3 flex flex-col gap-6 h-full">
            


            {/* Módulo de TDD */}
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FE5000]" />
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-50 text-[#FE5000] rounded-xl"><CreditCard className="w-5 h-5" /></div>
                <h3 className="text-sm font-black text-[#00205B] uppercase tracking-widest">Módulo TDD</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 pt-1">
                  <span className="text-sm font-bold text-slate-500">Primera Vez (511)</span>
                  <span className="text-2xl font-black text-[#00205B]">{kpis.tdd.primeraVez}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 pt-2">
                  <span className="text-sm font-bold text-slate-500">Reposiciones (518)</span>
                  <span className="text-2xl font-black text-[#00205B]">{kpis.tdd.reposiciones}</span>
                </div>
                <div className="flex justify-between items-center pb-2 pt-2">
                  <span className="text-sm font-bold text-slate-500">Migraciones</span>
                  <span className="text-2xl font-black text-[#00205B]">{kpis.tdd.migraciones}</span>
                </div>
              </div>
            </div>

            {/* Módulo Otras Operaciones */}
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00205B]" />
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-[#00205B] rounded-xl"><FileText className="w-5 h-5" /></div>
                <h3 className="text-sm font-black text-[#00205B] uppercase tracking-widest">Servicios</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                  <Smartphone className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase mb-1">Afiliación BNCNET</span>
                  <span className="text-xl font-black text-[#00205B]">{kpis.otrasOps.afiliacionBncnet}</span>
                </div>
                <div className="flex flex-col bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                  <Wifi className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase mb-1">Afiliación P2P</span>
                  <span className="text-xl font-black text-[#00205B]">{kpis.otrasOps.afiliacionP2p}</span>
                </div>
                <div className="flex flex-col bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                  <LinkIcon className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase mb-1">Asociación TDD</span>
                  <span className="text-xl font-black text-[#00205B]">{kpis.otrasOps.asociacionTdd}</span>
                </div>
                <div className="flex flex-col bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                  <Activity className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase mb-1">Cambio Estatus</span>
                  <span className="text-xl font-black text-[#00205B]">{kpis.otrasOps.cambioEstatus}</span>
                </div>
                <div className="flex flex-col bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                  <Key className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase mb-1">Reseteo Clave</span>
                  <span className="text-xl font-black text-[#00205B]">{kpis.otrasOps.reseteoAtpw}</span>
                </div>
                <div className="flex flex-col bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                  <ShieldAlert className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase mb-1">Desbloqueo</span>
                  <span className="text-xl font-black text-[#00205B]">{kpis.otrasOps.desbloqueoBncnet}</span>
                </div>
              </div>
            </div>

          </div>
          
        </div>

        {/* Bloque Inferior: Feed de Transacciones Full-Width */}
        <div className="w-full bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-sm mb-6 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-sm font-black text-[#00205B] uppercase tracking-wider flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Activity className="w-5 h-5 text-[#FE5000]" /> Últimos Registros en Tiempo Real
          </h2>
          
          <div className="flex overflow-x-auto pb-4 gap-4 custom-scrollbar snap-x snap-mandatory">
            {loading ? (
              <div className="flex flex-col items-center justify-center w-full py-10 text-slate-400 gap-3">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#FE5000] rounded-full animate-spin"></div>
                <span className="text-xs font-bold uppercase tracking-widest">Conectando...</span>
              </div>
            ) : registros.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full py-10 text-slate-400 gap-2 opacity-50">
                <Smartphone className="w-10 h-10" />
                <span className="text-xs font-bold">Esperando registros...</span>
              </div>
            ) : (
              registros.map((r, i) => (
                <div key={r.id} className="min-w-[320px] max-w-[320px] shrink-0 snap-start bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#00205B] bg-[#00205B]/10 px-2 py-0.5 rounded uppercase tracking-wider">
                      {r.cedula_identidad}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {new Date(r.fecha_registro).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex-1">
                    {r.tipo_solicitud === 'CLIENTE NUEVO' ? (
                      <span className="text-[#FE5000] font-bold">● Nuevo: </span>
                    ) : (
                      <span className="text-blue-500 font-bold">● Act.: </span>
                    )}
                    {[r.modulo_cuenta, r.modulo_tdd, r.modulo_tdc_opcional, r.modulo_otras_operaciones].filter(Boolean).join('; ').replace(/;/g, ', ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}
