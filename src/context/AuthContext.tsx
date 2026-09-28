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

  // Control de sesión única (un dispositivo a la vez)
  useEffect(() => {
    if (!user) return;

    let localSessionId = localStorage.getItem('bnc_local_session_id');
    
    // Función para verificar la sesión
    const checkSession = async () => {
      try {
        const { data } = await supabase
          .from('user_sessions')
          .select('session_id')
          .eq('user_id', user.id)
          .single();
        
        if (data && localSessionId && data.session_id !== localSessionId) {
          // Si el ID en base de datos es distinto al local, han iniciado sesión en otro lado
          showToast('Tu sesión se cerró porque iniciaste sesión en otro dispositivo.', 'error');
          await supabase.auth.signOut();
        } else if (!data || (data && data.session_id === localSessionId)) {
          // Si no existe, o si es igual al nuestro, aseguramos que se mantenga
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

    // Escuchar cambios en tiempo real en user_sessions
    const channel = supabase.channel('user_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions', filter: `user_id=eq.${user.id}` }, (payload: any) => {
        if (payload.new && localSessionId && payload.new.session_id !== localSessionId) {
          showToast('Tu sesión se cerró porque iniciaste sesión en otro dispositivo.', 'error');
          supabase.auth.signOut();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
