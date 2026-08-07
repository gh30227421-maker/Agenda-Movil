// src/lib/cost-centers-full.ts

/**
 * Catálogo genérico de Centros de Costo (CC) para la demo del Dashboard BNC.
 * Cada registro representa una agencia o unidad móvil.
 * Este archivo es provisional; la carga definitiva vendrá del backend.
 */

export type RegionType =
  | "Región Capital"
  | "Región Central"
  | "Región Occidental"
  | "Región Oriental"
  | "Región Centro‑Occidental"
  | "Región Los Llanos"
  | "Región Guayana";

export interface CostCenter {
  /** Código único del centro de costo (PK) */
  code: string;
  /** Nombre descriptivo de la agencia/unidad */
  name: string;
  /** Estado de la República donde se ubica */
  state: string;
  /** Región administrativa a la que pertenece */
  region: RegionType;
  /** Tipo de entidad (Agencia o Unidad Móvil) */
  type: "Agencia" | "Unidad Móvil";
}

/**
 * Conjunto de datos estáticos. En producción este arreglo será
 * reemplazado por una llamada al API del backend.
 */
export const COST_CENTERS: CostCenter[] = [
  { code: "001", name: "Caracas Central", state: "Distrito Capital", region: "Región Capital", type: "Agencia" },
  { code: "002", name: "Valencia Centro", state: "Carabobo", region: "Región Central", type: "Agencia" },
  { code: "003", name: "Maracaibo Norte", state: "Zulia", region: "Región Occidental", type: "Unidad Móvil" },
  { code: "004", name: "Barquisimeto Sur", state: "Lara", region: "Región Centro‑Occidental", type: "Agencia" },
  { code: "005", name: "Mérida Andina", state: "Mérida", region: "Región Occidental", type: "Unidad Móvil" },
  { code: "006", name: "Puerto La Cruz", state: "Anzoátegui", region: "Región Oriental", type: "Agencia" },
  { code: "007", name: "Cumana Costera", state: "Sucre", region: "Región Oriental", type: "Agencia" },
  { code: "008", name: "Ciudad Guayana", state: "Bolívar", region: "Región Guayana", type: "Unidad Móvil" },
  { code: "009", name: "San Cristóbal", state: "Táchira", region: "Región Occidental", type: "Agencia" },
  { code: "010", name: "San Juan de los Morros", state: "Guárico", region: "Región Los Llanos", type: "Unidad Móvil" },
];

/**
 * Busca un centro de costo por su código.
 * @param code Código del centro (ej. "001")
 * @returns El objeto CostCenter o `undefined` si no se encuentra.
 */
export function lookupCostCenter(code: string): CostCenter | undefined {
  return COST_CENTERS.find((c) => c.code === code);
}

/**
 * Resumen rápido de los eventos asociados a un estado.
 * Este helper se utilizará desde el mapa y la tabla de rentabilidad.
 */
export interface StateSummary {
  state: string;
  totalEvents: number;
  totalAccounts: number;
  totalSaldoUsd: number;
  totalCostUsd: number;
}

export function getStateSummary(state: string, events: any[]): StateSummary {
  const filtered = events.filter((e) => e.state === state);
  const totalEvents = filtered.length;
  const totalAccounts = filtered.reduce((a, e) => a + (e.accountsOpen ?? 0), 0);
  const totalSaldoUsd = filtered.reduce((a, e) => a + (e.saldoFinMesUsd ?? 0), 0);
  const totalCostUsd = filtered.reduce((a, e) => a + (e.costoTotalUsd ?? 0), 0);
  return { state, totalEvents, totalAccounts, totalSaldoUsd, totalCostUsd };
}
