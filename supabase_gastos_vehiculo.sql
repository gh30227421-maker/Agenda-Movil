-- Script para añadir los campos de traslado a los gastos de Unidad Móvil
-- Se añaden a la tabla event_expenses que centraliza todos los costos.

ALTER TABLE event_expenses ADD COLUMN gasto_combustible_bs NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE event_expenses ADD COLUMN distancia_km NUMERIC(10,2) DEFAULT 0.00;
