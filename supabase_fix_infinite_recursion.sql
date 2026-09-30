-- 1. Crear una función SECURITY DEFINER para verificar si el usuario actual es admin
-- Esto se ejecuta saltando las políticas de RLS, por lo que evita el bucle infinito (Infinite Recursion).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Corregir las políticas de la tabla profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

CREATE POLICY "Admins can read all profiles" 
    ON public.profiles FOR SELECT 
    USING ( public.is_admin() );

-- 3. Corregir las políticas de user_activity_logs
DROP POLICY IF EXISTS "Users and admins can view logs" ON public.user_activity_logs;

CREATE POLICY "Users and admins can view logs"
    ON public.user_activity_logs FOR SELECT
    USING (
      user_id = (select auth.uid()) OR 
      public.is_admin()
    );
