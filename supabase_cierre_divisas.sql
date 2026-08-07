-- Script para añadir la columna de Saldo de Cierre en Divisas
-- Nota: La instrucción original mencionaba "events" o la tabla de cierres.
-- Dado que la arquitectura de la aplicación almacena los saldos de fin de mes
-- (saldos_captados_bs) dentro de la tabla "event_metrics", 
-- añadimos la nueva columna allí para mantener la coherencia y persistencia.

ALTER TABLE event_metrics ADD COLUMN saldo_cierre_divisas NUMERIC(12,2) DEFAULT 0.00;
