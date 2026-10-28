import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Cliente normal para verificar el token JWT de la petición
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  try {
    // 1. Extraer ID del payload del JWT y validar expiración
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn('[API admin/users] Token expirado');
      return null;
    }

    const userId = payload.sub;
    if (!userId) return null;

    // 2. Intentar validar con el cliente auth estándar primero
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        const isAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
        if (isAdmin) return user;
      }
    } catch {
      // Ignorar error de sesión transitoria
    }

    // 3. Fallback: validar directamente con supabaseAdmin por ID de usuario
    // Esto resuelve el caso donde la sesión en auth.sessions fue reiniciada o invalidada pero el token sigue vigente
    const { data, error: adminErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (adminErr || !data?.user) {
      console.error('[API admin/users] Usuario no encontrado en Supabase:', adminErr);
      return null;
    }

    const adminUser = data.user;
    const isAdmin = adminUser.user_metadata?.role === 'admin' || adminUser.app_metadata?.role === 'admin';
    if (!isAdmin) {
      console.warn('[API admin/users] Usuario no tiene permisos de administrador:', adminUser.email);
      return null;
    }

    return adminUser;
  } catch (err) {
    console.error('[API admin/users] Error inesperado en verifyAdmin:', err);
    return null;
  }
}

export async function GET(request: Request) {
  const adminUser = await verifyAdmin(request);
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sanitizamos los datos antes de enviarlos
  const users = data.users.map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.user_metadata?.ultimo_acceso || u.last_sign_in_at,
    role: u.user_metadata?.role || 'user',
  }));

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const adminUser = await verifyAdmin(request);
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, password, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: role || 'user' }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: { id: data.user.id, email: data.user.email } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
  }
}
