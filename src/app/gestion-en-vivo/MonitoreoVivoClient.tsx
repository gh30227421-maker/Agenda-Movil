"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAgenda } from '@/context/AgendaContext';
import { Users, CreditCard, FileText, Activity, MapPin, Truck, Smartphone, RefreshCw, Key, Link as LinkIcon, ShieldAlert } from 'lucide-react';
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

export default function MonitoreoVivoClient() {
  const { events } = useAgenda();
  const [eventId, setEventId] = useState<string | null>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

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
    
    let opsAfiliacion = 0;
    let opsDesbloqueo = 0;
    let opsAsociacion = 0;
    let opsReseteo = 0;
    let opsTdc = 0;

    let clientesUnicos = new Set();

    registros.forEach(r => {
      clientesUnicos.add(r.cedula_identidad);

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

      // Otras & TDC
      if (r.modulo_otras_operaciones) {
         const ops = r.modulo_otras_operaciones.split(';').filter(Boolean);
         ops.forEach((o: string) => {
           if (o.includes('AFILIACIÓN')) opsAfiliacion++;
           if (o.includes('DESBLOQUEO')) opsDesbloqueo++;
           if (o.includes('ASOCIACION')) opsAsociacion++;
           if (o.includes('RESETEO')) opsReseteo++;
         });
      }
      if (r.modulo_tdc_opcional) {
        const tdcs = r.modulo_tdc_opcional.split(';').filter(Boolean);
        opsTdc += tdcs.length;
      }
    });

    return {
      clientesAtendidos: clientesUnicos.size,
      tdd: { primeraVez: tddPrimeraVez, reposiciones: tddReposiciones, migraciones: tddMigraciones, total: tddPrimeraVez + tddReposiciones + tddMigraciones },
      cuentas: { nivel1: ctasNivel1, nivel2: ctasNivel2, tipoA: ctasTipoA, tipoB: ctasTipoB, otras: ctasOtras, total: ctasNivel1 + ctasNivel2 + ctasTipoA + ctasTipoB + ctasOtras },
      otrasOps: { afiliacion: opsAfiliacion, desbloqueo: opsDesbloqueo, asociacion: opsAsociacion, reseteo: opsReseteo, tdc: opsTdc, total: opsAfiliacion + opsDesbloqueo + opsAsociacion + opsReseteo + opsTdc }
    };
  }, [registros]);

  if (!eventId || !event) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col pt-[120px] items-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center max-w-lg text-center animate-in fade-in zoom-in-95 duration-500 mt-20">
          <Activity className="w-16 h-16 text-slate-300 mb-6" />
          <h2 className="text-2xl font-black text-[#00205B] uppercase tracking-widest mb-3">Modo Reposo</h2>
          <p className="text-slate-500 font-medium text-lg">No hay ninguna jornada activa en este momento.</p>
          <p className="text-slate-400 text-sm mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">El panel directivo en vivo se activará automáticamente de forma reactiva en cuanto se asigne un evento activo desde el panel de administración.</p>
        </div>
      </div>
    );
  }

  const eventStateNormalized = normalizeStateName(event.state || '');
  const markerCoord = STATE_COORDS[eventStateNormalized] || [-66.9036, 10.4806];

  return (
    <div className="w-full min-h-screen flex flex-col -mt-6 lg:-mt-8 -mx-6 lg:-mx-10 px-6 lg:px-10 pt-4">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-slate-100 to-white z-0" />
      
      <div className="relative z-10 w-full max-w-[1920px] mx-auto flex flex-col gap-6">
        
        {/* Cabecera Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 animate-in fade-in slide-in-from-top-4 duration-500 bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Transmitiendo en Vivo</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#00205B] tracking-tight uppercase">{event.eventName}</h1>
            <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FE5000]" /> {event.state}, {event.municipality || 'Venezuela'}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Clientes Atendidos</span>
              <span className="text-4xl font-black text-[#FE5000]">{kpis.clientesAtendidos}</span>
            </div>
            <div className="w-px h-12 bg-slate-200"></div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Operaciones</span>
              <span className="text-4xl font-black text-[#00205B]">{kpis.cuentas.total + kpis.tdd.total + kpis.otrasOps.total}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          
          {/* Columna Izquierda: KPIs Detallados */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Módulo de Cuentas */}
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00205B]" />
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-[#00205B] rounded-xl"><Users className="w-5 h-5" /></div>
                <h3 className="text-sm font-black text-[#00205B] uppercase tracking-widest">Módulo Cuentas</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500">Nivel 1</span>
                  <span className="text-lg font-black text-[#00205B]">{kpis.cuentas.nivel1}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500">Nivel 2</span>
                  <span className="text-lg font-black text-[#00205B]">{kpis.cuentas.nivel2}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500">Divisas (A / B)</span>
                  <span className="text-lg font-black text-[#00205B]">{kpis.cuentas.tipoA + kpis.cuentas.tipoB}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Aperturas</span>
                  <span className="text-xl font-black text-[#FE5000]">{kpis.cuentas.total}</span>
                </div>
              </div>
            </div>

            {/* Módulo de TDD */}
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FE5000]" />
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-50 text-[#FE5000] rounded-xl"><CreditCard className="w-5 h-5" /></div>
                <h3 className="text-sm font-black text-[#00205B] uppercase tracking-widest">Módulo TDD</h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500">Primera Vez (511)</span>
                  <span className="text-lg font-black text-[#00205B]">{kpis.tdd.primeraVez}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500">Reposiciones (518)</span>
                  <span className="text-lg font-black text-[#00205B]">{kpis.tdd.reposiciones}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500">Migraciones</span>
                  <span className="text-lg font-black text-[#00205B]">{kpis.tdd.migraciones}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total TDD</span>
                  <span className="text-xl font-black text-[#FE5000]">{kpis.tdd.total}</span>
                </div>
              </div>
            </div>

            {/* Módulo Otras Operaciones */}
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl"><FileText className="w-5 h-5" /></div>
                <h3 className="text-sm font-black text-[#00205B] uppercase tracking-widest">Servicios & TDC</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3 border-b border-slate-100 pb-4">
                <div className="flex flex-col bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                  <Smartphone className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Afiliación</span>
                  <span className="text-base font-black text-[#00205B]">{kpis.otrasOps.afiliacion}</span>
                </div>
                <div className="flex flex-col bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                  <RefreshCw className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Reseteo</span>
                  <span className="text-base font-black text-[#00205B]">{kpis.otrasOps.reseteo}</span>
                </div>
                <div className="flex flex-col bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                  <LinkIcon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Asociación</span>
                  <span className="text-base font-black text-[#00205B]">{kpis.otrasOps.asociacion}</span>
                </div>
                <div className="flex flex-col bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                  <ShieldAlert className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Desbloqueo</span>
                  <span className="text-base font-black text-[#00205B]">{kpis.otrasOps.desbloqueo}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Trámites TDC</span>
                <span className="text-lg font-black text-[#FE5000]">{kpis.otrasOps.tdc}</span>
              </div>
            </div>

          </div>

          {/* Columna Central: Mapa Oficial */}
          <div className="lg:col-span-6 bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[500px]">
            <div className="absolute top-6 left-6 z-20 bg-white/90 p-3 rounded-xl shadow-sm border border-slate-100">
              <h2 className="text-xs font-black text-[#00205B] uppercase tracking-wider flex items-center gap-2"><Activity className="w-4 h-4 text-[#FE5000]"/> Cobertura Territorial</h2>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{event.state}</p>
            </div>
            
            <div className="w-full h-[500px] mt-4 relative z-10">
              <ComposableMap
                xmlns="http://www.w3.org/2000/svg"
                projection="geoMercator"
                projectionConfig={{ scale: 2760, center: [-66.5, 6.8] }}
                viewBox="0 0 1000 750"
                className="w-full h-auto origin-center transition-transform duration-1000"
                style={{ overflow: 'visible', filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.4))' }}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const isActive = normalizeStateName(geo.properties.ESTADO || geo.properties.NAME_1) === eventStateNormalized;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          style={{
                            default: {
                              fill: isActive ? '#FE5000' : '#1E293B',
                              stroke: isActive ? '#CC4000' : '#64748B',
                              strokeWidth: isActive ? 1.2 : 0.75,
                              outline: 'none',
                              transition: 'all 250ms',
                            },
                            hover: {
                              fill: isActive ? '#FE5000' : '#334155',
                              stroke: isActive ? '#CC4000' : '#94A3B8',
                              strokeWidth: 1.2,
                              outline: 'none',
                            },
                            pressed: {
                              fill: isActive ? '#CC4000' : '#475569',
                              outline: 'none',
                            }
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
                        {/* Radar bajo el camión */}
                        <div className="absolute bottom-2 w-10 h-10 bg-[#00205B] rounded-full animate-ping opacity-40" style={{ animationDuration: '2s' }}></div>
                        <div className="absolute bottom-4 w-6 h-6 bg-[#00205B] rounded-full animate-ping opacity-60" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                        
                        {/* Contenedor Flotante del Camión */}
                        <div className="relative flex flex-col items-center animate-bounce">
                          <div className="p-2 rounded-xl shadow-lg border border-white/20 bg-[#FE5000] shadow-[0_0_15px_rgba(254,80,0,0.8)]">
                            <Truck className="w-5 h-5 text-white" />
                          </div>
                          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#FE5000]"></div>
                        </div>
                      </div>
                    </foreignObject>
                    <text
                      textAnchor="middle"
                      y={-65}
                      style={{ fill: "#FE5000", fontSize: "14px", fontWeight: "900", filter: "drop-shadow(0px 2px 4px rgba(255,255,255,0.9))" }}
                    >
                      {event.state}
                    </text>
                  </Marker>
                )}
              </ComposableMap>
            </div>
          </div>

          {/* Columna Derecha: Feed de Transacciones */}
          <div className="lg:col-span-3 bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-[500px] lg:h-auto">
            <h2 className="text-sm font-black text-[#00205B] uppercase tracking-widest mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00205B]" /> Feed Transaccional
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">Últimos registros en tiempo real</p>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-[#FE5000] rounded-full animate-spin"></div>
                  <span className="text-xs font-bold uppercase tracking-widest">Conectando...</span>
                </div>
              ) : registros.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 opacity-50">
                  <Smartphone className="w-10 h-10" />
                  <span className="text-xs font-bold">Esperando registros...</span>
                </div>
              ) : (
                registros.map((r, i) => (
                  <div key={r.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#00205B] bg-[#00205B]/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        {r.cedula_identidad}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">
                        {new Date(r.fecha_registro).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium leading-relaxed bg-white p-2 rounded-lg border border-slate-100">
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
