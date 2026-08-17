export type EventStatus = 'Planificado' | 'En Proceso' | 'Culminado' | 'Cancelado';
export type EventType = 'Unidad Móvil' | 'Agencia Móvil' | 'Red de Agencias';

export interface Cifras {
  cuentasAbiertas: number;
  tdd: number;
  reclamos: number;
  saldosCaptadosBs: number; // Saldos totales captados de clientes en Bs.
  atmConsultas?: number;
  atmRetiros?: number;
  atmCambioClave?: number;
  saldoCierreDivisas?: number; // Saldo de cierre ingresado directamente en divisas
}

export interface Gastos {
  // Gastos de Personal
  alimentacionBs: number;
  hospedajeBs: number;
  transporteBs: number;
  // Gastos Especiales
  soporteTecnicoBs: number;
  bancaElectronicaBs: number;
  gastosTributariosBs: number;
  conductorAyudanteBs: number;
  mantenimientoLimpiezaBs: number;
  // Metadata
  tasaBcv: number; // Tasa BCV aplicada a este gasto (puede diferir de la del cierre)
  gastoCombustibleBs?: number;
  distanciaKm?: number;
  totalUsd: number;
  estado: 'Pendiente' | 'En Revisión' | 'Convalidado';
}

export interface AgendaEvent {
  id: string;
  type: EventType;
  agencyCode: string;
  eventName: string;
  location?: string;
  estadoOperativo?: string;
  state: string;
  region: string;
  zone?: string;
  startDate: string;
  endDate: string;
  segments?: { startDate: string; endDate: string }[];
  status: EventStatus;
  vpSolicitante?: string;
  responsable?: string;
  cifras?: Cifras;
  gastos?: Gastos;
  saldoFinMesBs?: number;
  tasaBcvRentabilidad?: number;
}

export interface CostCenter {
  code: string;
  name: string;
  region: string;
  zone: string;
  state: string;
}

