"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Lock, Mail, ArrowRight, Truck, Wifi } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    // Si el usuario ya está autenticado, lo redirigimos al inicio
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Por favor, ingresa tu correo y contraseña.', 'info');
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
        showToast('Inicio de sesión exitoso', 'success');
        router.push('/');
      }
    } catch (error: any) {
      console.error('Error logging in:', error);
      showToast(error.message || 'Credenciales inválidas', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si ya hay usuario, no mostramos el login (evita destello mientras redirige)
  if (user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001A45] p-4 sm:p-8">
      <div className="w-full max-w-md bg-[#001A45] md:bg-[#00205B] rounded-3xl shadow-2xl overflow-hidden border border-white/10">
        
        {/* Header Decorativo */}
        <div className="bg-[#00205B] p-10 text-center relative overflow-hidden border-b-4 border-[#FE5000]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FE5000]/10 rounded-full blur-2xl -translate-x-5 translate-y-5"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative flex items-center justify-center w-20 h-20 flex-shrink-0 mb-4">
              <Wifi className="absolute -top-2 w-10 h-10 text-[#FE5000] animate-pulse drop-shadow-md" />
              <Truck className="absolute bottom-0 w-16 h-16 text-[#FE5000] drop-shadow-md" />
            </div>
            <div className="flex flex-col text-center">
              <h1 className="text-4xl font-black tracking-tighter text-white font-[family-name:var(--font-montserrat)] uppercase leading-none drop-shadow-sm">
                Agenda Móvil
              </h1>
              <span className="text-[#FE5000] font-bold text-sm tracking-[0.2em] uppercase font-[family-name:var(--font-montserrat)] mt-2">
                Gestión en Vivo
              </span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-8">
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
                  placeholder="usuario@bnc.com.ve"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-100 mb-2">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                  <Lock className="w-5 h-5 text-blue-300/70" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-xs text-blue-200/60 font-medium">
              Uso exclusivo para personal autorizado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
