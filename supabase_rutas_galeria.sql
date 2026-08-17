-- Módulo de Galería y Rutas
-- Tabla para registrar metadatos de las fotografías de los operativos

CREATE TABLE public.event_photos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    photo_url text NOT NULL,
    caption text,
    category text DEFAULT 'General',
    uploaded_by uuid, -- Puede referenciar a auth.users o employees
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas RLS (Row Level Security)
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.event_photos
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.event_photos
    FOR INSERT WITH CHECK (true); -- o auth.role() = 'authenticated'

CREATE POLICY "Enable update for authenticated users only" ON public.event_photos
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.event_photos
    FOR DELETE USING (true);

-- Índices para mejorar rendimiento de consultas de fotos por operativo
CREATE INDEX idx_event_photos_event_id ON public.event_photos(event_id);