export const costCenters: CostCenter[] = [
  { code: '001', name: 'Caracas Central', region: 'Región Capital', zone: 'Zona Metropolitana', state: 'Distrito Capital' },
  { code: '002', name: 'Valencia Centro', region: 'Región Central', zone: 'Carabobo', state: 'Carabobo' },
  { code: '003', name: 'Maracaibo Norte', region: 'Región Occidental', zone: 'Zulia', state: 'Zulia' },
  { code: '004', name: 'Barquisimeto Sur', region: 'Región Centro‑Occidental', zone: 'Lara', state: 'Lara' },
  { code: '005', name: 'Mérida Andina', region: 'Región Occidental', zone: 'Mérida', state: 'Mérida' },
  { code: '006', name: 'Puerto La Cruz', region: 'Región Oriental', zone: 'Anzoátegui', state: 'Anzoátegui' },
  { code: '007', name: 'Cumana Costera', region: 'Región Oriental', zone: 'Sucre', state: 'Sucre' },
  { code: '008', name: 'Ciudad Guayana', region: 'Región Guayana', zone: 'Bolívar', state: 'Bolívar' },
  { code: '009', name: 'San Cristóbal', region: 'Región Occidental', zone: 'Táchira', state: 'Táchira' },
  { code: '010', name: 'San Juan de los Morros', region: 'Región Los Llanos', zone: 'Guárico', state: 'Guárico' },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

export interface RentabilityTracking {
  id: string;
  eventId: string;
  monthDate: string; // YYYY-MM-DD representing the first day of the month
  monthIndex: number; // 1 to 6
  saldoActivo: number;
  ingresos: number;
  costos: number;
  status: 'Pendiente' | 'Cerrado';
}
const formatMonth = String(currentMonth + 1).padStart(2, '0');

export const initialMockEvents: AgendaEvent[] = [
  {
    id: 'EV-001',
    type: 'Unidad Móvil',
    agencyCode: '001 - Caracas Central',
    eventName: 'Crece Emprendedores',
    state: 'Distrito Capital',
    region: 'Región Capital',
    startDate: `${currentYear}-${formatMonth}-10`,
    endDate: `${currentYear}-${formatMonth}-12`,
    status: 'Culminado',
    cifras: { cuentasAbiertas: 120, tdd: 110, reclamos: 18, saldosCaptadosBs: 350000 },
    gastos: {  
      alimentacionBs: 1500, hospedajeBs: 4000, transporteBs: 800,
      soporteTecnicoBs: 0, bancaElectronicaBs: 500, gastosTributariosBs: 120, conductorAyudanteBs: 300, mantenimientoLimpiezaBs: 250,
      tasaBcv: 36.5, totalUsd: 204.65, estado: 'Convalidado' 
    },
    saldoFinMesBs: 350000,
    tasaBcvRentabilidad: 36.5
  },
  {
    id: 'EV-002',
    type: 'Agencia Móvil',
    agencyCode: '002 - Valencia Centro',
    eventName: 'GNB Cojedes',
    state: 'Cojedes',
    region: 'Región Central',
    startDate: `${currentYear}-${formatMonth}-20`,
    endDate: `${currentYear}-${formatMonth}-25`,
    status: 'En Proceso',
    cifras: { cuentasAbiertas: 45, tdd: 40, reclamos: 5, saldosCaptadosBs: 180000 },
    gastos: {
      alimentacionBs: 1200, hospedajeBs: 2500, transporteBs: 600,
      soporteTecnicoBs: 200, bancaElectronicaBs: 300, gastosTributariosBs: 100, conductorAyudanteBs: 250, mantenimientoLimpiezaBs: 150,
      tasaBcv: 36.5, totalUsd: 145.20, estado: 'Convalidado'
    },
    saldoFinMesBs: 180000,
    tasaBcvRentabilidad: 36.5
  },
  {
    id: 'EV-003',
    type: 'Unidad Móvil',
    agencyCode: '004 - Barquisimeto Sur',
    eventName: 'El Merengazo Lara',
    state: 'Lara',
    region: 'Región Centro‑Occidental',
    startDate: `${currentYear}-${formatMonth}-01`,
    endDate: `${currentYear}-${formatMonth}-03`,
    status: 'Culminado',
    cifras: { cuentasAbiertas: 85, tdd: 75, reclamos: 12, saldosCaptadosBs: 290000 },
    gastos: {
      alimentacionBs: 2000, hospedajeBs: 3500, transporteBs: 1200,
      soporteTecnicoBs: 300, bancaElectronicaBs: 400, gastosTributariosBs: 150, conductorAyudanteBs: 400, mantenimientoLimpiezaBs: 300,
      tasaBcv: 36.5, totalUsd: 226.02, estado: 'Convalidado'
    },
    saldoFinMesBs: 290000,
    tasaBcvRentabilidad: 36.5
  },
  {
    id: 'EV-004',
    type: 'Red de Agencias',
    agencyCode: '001 - Caracas Central',
    eventName: 'Plaza Alfredo Sadel Baruta',
    state: 'Miranda',
    region: 'Región Capital',
    startDate: `${currentYear}-${formatMonth}-15`,
    endDate: `${currentYear}-${formatMonth}-15`,
    status: 'Planificado',
    cifras: { cuentasAbiertas: 60, tdd: 55, reclamos: 2, saldosCaptadosBs: 150000 },
    gastos: {
      alimentacionBs: 800, hospedajeBs: 0, transporteBs: 400,
      soporteTecnicoBs: 150, bancaElectronicaBs: 200, gastosTributariosBs: 80, conductorAyudanteBs: 200, mantenimientoLimpiezaBs: 100,
      tasaBcv: 36.5, totalUsd: 52.87, estado: 'En Revisión'
    },
    saldoFinMesBs: 150000,
    tasaBcvRentabilidad: 36.5
  },
  {
    id: 'EV-005',
    type: 'Red de Agencias',
    agencyCode: '003 - Maracaibo Norte',
    eventName: 'Operativo Puerto de Maracaibo',
    state: 'Zulia',
    region: 'Región Occidental',
    startDate: `${currentYear}-${formatMonth}-08`,
    endDate: `${currentYear}-${formatMonth}-09`,
    status: 'Culminado',
    cifras: { cuentasAbiertas: 95, tdd: 90, reclamos: 8, saldosCaptadosBs: 420000 },
    gastos: {
      alimentacionBs: 1800, hospedajeBs: 3000, transporteBs: 900,
      soporteTecnicoBs: 250, bancaElectronicaBs: 350, gastosTributariosBs: 110, conductorAyudanteBs: 300, mantenimientoLimpiezaBs: 200,
      tasaBcv: 36.5, totalUsd: 189.31, estado: 'Convalidado'
    },
    saldoFinMesBs: 420000,
    tasaBcvRentabilidad: 36.5
  },
];

export const mockEvents = initialMockEvents;

export interface Employee {
  id: string;
  employeeCode: string; // Ficha
  dni: string; // Cédula
  fullName: string;
  cargo: string;
}

export const masterEmployees: Employee[] = [
  { id: '1', employeeCode: 'EMP-0012', dni: 'V-15.123.456', fullName: 'Carlos Pérez', cargo: 'Promotor' },
  { id: '2', employeeCode: 'EMP-0145', dni: 'V-18.987.654', fullName: 'Ana Rodríguez', cargo: 'Coordinador' },
  { id: '3', employeeCode: 'EMP-0233', dni: 'V-20.456.789', fullName: 'Luis Gómez', cargo: 'Soporte' },
  { id: '4', employeeCode: 'EMP-0412', dni: 'V-22.345.678', fullName: 'María Fernanda Ruiz', cargo: 'Soporte TI' },
  { id: '5', employeeCode: 'EMP-0555', dni: 'V-25.111.222', fullName: 'Jorge Ramírez', cargo: 'Seguridad' },
  { id: '6', employeeCode: 'EMP-0678', dni: 'V-12.333.444', fullName: 'Carmen Salas', cargo: 'Comercial' },
];

export interface EventAssignment {
  id: string;
  eventId: string;
  employeeId: string;
  role: string;
  status: 'Confirmado' | 'Pendiente';
}

export const initialMockAssignments: EventAssignment[] = [
  { id: 'ASG-1', eventId: 'EV-001', employeeId: '1', role: 'Coordinador', status: 'Confirmado' },
  { id: 'ASG-2', eventId: 'EV-001', employeeId: '2', role: 'Promotor', status: 'Confirmado' },
];
