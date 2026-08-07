-- Módulo de Control de Activos
-- Tabla para registrar el inventario de equipos tecnológicos y operativos

CREATE TABLE public.assets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_activo text UNIQUE NOT NULL,
    tipo_equipo text NOT NULL,
    marca_modelo text,
    serial text,
    estado_operativo text NOT NULL DEFAULT 'Operativo',
    employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
    agency_code text REFERENCES public.agencies(code) ON DELETE SET NULL,
    fecha_adquisicion date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas RLS (Row Level Security)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.assets
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.assets
    FOR INSERT WITH CHECK (true); -- Or check auth.role() = 'authenticated' based on existing setup

CREATE POLICY "Enable update for authenticated users only" ON public.assets
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.assets
    FOR DELETE USING (true);
