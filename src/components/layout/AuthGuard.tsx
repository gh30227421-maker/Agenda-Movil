"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Loader from '@/components/ui/Loader';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si terminó de cargar y no hay usuario, y no estamos en la página de login
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  // Mientras carga la sesión, mostramos un pequeño loader para no mostrar la UI principal por error
  if (isLoading) {
    return <Loader fullScreen={true} text="Autenticando..." />;
  }

  // Si no hay usuario y no es la página de login, no renderizamos los children (evita destellos de UI protegida)
  if (!user && pathname !== '/login') {
    return null;
  }

  // Si todo está correcto (hay usuario o estamos en /login), renderizamos el contenido
  return <>{children}</>;
}
