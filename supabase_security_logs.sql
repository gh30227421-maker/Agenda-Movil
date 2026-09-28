-- Tabla de Control de Sesiones Únicas
CREATE TABLE IF NOT EXISTS public.user_sessions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their session"
    ON public.user_sessions FOR ALL
    USING (auth.uid() = user_id);

-- Tabla de Registro de Actividad
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    device_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden insertar sus propios logs
CREATE POLICY "Users can insert their own logs"
    ON public.user_activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Solo los admins o el propio usuario pueden ver los logs
CREATE POLICY "Users and admins can view logs"
    ON public.user_activity_logs FOR SELECT
    USING (
      auth.uid() = user_id OR 
      (auth.jwt() ->> 'role') = 'admin' OR 
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );
