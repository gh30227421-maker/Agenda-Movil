"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Lock, Mail, ArrowRight, Truck, Wifi, Unlock, AlertCircle, X } from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Loader from '@/components/ui/Loader';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, [user, router]);

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
        // ACTUALIZACIÓN AUTOMÁTICA DEL ÚLTIMO ACCESO
        await supabase.auth.updateUser({
          data: { ultimo_acceso: new Date().toISOString() }
        });

        // El control de sesión única (user_sessions) ahora es delegado a AuthContext
        // para evitar condiciones de carrera.

        // 2. Registrar la actividad de login
        await supabase.from('user_activity_logs').insert({
          user_id: data.user.id,
          email: data.user.email,
          action: 'Inicio de sesión',
          device_info: typeof window !== 'undefined' ? navigator.userAgent : 'Desconocido'
        });

        // El éxito se puede mantener en el toast normal ya que es una transición positiva
        showToast('Inicio de sesión exitoso', 'success');
        
        setIsSuccessTransition(true);
        setTimeout(() => {
          router.push('/');
        }, 2500);
      }
    } catch (error: any) {
      console.error('Error logging in:', error);
      
      let msg = error.message;
      // Mapeo de errores de Supabase al español
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

  // Si ya hay usuario, no mostramos el login (evita destello mientras redirige)
  if (user) return null;

  if (isSuccessTransition) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white">
        <Loader fullScreen text="Autenticando..." />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001A45] p-4 sm:p-8">
      
      {/* Mensaje de Error Centralizado Flotante */}
      {errorMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-500/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl shadow-red-500/20 border border-red-400/50 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 shrink-0 text-white" />
            <p className="font-bold text-sm flex-1 tracking-wide leading-tight">{errorMessage}</p>
            <button 
              type="button"
              onClick={() => setErrorMessage('')}
              className="p-1 hover:bg-red-600/80 rounded-full transition-colors shrink-0"
              title="Cerrar mensaje"
            >
              <X className="w-5 h-5 text-white/90" />
            </button>
          </div>
        </div>
      )}

      <div className={`w-full max-w-[500px] bg-[#001A45] md:bg-[#00205B] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden relative z-10 flex flex-col ${plusJakarta.className}`}>
          
          {/* Header Decorativo */}
          <div className="bg-[#00205B] pt-14 pb-10 px-8 md:px-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FE5000]/10 rounded-full blur-2xl -translate-x-5 translate-y-5"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative flex items-center justify-center w-full h-40 flex-shrink-0 mb-6">
                <img src="/unidad movil.png" alt="Unidad Móvil" className="w-56 h-auto object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.4)] hover:scale-105 transition-transform duration-500 relative z-20" />
              </div>
              <div className="flex flex-col text-center relative z-20">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide text-white font-[family-name:var(--font-montserrat)] uppercase leading-tight drop-shadow-md whitespace-nowrap mb-2">
                  Agenda Móvil
                </h1>
                <h2 className="text-xl md:text-2xl font-semibold text-white/90">
                  Inicio de sesión
                </h2>
                <div className="mt-2 text-sm md:text-base text-white font-medium">
                  {greeting ? (
                    <>
                      <span className="block mb-1 text-white/90">¡{greeting}, <strong className="text-white font-bold">Bienvenido</strong>!</span>
                      <span className="block text-blue-200/60 text-sm font-normal mt-1">Ingrese sus credenciales</span>
                    </>
                  ) : (
                    <span className="block text-blue-200/60 text-sm font-normal mt-1">Ingrese sus credenciales</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-8 md:px-10 bg-[#001A45] md:bg-[#00205B]">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-2">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                  <Mail className="w-5 h-5 text-blue-300/70" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#00153B] border border-white/10 text-white text-sm rounded-xl focus:ring-[#FE5000] focus:border-[#FE5000] block w-full ps-11 p-3.5 transition-colors placeholder-blue-300/40"
                  placeholder="usuario@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-2">Contraseña</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 start-0 flex items-center ps-3.5 cursor-pointer group z-10"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <Unlock className="w-5 h-5 text-blue-300/70 group-hover:text-[#FE5000] transition-colors" />
                  ) : (
                    <Lock className="w-5 h-5 text-blue-300/70 group-hover:text-[#FE5000] transition-colors" />
                  )}
                </button>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="bg-[#00153B] border border-white/10 text-white text-sm rounded-xl focus:ring-[#FE5000] focus:border-[#FE5000] block w-full ps-11 p-3.5 transition-colors placeholder-blue-300/40"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 text-white bg-[#FE5000] hover:bg-[#e04700] focus:ring-4 focus:outline-none focus:ring-[#FE5000]/30 font-bold rounded-xl text-sm px-5 py-3.5 text-center shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6 flex flex-col gap-2">
            <p className="text-xs text-blue-200/60 font-medium">
              Uso exclusivo para personal autorizado.
            </p>
            <p className="text-[11px] text-blue-200/40 font-medium tracking-wide">
              © 2026 Agenda Móvil - Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
