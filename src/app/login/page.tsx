"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle, X } from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Loader from '@/components/ui/Loader';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isSuccessTransition, setIsSuccessTransition] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [greeting, setGreeting] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    // Si el usuario ya está autenticado, lo redirigimos al inicio
    if (user) {
      router.push('/');
    }

    // Cargar correo recordado si existe
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('bnc_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, [user, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSupportModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // Limpiar errores previos
    
    if (!email || !password) {
      setErrorMessage('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Guardar o limpiar preferencia de recordar correo
        if (typeof window !== 'undefined') {
          if (rememberMe) {
            localStorage.setItem('bnc_remembered_email', email);
          } else {
            localStorage.removeItem('bnc_remembered_email');
          }
        }

        // 1. Actualización automática de último acceso
        await supabase.auth.updateUser({
          data: { ultimo_acceso: new Date().toISOString() }
        });

        // 2. Registrar la actividad de login
        await supabase.from('user_activity_logs').insert({
          user_id: data.user.id,
          email: data.user.email,
          action: 'Inicio de sesión',
          device_info: typeof window !== 'undefined' ? navigator.userAgent : 'Desconocido'
        });

        showToast('Inicio de sesión exitoso', 'success');
        
        setIsSuccessTransition(true);
        setTimeout(() => {
          router.push('/');
        }, 2200);
      }
    } catch (error: any) {
      console.error('Error logging in:', error);
      
      let msg = error.message;
      if (msg === 'Invalid login credentials') {
        msg = 'Correo o contraseña incorrectos.';
      } else if (msg === 'Email not confirmed') {
        msg = 'Por favor, confirma tu correo electrónico antes de iniciar sesión.';
      } else if (msg === 'User not found' || msg?.includes('not found')) {
        msg = 'Usuario no encontrado.';
      } else if (msg?.includes('fetch') || msg?.includes('network')) {
        msg = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
      } else if (msg) {
        msg = 'Credenciales inválidas o acceso denegado.';
      } else {
        msg = 'Ocurrió un error al intentar iniciar sesión.';
      }
      
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) return null;

  if (isSuccessTransition) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white">
        <Loader fullScreen text="Autenticando..." />
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 w-full h-full flex flex-col lg:flex-row bg-white overflow-y-auto lg:overflow-hidden ${plusJakarta.className}`}>
      
      {/* Mensaje de Error Centralizado Flotante */}
      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-500/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-red-500/25 border border-red-400/50 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-white" />
            <p className="font-bold text-xs sm:text-sm flex-1 tracking-wide leading-tight">{errorMessage}</p>
            <button 
              type="button"
              onClick={() => setErrorMessage('')}
              className="p-1 hover:bg-red-600/80 rounded-full transition-colors shrink-0"
              title="Cerrar mensaje"
            >
              <X className="w-4 h-4 text-white/90" />
            </button>
          </div>
        </div>
      )}

      {/* Lado Izquierdo: Formulario de Login */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 bg-white z-10">
        
        {/* Cabecera Superior */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          {/* Logo BNC + Separador + Oficina Móvil */}
          <div className="flex items-center">
            <img 
              src="/bnc-logo.png" 
              alt="BNC" 
              className="h-14 sm:h-16 lg:h-18 w-auto object-contain drop-shadow-xs" 
            />
            <div className="h-11 sm:h-12 w-[1.5px] bg-slate-200 mx-3.5 sm:mx-4.5" />
            <div className="flex flex-col">
              <span className="text-sm sm:text-base lg:text-lg font-black tracking-wider text-[#00205B] leading-tight uppercase">
                OFICINA
              </span>
              <span className="text-sm sm:text-base lg:text-lg font-normal tracking-wider text-[#00205B] leading-tight uppercase">
                MÓVIL
              </span>
            </div>
          </div>

          {/* Subtítulos Organizacionales a la Derecha */}
          <div className="text-right">
            <span className="block text-xs sm:text-sm lg:text-[14px] font-extrabold tracking-wider text-[#00205B] uppercase leading-tight">
              VPE. BANCA COMERCIAL
            </span>
            <span className="block text-[10px] sm:text-xs lg:text-[11.5px] font-bold text-slate-500 tracking-wider uppercase leading-tight mt-0.5">
              VP. ADMINISTRACIÓN DE AGENCIAS
            </span>
          </div>
        </div>

        {/* Formulario Central */}
        <div className="w-full max-w-[430px] mx-auto my-auto py-8 lg:py-10">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-[#00205B] tracking-tight mb-2">
              Agenda Móvil
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              ¡{greeting || 'Bienvenido'}, <strong className="text-slate-800 font-bold">Bienvenido</strong>! Ingrese sus credenciales para acceder.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Campo Correo */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                CORREO ELECTRÓNICO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 focus:border-[#FE5000] focus:bg-white focus:ring-4 focus:ring-[#FE5000]/10 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none font-medium"
                  placeholder="usuario@bnc.com.ve"
                  required
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                CONTRASEÑA
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full bg-[#F8FAFC] border border-slate-200 focus:border-[#FE5000] focus:bg-white focus:ring-4 focus:ring-[#FE5000]/10 rounded-xl py-3 pl-10 pr-10 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Fila Recordar Usuario y Acceso SSL */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#FE5000] focus:ring-[#FE5000] cursor-pointer accent-[#FE5000]"
                />
                <span className="text-xs text-slate-600 font-medium">Recordar usuario</span>
              </label>

              <div className="flex items-center gap-1 text-xs text-[#009639] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#009639]" />
                <span>Acceso Seguro SSL</span>
              </div>
            </div>

            {/* Botón de Iniciar Sesión Naranja BNC */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FE5000] hover:bg-[#E04700] active:scale-[0.99] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-[#FE5000]/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-sm">Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Enlace Soporte */}
          <div className="text-center pt-5">
            <button 
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="text-xs text-slate-500 hover:text-[#00205B] font-semibold transition-colors cursor-pointer"
            >
              ¿Problemas para acceder? Contactar a Soporte
            </button>
          </div>
        </div>

        {/* Pie de Página */}
        <div className="pt-6 border-t border-slate-100 text-center space-y-1">
          <p className="text-[11px] text-slate-500 font-medium">
            Uso exclusivo y confidencial de la VP. Administración de Agencias.
          </p>
          <p className="text-[10px] text-slate-400 font-normal">
            © 2026 Agenda Móvil - Todos los derechos reservados.
          </p>
        </div>

      </div>

      {/* Lado Derecho: Showcase Visual de la Unidad Móvil */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0]/40 border-l border-slate-200/80 flex-col items-center justify-center p-12 xl:p-16 relative overflow-hidden">
        
        {/* Marca de Agua BNC de Fondo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.035]">
          <img 
            src="/bnc-logo.png" 
            alt="" 
            className="w-[125%] max-w-[680px] grayscale object-contain" 
          />
        </div>

        {/* Resplandores Ambientales Suaves */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[#00205B]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#FE5000]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Showcase Central */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full">
          
          {/* Imagen de la Unidad Móvil con Sombra y Efecto Flotante */}
          <div className="relative mb-10 group">
            <div className="absolute -inset-6 bg-gradient-to-tr from-[#00205B]/15 via-transparent to-[#FE5000]/15 rounded-full blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-700" />
            <img
              src="/unidad movil.png"
              alt="Unidad Móvil BNC"
              className="relative z-10 w-80 sm:w-96 lg:w-[440px] xl:w-[480px] h-auto object-contain drop-shadow-[0_25px_40px_rgba(0,32,91,0.22)] transition-transform duration-700 hover:scale-[1.03]"
            />
          </div>
          
          <h3 className="text-2xl sm:text-3xl font-black text-[#00205B] tracking-tight">
            Despliegue Operativo BNC
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2.5 max-w-md leading-relaxed">
            Monitoreo, control de rutas y gestión integral de operaciones móviles a nivel nacional.
          </p>

          <div className="mt-8 flex items-center gap-2.5 px-4 py-2 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-full shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#009639] animate-pulse" />
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Sistema Operativo en Línea
            </span>
          </div>

        </div>

      </div>

      {/* Modal Flotante de Soporte */}
      {showSupportModal && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowSupportModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl max-w-sm w-full border border-slate-100 relative animate-in zoom-in-95 duration-200 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-xl font-extrabold text-[#00205B] tracking-tight">
                  Soporte
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Seleccione el canal de su preferencia:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opciones de Contacto */}
            <div className="mt-5 space-y-3">
              {/* Opción 1: WhatsApp Directo */}
              <a
                href="https://wa.me/584123992401?text=Hola%2C%20necesito%20soporte%20para%20el%20acceso%20a%20la%20Agenda%20M%C3%B3vil%20BNC"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 hover:bg-emerald-50/80 hover:border-emerald-300 transition-all duration-200 group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#00D757] flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.889-9.885 9.889m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      WhatsApp Directo
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      +58 412-3992401
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Rápido
                </span>
              </a>

              {/* Opción 2: Correo Electrónico */}
              <a
                href="mailto:gh30227421@gmail.com?subject=Soporte%20Acceso%20-%20Agenda%20M%C3%B3vil%20BNC"
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-blue-200/80 bg-blue-50/20 hover:bg-blue-50/70 hover:border-blue-300 transition-all duration-200 group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#00205B] flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#00205B] transition-colors">
                      Correo Electrónico
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      gh30227421@gmail.com
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Formal
                </span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
