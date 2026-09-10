-- ==============================================================================
-- PLAN TÉCNICO DE REFACTORIZACIÓN - TABLA: event_metrics
-- ==============================================================================

-- 1. CREACIÓN DE TABLAS NORMALIZADAS Y SUS RELACIONES
-- Habilitar extensión UUID si no está activa (por defecto en Supabase lo está)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla 1: Cifras Operativas
CREATE TABLE IF NOT EXISTS public.cifras_operativas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    cuentas_abiertas INT DEFAULT 0,
    tdd INT DEFAULT 0,
    reclamos INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id)
);

-- Tabla 2: Saldos Financieros de Cierre
CREATE TABLE IF NOT EXISTS public.saldos_financieros_cierre (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    saldos_captados_bs NUMERIC(12,2) DEFAULT 0.00,
    saldo_cierre_divisas NUMERIC(12,2) DEFAULT 0.00,
    atm_consultas INT DEFAULT 0,
    atm_retiros INT DEFAULT 0,
    atm_cambio_clave INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id)
);

-- Habilitar Row Level Security (RLS) en ambas tablas
ALTER TABLE public.cifras_operativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saldos_financieros_cierre ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS de ejemplo (Ajustar según las políticas que tenía event_metrics)
-- Asumiendo acceso completo a usuarios autenticados para propósitos de la migración:
CREATE POLICY "Permitir lectura y escritura a todos en cifras_operativas" ON public.cifras_operativas
    FOR ALL USING (true);

CREATE POLICY "Permitir lectura y escritura a todos en saldos_financieros_cierre" ON public.saldos_financieros_cierre
    FOR ALL USING (true);

-- ==============================================================================
-- 2. SCRIPT DE MIGRACIÓN SEGURA CON TRANSACCIÓN
-- ==============================================================================
BEGIN;

-- Migrar hacia cifras_operativas
INSERT INTO public.cifras_operativas (event_id, cuentas_abiertas, tdd, reclamos, updated_at)
SELECT 
    event_id, 
    COALESCE(cuentas_abiertas, 0), 
    COALESCE(tdd, 0), 
    COALESCE(reclamos, 0), 
    COALESCE(updated_at, NOW())
FROM public.event_metrics
ON CONFLICT (event_id) DO NOTHING;

-- Migrar hacia saldos_financieros_cierre
INSERT INTO public.saldos_financieros_cierre (
    event_id, 
    saldos_captados_bs, 
    saldo_cierre_divisas, 
    atm_consultas, 
    atm_retiros, 
    atm_cambio_clave, 
    updated_at
)
SELECT 
    event_id, 
    COALESCE(saldos_captados_bs, 0), 
    COALESCE(saldo_cierre_divisas, 0), 
    COALESCE(atm_consultas, 0), 
    COALESCE(atm_retiros, 0), 
    COALESCE(atm_cambio_clave, 0), 
    COALESCE(updated_at, NOW())
FROM public.event_metrics
ON CONFLICT (event_id) DO NOTHING;

COMMIT;

-- ==============================================================================
-- 3. CONSULTAS DE VALIDACIÓN POST-MIGRACIÓN
-- ==============================================================================

-- A. Validación de Cifras Operativas
SELECT 
  'Original (event_metrics)' as fuente,
  COUNT(*) as total_registros,
  SUM(cuentas_abiertas) as sum_cuentas,
  SUM(tdd) as sum_tdd,
  SUM(reclamos) as sum_reclamos
FROM public.event_metrics
UNION ALL
SELECT 
  'Nueva (cifras_operativas)' as fuente,
  COUNT(*) as total_registros,
  SUM(cuentas_abiertas) as sum_cuentas,
  SUM(tdd) as sum_tdd,
  SUM(reclamos) as sum_reclamos
FROM public.cifras_operativas;

-- B. Validación de Saldos Financieros
SELECT 
  'Original (event_metrics)' as fuente,
  COUNT(*) as total_registros,
  SUM(saldos_captados_bs) as sum_captados_bs,
  SUM(saldo_cierre_divisas) as sum_cierre_divisas,
  SUM(atm_consultas) as sum_atm_consultas,
  SUM(atm_retiros) as sum_atm_retiros,
  SUM(atm_cambio_clave) as sum_atm_clave
FROM public.event_metrics
UNION ALL
SELECT 
  'Nueva (saldos_financieros)' as fuente,
  COUNT(*) as total_registros,
  SUM(saldos_captados_bs) as sum_captados_bs,
  SUM(saldo_cierre_divisas) as sum_cierre_divisas,
  SUM(atm_consultas) as sum_atm_consultas,
  SUM(atm_retiros) as sum_atm_retiros,
  SUM(atm_cambio_clave) as sum_atm_clave
FROM public.saldos_financieros_cierre;
