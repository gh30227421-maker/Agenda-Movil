"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertCircle, Send, UserPlus, UserCheck, Circle, Wifi, Truck, ChevronDown } from 'lucide-react';

const OPTIONS = {
  cuentas: ['NIVEL 1', 'NIVEL 2', 'TIPO A $', 'TIPO B $', 'AHORRO', 'AHORROS NARANJA'],
  tdd: ['511 PRIMERA VEZ', '518 REPOSICION', '522 MIGRACION BNC', '570 MIGRACION BOD', 'IVSS 523'],
  otras: ['AFILIACIÓN BNCNET', 'AFILIACIÓN SERVICIO PARA P2P', 'ASOCIACION TDD', 'CAMBIO ESTATUS TDD', 'RESETEO DE CLAVE ATPW', 'DESBLOQUEO BNCNET', 'RESETEO CLAVE ATPW'],
  tdc: ['SOLICITUD DE MASTERCARD GOLD DEBIT INTERNACIONAL', 'ENTREGA DE MASTERCARD GOLD DEBIT INTERNACIONAL', 'SOLICITUD DE TDC MONEDA NACIONAL', 'ENTREGA DE TDC MONEDA NACIONAL']
};

export default function CapturaFormClient({ eventId }: { eventId: string }) {
  const [tipoDoc, setTipoDoc] = useState('V');
  const [cedula, setCedula] = useState('');
  const [tipoCliente, setTipoCliente] = useState<'CLIENTE NUEVO' | 'ACTUALIZACION' | null>(null);
  
  const [cuentas, setCuentas] = useState<string[]>([]);
  const [tdd, setTdd] = useState<string | null>(null);
  const [tdcs, setTdcs] = useState<string[]>([]);
  const [otras, setOtras] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>('JORNADA BNC MÓVIL');

  React.useEffect(() => {
    const fetchEventName = async () => {
      try {
        const { data } = await supabase.from('events').select('event_name').eq('id', eventId).maybeSingle();
        if (data && data.event_name) {
          setEventName(data.event_name);
        }
      } catch (err) {
        console.error("Error fetching event name:", err);
      }
    };
    fetchEventName();
  }, [eventId]);

  const handleTipoCliente = (tipo: 'CLIENTE NUEVO' | 'ACTUALIZACION') => {
    setTipoCliente(tipo);
    if (tipo === 'CLIENTE NUEVO') {
      setCuentas(['NIVEL 1']);
      setTdd('511 PRIMERA VEZ');
      setOtras(['AFILIACIÓN BNCNET', 'AFILIACIÓN SERVICIO PARA P2P']);
      setTdcs([]);
    } else {
      setCuentas([]);
      setTdd(null);
      setOtras([]);
      setTdcs([]);
    }
  };

  const toggleOption = (list: string[], setList: (l: string[]) => void, value: string) => {
    if (list.includes(value)) {
      setList(list.filter(v => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula || !tipoCliente) {
      setError('Cédula y tipo de solicitud son obligatorios.');
      return;
    }

    setLoading(true);
    setError(null);

    const cedulaCompleta = `${tipoDoc}-${cedula}`;

    try {
      const { error: insertError } = await supabase.from('registros_en_vivo').insert({
        event_id: eventId,
        cedula_identidad: cedulaCompleta,
        tipo_solicitud: tipoCliente,
        modulo_cuenta: cuentas.join(';'),
        modulo_tdd: tdd || '',
        modulo_tdc_opcional: tdcs.join(';'),
        modulo_otras_operaciones: otras.join(';')
      });

      if (insertError) throw insertError;

      setSuccess(true);
      
      // Reset form after 2.5s
      setTimeout(() => {
        setSuccess(false);
        setCedula('');
        setTipoDoc('V');
        setTipoCliente(null);
        setCuentas([]);
        setTdd(null);
        setTdcs([]);
        setOtras([]);
      }, 2500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al guardar el registro. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 flex flex-col p-4 py-8 overflow-y-auto w-full h-full">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden shrink-0 mb-8">
        <div className="bg-[#00205B] p-8 text-center relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-700/40 via-transparent to-transparent"></div>
          <div className="relative flex items-center justify-center w-16 h-16 flex-shrink-0 mb-4 z-10">
            <Wifi className="absolute -top-1 w-8 h-8 text-[#FE5000] animate-pulse drop-shadow-md" />
            <Truck className="absolute bottom-0 w-12 h-12 text-[#FE5000] drop-shadow-md" />
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest relative z-10">{eventName}</h1>
          <p className="text-blue-200 text-sm mt-2 relative z-10">Registro de Operaciones en Campo</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start gap-2 border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success ? (
            <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#00205B]">¡Registro Exitoso!</h2>
              <p className="text-slate-500 text-center mt-2 text-sm">El cliente ha sido procesado y contabilizado en tiempo real.</p>
            </div>
          ) : (
            <>
              {/* Identificación */}
              <div className="relative z-20">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cédula de Identidad</label>
                <div className="flex gap-2">
                  <CustomDocSelect value={tipoDoc} onChange={setTipoDoc} />
                  <input
                    type="number"
                    placeholder="12345678"
                    value={cedula}
                    onChange={e => setCedula(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[#00205B] font-bold focus:outline-none focus:ring-2 focus:ring-[#FE5000]/50 focus:border-[#FE5000] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Tipo de Solicitud */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Solicitud</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTipoCliente('CLIENTE NUEVO')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      tipoCliente === 'CLIENTE NUEVO' ? 'border-[#FE5000] bg-[#FE5000]/10 text-[#FE5000]' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <UserPlus className="w-6 h-6" />
                    <span className="font-bold text-[11px] uppercase text-center">Cliente Nuevo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTipoCliente('ACTUALIZACION')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      tipoCliente === 'ACTUALIZACION' ? 'border-[#00205B] bg-[#00205B]/10 text-[#00205B]' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <UserCheck className="w-6 h-6" />
                    <span className="font-bold text-[11px] uppercase text-center">Actualización</span>
                  </button>
                </div>
              </div>

              {/* Módulos */}
              <div className="space-y-4">
                <OptionGroup 
                  title="Módulo Cuentas (Múltiple)" 
                  options={OPTIONS.cuentas} 
                  selected={cuentas} 
                  onChange={(val) => toggleOption(cuentas, setCuentas, val)} 
                />
                
                <RadioGroup 
                  title="Módulo TDD (Única)" 
                  options={OPTIONS.tdd} 
                  selected={tdd} 
                  onChange={setTdd} 
                />
                
                <OptionGroup 
                  title="Otras Operaciones (Múltiple)" 
                  options={OPTIONS.otras} 
                  selected={otras} 
                  onChange={(val) => toggleOption(otras, setOtras, val)} 
                />
                
                <OptionGroup 
                  title="Módulo TDC (Opcional - Múltiple)" 
                  options={OPTIONS.tdc} 
                  selected={tdcs} 
                  onChange={(val) => toggleOption(tdcs, setTdcs, val)} 
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-[#00205B] hover:bg-[#00153B] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-lg shadow-blue-900/20"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-5 h-5" /> Enviar Registro
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function OptionGroup({ title, options, selected, onChange }: { title: string, options: string[], selected: string[], onChange: (val: string) => void }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <h3 className="text-xs font-bold text-[#00205B] uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex flex-col gap-2">
        {options.map(opt => {
          const isSelected = selected.includes(opt);
          return (
            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#FE5000] border-[#FE5000]' : 'bg-white border-slate-300 group-hover:border-[#FE5000]'}`}>
                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-[13px] leading-tight font-medium ${isSelected ? 'text-[#00205B]' : 'text-slate-600'}`}>{opt}</span>
              <input type="checkbox" className="hidden" checked={isSelected} onChange={() => onChange(opt)} />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function RadioGroup({ title, options, selected, onChange }: { title: string, options: string[], selected: string | null, onChange: (val: string) => void }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <h3 className="text-xs font-bold text-[#00205B] uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex flex-col gap-2">
        {options.map(opt => {
          const isSelected = selected === opt;
          return (
            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-[#FE5000]' : 'bg-white border-slate-300 group-hover:border-[#FE5000]'}`}>
                {isSelected && <Circle className="w-2.5 h-2.5 fill-[#FE5000] text-[#FE5000]" />}
              </div>
              <span className={`text-[13px] leading-tight font-medium ${isSelected ? 'text-[#00205B]' : 'text-slate-600'}`}>{opt}</span>
              <input type="radio" className="hidden" checked={isSelected} onChange={() => onChange(opt)} />
            </label>
          );
        })}
        {selected && (
          <button 
            type="button" 
            onClick={() => onChange('')}
            className="text-[11px] text-slate-400 font-medium hover:text-[#FE5000] w-max mt-2 transition-colors"
          >
            Quitar selección
          </button>
        )}
      </div>
    </div>
  );
}

function CustomDocSelect({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const options = ['V', 'E', 'J'];

  return (
    <div className="relative w-[90px]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className={`w-full flex items-center justify-between bg-slate-50 border rounded-xl px-4 py-3 text-[#00205B] font-bold transition-all ${
          isOpen ? 'border-[#FE5000] ring-2 ring-[#FE5000]/50' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span>{value}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#FE5000]' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-center text-[15px] font-bold transition-colors ${
                value === opt ? 'bg-[#FE5000]/10 text-[#FE5000]' : 'text-slate-600 hover:bg-slate-50 hover:text-[#00205B]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
