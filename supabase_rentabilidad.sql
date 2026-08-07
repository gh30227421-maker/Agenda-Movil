-- Create the rentability tracking table
CREATE TABLE public.event_rentability_tracking (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    month_date date NOT NULL, -- The first day of the tracking month (e.g., 2026-03-01)
    month_index integer NOT NULL, -- 1 to 6
    saldo_activo numeric(15, 2) DEFAULT 0,
    ingresos numeric(15, 2) DEFAULT 0,
    costos numeric(15, 2) DEFAULT 0,
    status text NOT NULL DEFAULT 'Pendiente', -- 'Pendiente', 'Cerrado'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, month_index)
);

-- Enable RLS
ALTER TABLE public.event_rentability_tracking ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write for demo purposes (adjust as needed)
CREATE POLICY "Allow authenticated read access" ON public.event_rentability_tracking FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON public.event_rentability_tracking FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON public.event_rentability_tracking FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON public.event_rentability_tracking FOR DELETE TO authenticated USING (true);

-- Also allow anon if your app doesn't strictly enforce auth (BNC mobile demo typically allows this)
CREATE POLICY "Allow anon read access" ON public.event_rentability_tracking FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert access" ON public.event_rentability_tracking FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON public.event_rentability_tracking FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow anon delete access" ON public.event_rentability_tracking FOR DELETE TO anon USING (true);
