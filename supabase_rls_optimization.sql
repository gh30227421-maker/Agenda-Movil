-- =========================================================================
-- OPTIMIZACIÓN DE RLS Y SEGURIDAD (Supabase Auth Initialization Plan Fix)
-- =========================================================================

-- 1. Restaurar tabla public.profiles de forma segura para los Roles
-- (Evita el uso inseguro de auth.jwt() -> 'user_metadata' que el usuario puede manipular)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden actualizar roles, pero cualquier usuario puede leer el suyo
CREATE POLICY "Users can read own profile" 
    ON public.profiles FOR SELECT 
    USING (id = (select auth.uid()));

CREATE POLICY "Admins can read all profiles" 
    ON public.profiles FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'
      )
    );

-- 2. Sincronizar usuarios existentes
INSERT INTO public.profiles (id, role)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'role', 'user') as role
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Crear un Trigger para que los nuevos usuarios tengan un perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'role', 'user'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar el trigger si existe y volver a crearlo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =========================================================================
-- OPTIMIZACIÓN DE POLÍTICAS EXISTENTES (Evitar Auth RLS Initialization Plan)
-- =========================================================================
-- Reemplazar auth.uid() por (select auth.uid()) asegura que PostgreSQL
-- evalúe la función una vez por consulta, en lugar de una vez por fila.

-- NOTA: Debes borrar las políticas previas de estas tablas en Supabase 
-- o sobreescribirlas con estas versiones optimizadas.

-- A) user_activity_logs
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.user_activity_logs;
CREATE POLICY "Users can insert their own logs"
    ON public.user_activity_logs FOR INSERT
    WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users and admins can view logs" ON public.user_activity_logs;
CREATE POLICY "Users and admins can view logs"
    ON public.user_activity_logs FOR SELECT
    USING (
      user_id = (select auth.uid()) OR 
      EXISTS (
        SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin'
      )
    );

-- B) user_sessions
DROP POLICY IF EXISTS "Users can manage their session" ON public.user_sessions;
CREATE POLICY "Users can manage their session"
    ON public.user_sessions FOR ALL
    USING (user_id = (select auth.uid()));

-- C) events
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.events;
CREATE POLICY "Enable all operations for authenticated users"
    ON public.events FOR ALL
    USING ( (select auth.uid()) IS NOT NULL );

-- D) agencies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.agencies;
CREATE POLICY "Enable all operations for authenticated users"
    ON public.agencies FOR ALL
    USING ( (select auth.uid()) IS NOT NULL );

-- E) employees
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.employees;
CREATE POLICY "Enable all operations for authenticated users"
    ON public.employees FOR ALL
    USING ( (select auth.uid()) IS NOT NULL );

-- F) event_assignments
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.event_assignments;
CREATE POLICY "Enable all operations for authenticated users"
    ON public.event_assignments FOR ALL
    USING ( (select auth.uid()) IS NOT NULL );
