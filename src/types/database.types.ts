export type EventStatus = 'Planificado' | 'En Proceso' | 'Culminado' | 'Cancelado';
export type EventType = 'Unidad Móvil' | 'Agencia Móvil' | 'Red de Agencias';
export type GastoStatus = 'Pendiente' | 'En Revisión' | 'Convalidado';

/**
 * Tabla: cost_centers (Catálogo de Centros de Costo)
 */
export interface CostCenterRow {
  id: string; // UUID
  code: string; // Ej: '001'
  name: string; // Ej: 'Caracas Central'
  region: string;
  zone: string;
  state: string;
  created_at?: string;
}

/**
 * Tabla: events (Jornadas / Operativos)
 */
export interface EventRow {
  id: string; // UUID
  type: EventType;
  cost_center_id: string; // FK a cost_centers
  event_name: string;
  location?: string;
  start_date: string;
  end_date: string;
  status: EventStatus;
  vp_solicitante?: string;
  responsable?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Tabla: cifras (Métricas operativas 1 a 1 con events)
 */
export interface CifrasRow {
  id: string; // UUID
  event_id: string; // FK a events (unique)
  cuentas_abiertas: number;
  tdd: number;
  reclamos: number;
  saldos_captados_bs: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Tabla: gastos (Estructura de costos 1 a 1 con events)
 */
export interface GastosRow {
  id: string; // UUID
  event_id: string; // FK a events (unique)
  alimentacion_bs: number;
  hospedaje_bs: number;
  transporte_bs: number;
  soporte_tecnico_bs: number;
  banca_electronica_bs: number;
  gastos_tributarios_bs: number;
  conductor_ayudante_bs: number;
  mantenimiento_limpieza_bs: number;
  tasa_bcv: number;
  total_usd: number;
  status: GastoStatus;
  created_at?: string;
  updated_at?: string;
}

/**
 * Vista Relacional Completa (Para el Front-End)
 * Equivalente a un select de Supabase:
 * supabase.from('events').select('*, cost_center_id(*), cifras(*), gastos(*)')
 */
export interface EventWithDetails extends Omit<EventRow, 'cost_center_id'> {
  cost_center: CostCenterRow;
  cifras?: Omit<CifrasRow, 'event_id' | 'id'>;
  gastos?: Omit<GastosRow, 'event_id' | 'id'>;
  // Campos derivados para compatibilidad temporal con UI
  saldoFinMesBs?: number;
  tasaBcvRentabilidad?: number;
}

export interface EmployeeRow {
  id: string; // UUID
  employee_code: string; // Ficha
  dni: string; // Cedula
  full_name: string;
  cargo: string;
  created_at?: string;
}

export interface EventAssignmentRow {
  id: string; // UUID
  event_id: string; // FK a events
  employee_id: string; // FK a employees
  role: string;
  status: 'Confirmado' | 'Pendiente';
  created_at?: string;
}
