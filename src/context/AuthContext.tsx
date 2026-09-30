"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from './ToastContext';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  logActivity: (action: string, details?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionConflict, setSessionConflict] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Obtenemos la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAdmin(session?.user?.user_metadata?.role === 'admin');
      setIsLoading(false);
    });

    // Escuchamos los cambios en la sesión (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAdmin(session?.user?.user_metadata?.role === 'admin');
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Control de sesión única con Heartbeat e Inactividad
  useEffect(() => {
    if (!user) return;

    let localSessionId = localStorage.getItem('bnc_local_session_id');
    
    // Función para verificar la sesión y latido
    const checkSession = async () => {
      try {
        const { data } = await supabase
          .from('user_sessions')
          .select('session_id, last_active')
          .eq('user_id', user.id)
          .single();
        
        if (data && localSessionId && data.session_id !== localSessionId) {
          // Evaluar inactividad (si la última actividad fue hace más de 15 minutos)
          const lastActive = new Date(data.last_active).getTime();
          const now = new Date().getTime();
          const diffMinutes = (now - lastActive) / (1000 * 60);

          if (diffMinutes > 15) {
             // La sesión anterior ha expirado por inactividad, tomamos el control
             await forceTakeover();
          } else {
             // La sesión anterior está activa, mostramos modal para forzar el cierre
             setSessionConflict(true);
          }
        } else {
          // Si no existe, o si es igual al nuestro, aseguramos que se mantenga y actualizamos latido
          if (!localSessionId) {
             localSessionId = crypto.randomUUID();
             localStorage.setItem('bnc_local_session_id', localSessionId);
          }
          await supabase.from('user_sessions').upsert({
            user_id: user.id,
            session_id: localSessionId,
            last_active: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("Error al chequear sesión:", error);
      }
    };

    checkSession();

    // Heartbeat: Envía un latido cada 5 minutos si no hay conflicto
    const heartbeat = setInterval(async () => {
      if (!sessionConflict && localSessionId) {
        try {
          await supabase.from('user_sessions').update({
            last_active: new Date().toISOString()
          }).eq('session_id', localSessionId);
        } catch(e) {}
      }
    }, 5 * 60 * 1000);

    // Limpieza al cerrar el navegador (BeforeUnload)
    const handleBeforeUnload = () => {
      if (!sessionConflict && localSessionId) {
        // Ejecutamos limpieza de forma silenciosa para intentar liberar la sesión
        supabase.from('user_sessions').delete().eq('session_id', localSessionId).then();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Escuchar cambios en tiempo real en user_sessions
    const channel = supabase.channel('user_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions', filter: `user_id=eq.${user.id}` }, (payload: any) => {
        if (payload.new && localSessionId && payload.new.session_id !== localSessionId) {
          // Alguien inició sesión en otro dispositivo o forzó el cierre de esta sesión
          setSessionConflict(true);
        }
      })
      .subscribe();

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      supabase.removeChannel(channel);
    };
  }, [user]);

  const forceTakeover = async () => {
    if (!user) return;
    const newSessionId = crypto.randomUUID();
    localStorage.setItem('bnc_local_session_id', newSessionId);
    
    try {
      await supabase.from('user_sessions').upsert({
        user_id: user.id,
        session_id: newSessionId,
        last_active: new Date().toISOString()
      });
      setSessionConflict(false);
      showToast('Sesión recuperada exitosamente', 'success');
      // Forzar recarga limpia para asegurar estado correcto
      window.location.reload();
    } catch (e) {
      showToast('Error al forzar sesión', 'error');
    }
  };

  const handleConflictLogout = async () => {
    setSessionConflict(false);
    await signOut();
  };

  // Función global para registrar actividades
  const logActivity = async (action: string, details?: string) => {
    if (!user) return;
    try {
      // Obtener info básica del dispositivo para el log
      const deviceInfo = typeof window !== 'undefined' ? navigator.userAgent : 'Desconocido';
      await supabase.from('user_activity_logs').insert({
        user_id: user.id,
        email: user.email,
        action,
        details,
        device_info: deviceInfo
      });
    } catch (e) {
      console.error('Error logging activity', e);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      // Limpiamos la sesión en BD antes de salir
      const localSessionId = localStorage.getItem('bnc_local_session_id');
      if (localSessionId) {
        await supabase.from('user_sessions').delete().eq('session_id', localSessionId);
        localStorage.removeItem('bnc_local_session_id');
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showToast('Sesión cerrada correctamente', 'info');
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Error al cerrar sesión', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isLoading, signOut, logActivity }}>
      {children}
      
      {/* Modal de Resolución de Conflicto de Sesiones */}
      {sessionConflict && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1a1a2e] border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.2)] text-center text-white">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">Sesión Activa Detectada</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Hemos detectado que tu cuenta está abierta en otro equipo o navegador. ¿Deseas forzar el cierre de esa sesión y continuar aquí?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={forceTakeover}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transform transition active:scale-95 shadow-lg shadow-blue-500/25"
              >
                Cerrar sesión anterior y Continuar
              </button>
              <button
                onClick={handleConflictLogout}
                className="w-full px-6 py-3 bg-transparent border border-gray-600 text-gray-300 font-medium rounded-xl hover:bg-gray-800 transition"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
