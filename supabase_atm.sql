-- Script para añadir los campos de operaciones ATM a las métricas del evento.
-- Nota: La instrucción original mencionaba la tabla "events", pero las cifras en el sistema 
-- se almacenan en "event_metrics", por lo que los campos se añaden allí para mantener 
-- la integridad de los datos junto con el resto de cifras (Cuentas, TDD, Reclamos).

ALTER TABLE event_metrics ADD COLUMN atm_consultas INT DEFAULT 0;
ALTER TABLE event_metrics ADD COLUMN atm_retiros INT DEFAULT 0;
ALTER TABLE event_metrics ADD COLUMN atm_cambio_clave INT DEFAULT 0;
