import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Inyección de Cabeceras de Seguridad a nivel de Edge
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Opcional: Content Security Policy (Descomentar y ajustar según dependencias externas)
  // const csp = `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self' https://*.supabase.co;`;
  // response.headers.set('Content-Security-Policy', csp.replace(/\n/g, ''));

  // 2. Control de Acceso Básico (Edge Auth Guard)
  // NOTA: Como la app utiliza localStorage para la sesión (Supabase Client estándar), 
  // el token no siempre estará en las cookies de la petición inicial a menos que se migre a @supabase/ssr.
  // Por lo tanto, el bloqueo primario se mantiene en src/components/layout/AuthGuard.tsx
  // Sin embargo, podemos verificar si existe una cookie explícita de Supabase en el futuro:
  
  /*
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
  const isProtectedRoute = !isAuthRoute && request.nextUrl.pathname !== '/';
  
  const supabaseCookie = request.cookies.getAll().find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));
  
  if (isProtectedRoute && !supabaseCookie) {
    // Si estuviéramos usando cookies SSR, redirigiríamos aquí:
    // return NextResponse.redirect(new URL('/login', request.url));
  }
  */

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
