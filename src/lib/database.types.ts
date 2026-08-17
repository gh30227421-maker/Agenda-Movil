export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assets: {
        Row: {
          id: string
          codigo_activo: string
          tipo_equipo: string
          marca: string | null
          modelo: string | null
          tipo_asignacion: string | null
          agencia_id: string | null
          evento_id: string | null
          marca_modelo?: string | null
          serial: string | null
          estado_operativo: string
          employee_id: string | null
          agency_code?: string | null
          fecha_adquisicion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo_activo: string
          tipo_equipo: string
          marca?: string | null
          modelo?: string | null
          tipo_asignacion?: string | null
          agencia_id?: string | null
          evento_id?: string | null
          marca_modelo?: string | null
          serial?: string | null
          estado_operativo?: string
          employee_id?: string | null
          agency_code?: string | null
          fecha_adquisicion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo_activo?: string
          tipo_equipo?: string
          marca?: string | null
          modelo?: string | null
          tipo_asignacion?: string | null
          agencia_id?: string | null
          evento_id?: string | null
          marca_modelo?: string | null
          serial?: string | null
          estado_operativo?: string
          employee_id?: string | null
          agency_code?: string | null
          fecha_adquisicion?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      agencies: {
        Row: {
          id: string
          code: string
          name: string
          region: string
          zone: string
          state: string
          lat: number | null
          lng: number | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          region: string
          zone: string
          state: string
          lat?: number | null
          lng?: number | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          region?: string
          zone?: string
          state?: string
          lat?: number | null
          lng?: number | null
          is_active?: boolean | null
        }
      }
      employees: {
        Row: {
          id: string
          employee_code: string
          dni: string
          full_name: string
          cargo: string
          created_at: string
        }
        Insert: {
          id?: string
          employee_code: string
          dni: string
          full_name: string
          cargo: string
          created_at?: string
        }
        Update: {
          id?: string
          employee_code?: string
          dni?: string
          full_name?: string
          cargo?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          event_type: string
          agency_id: string
          event_name: string
          location: string | null
          start_date: string
          end_date: string
          status: string | null
          vp_solicitante: string | null
          responsable: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          event_type: string
          agency_id: string
          event_name: string
          location?: string | null
          start_date: string
          end_date: string
          status?: string | null
          vp_solicitante?: string | null
          responsable?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          event_type?: string
          agency_id?: string
          event_name?: string
          location?: string | null
          start_date?: string
          end_date?: string
          status?: string | null
          vp_solicitante?: string | null
          responsable?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      event_assignments: {
        Row: {
          id: string
          event_id: string
          employee_id: string
          role: string
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          employee_id: string
          role: string
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          employee_id?: string
          role?: string
          status?: string | null
          created_at?: string
        }
      }
      event_metrics: {
        Row: {
          id: string
          event_id: string
          cuentas_abiertas: number | null
          tdd: number | null
          reclamos: number | null
          saldos_captados_bs: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          cuentas_abiertas?: number | null
          tdd?: number | null
          reclamos?: number | null
          saldos_captados_bs?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          cuentas_abiertas?: number | null
          tdd?: number | null
          reclamos?: number | null
          saldos_captados_bs?: number | null
          updated_at?: string
        }
      }
      event_expenses: {
        Row: {
          id: string
          event_id: string
          alimentacion_bs: number | null
          hospedaje_bs: number | null
          transporte_bs: number | null
          soporte_tecnico_bs: number | null
          banca_electronica_bs: number | null
          gastos_tributarios_bs: number | null
          conductor_ayudante_bs: number | null
          mantenimiento_limpieza_bs: number | null
          tasa_bcv: number | null
          total_usd: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          alimentacion_bs?: number | null
          hospedaje_bs?: number | null
          transporte_bs?: number | null
          soporte_tecnico_bs?: number | null
          banca_electronica_bs?: number | null
          gastos_tributarios_bs?: number | null
          conductor_ayudante_bs?: number | null
          mantenimiento_limpieza_bs?: number | null
          tasa_bcv?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          alimentacion_bs?: number | null
          hospedaje_bs?: number | null
          transporte_bs?: number | null
          soporte_tecnico_bs?: number | null
          banca_electronica_bs?: number | null
          gastos_tributarios_bs?: number | null
          conductor_ayudante_bs?: number | null
          mantenimiento_limpieza_bs?: number | null
          tasa_bcv?: number | null
          status?: string | null
          updated_at?: string
        }
      }
      event_closings: {
        Row: {
          id: string
          event_id: string
          saldo_fin_mes_bs: number | null
          tasa_bcv_rentabilidad: number | null
          saldo_fin_mes_usd: number | null
          closed_at: string
          closed_by: string | null
        }
        Insert: {
          id?: string
          event_id: string
          saldo_fin_mes_bs?: number | null
          tasa_bcv_rentabilidad?: number | null
          closed_at?: string
          closed_by?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          saldo_fin_mes_bs?: number | null
          tasa_bcv_rentabilidad?: number | null
          closed_at?: string
          closed_by?: string | null
        }
      }
      event_photos: {
        Row: {
          id: string
          event_id: string
          photo_url: string
          caption: string | null
          category: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          photo_url: string
          caption?: string | null
          category?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          photo_url?: string
          caption?: string | null
          category?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
