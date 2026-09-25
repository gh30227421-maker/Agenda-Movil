-- Create table for Gestión en Vivo
CREATE TABLE IF NOT EXISTS public.registros_en_vivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cedula_identidad TEXT NOT NULL,
    tipo_solicitud TEXT NOT NULL,
    modulo_cuenta TEXT,
    modulo_tdd TEXT,
    modulo_tdc_opcional TEXT,
    modulo_otras_operaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.registros_en_vivo ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for the promoter form
CREATE POLICY "Allow public insert on registros_en_vivo" 
    ON public.registros_en_vivo 
    FOR INSERT 
    TO public 
    WITH CHECK (true);

-- Allow public read for the real-time dashboard
CREATE POLICY "Allow public select on registros_en_vivo" 
    ON public.registros_en_vivo 
    FOR SELECT 
    TO public 
    USING (true);

-- Enable Realtime for this table
-- Note: You might need to manually enable Realtime for this table in the Supabase Dashboard if this doesn't work.
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_en_vivo;

-- Table for active live session
CREATE TABLE IF NOT EXISTS public.live_config (
    id INT PRIMARY KEY DEFAULT 1,
    active_event_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.live_config (id, active_event_id) VALUES (1, NULL) ON CONFLICT DO NOTHING;
ALTER TABLE public.live_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read live_config" ON public.live_config FOR SELECT TO public USING (true);
CREATE POLICY "Allow public update live_config" ON public.live_config FOR UPDATE TO public USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_config;
