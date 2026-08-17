"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AgendaEvent, EventType, EventStatus, EventAssignment, Employee } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { seedDatabase } from '@/lib/seed';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

export type ModalMode = 'menu' | 'datos' | 'cifras' | 'gastos' | 'create';

interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  isGlobal: boolean;
  eventId: string | null;
  defaultDate?: string | null;
}

export interface Agency {
  id: string;
  code: string;
  name: string;
  region: string;
  zone: string;
  state: string;
}

interface AgendaContextType {
  events: AgendaEvent[];
  agencies: Agency[];
  employees: Employee[];
  assignments: EventAssignment[];
  isLoading: boolean;
  isSeeding: boolean;
  fetchData: () => Promise<void>;
  updateEvent: (id: string, data: Partial<AgendaEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addEvent: (data: Omit<AgendaEvent, 'id'>) => Promise<void>;
  addAssignment: (data: Omit<EventAssignment, 'id'>) => Promise<void>;
  toggleAssignmentStatus: (id: string) => Promise<void>;
  addEmployee: (data: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  handleSeed: () => Promise<void>;
  modalState: ModalState;
  openModal: (mode: ModalMode, isGlobal?: boolean, eventId?: string | null, defaultDate?: string | null) => void;
  closeModal: () => void;
  setModalMode: (mode: ModalMode) => void;
  setModalEventId: (eventId: string | null) => void;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export function AgendaProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [assignments, setAssignments] = useState<EventAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: 'menu',
    isGlobal: false,
    eventId: null,
    defaultDate: null
  });

  const fetchData = async () => {
    if (!user) return;
    if (events.length === 0) setIsLoading(true);
    try {
      // Fetch Employees
      const { data: dbEmployees } = await (supabase as any).from('employees').select('*') as { data: any[] | null; error: any };
      if (dbEmployees) {
        setEmployees(dbEmployees.map(e => ({
          id: e.id,
          employeeCode: e.employee_code,
          dni: e.dni,
          fullName: e.full_name,
          cargo: e.cargo
        })));
      }

      // Fetch Agencies
      const { data: dbAgencies } = await (supabase as any).from('agencies').select('*') as { data: any[] | null; error: any };
      if (dbAgencies) {
        setAgencies(dbAgencies.map(a => ({
          id: a.id,
          code: a.code,
          name: a.name,
          region: a.region,
          zone: a.zone,
          state: a.state
        })));
      }

      // Fetch Events with Relations
      const { data: dbEvents } = (await (supabase as any).from('events').select(`
        *,
        agencies (*),
        event_metrics (*),
        event_expenses (*),
        event_closings (*)
      `)) as { data: any[] | null; error: any };

      if (dbEvents) {
        setEvents(dbEvents.map(ev => {
          const agency = ev.agencies;
          const metric = Array.isArray(ev.event_metrics) ? ev.event_metrics[0] : ev.event_metrics;
          const expense = Array.isArray(ev.event_expenses) ? ev.event_expenses[0] : ev.event_expenses;
          const closing = Array.isArray(ev.event_closings) ? ev.event_closings[0] : ev.event_closings;

          return {
            id: ev.id,
            type: ev.event_type as EventType,
            agencyCode: agency ? `${agency.code} - ${agency.name}` : ev.agency_id,
            eventName: ev.event_name,
            location: ev.location || undefined,
            state: agency?.state || '',
            region: agency?.region || '',
            zone: agency?.zone || '',
            startDate: ev.start_date,
            endDate: ev.end_date,
            segments: ev.segments || undefined,
            status: ev.status as EventStatus,
            vpSolicitante: ev.vp_solicitante || undefined,
            responsable: ev.responsable || undefined,
            cifras: metric ? {
              cuentasAbiertas: metric.cuentas_abiertas || 0,
              tdd: metric.tdd || 0,
              reclamos: metric.reclamos || 0,
              saldosCaptadosBs: metric.saldos_captados_bs || 0,
              atmConsultas: metric.atm_consultas || 0,
              atmRetiros: metric.atm_retiros || 0,
              atmCambioClave: metric.atm_cambio_clave || 0,
              saldoCierreDivisas: metric.saldo_cierre_divisas || 0
            } : undefined,
            gastos: expense ? {
              alimentacionBs: expense.alimentacion_bs || 0,
              hospedajeBs: expense.hospedaje_bs || 0,
              transporteBs: expense.transporte_bs || 0,
              soporteTecnicoBs: expense.soporte_tecnico_bs || 0,
              bancaElectronicaBs: expense.banca_electronica_bs || 0,
              gastosTributariosBs: expense.gastos_tributarios_bs || 0,
              conductorAyudanteBs: expense.conductor_ayudante_bs || 0,
              mantenimientoLimpiezaBs: expense.mantenimiento_limpieza_bs || 0,
              gastoCombustibleBs: expense.gasto_combustible_bs || 0,
              distanciaKm: expense.distancia_km || 0,
              tasaBcv: expense.tasa_bcv || 0,
              totalUsd: expense.total_usd || 0,
              estado: expense.status as any
            } : undefined,
            saldoFinMesBs: closing?.saldo_fin_mes_bs || undefined,
            tasaBcvRentabilidad: closing?.tasa_bcv_rentabilidad || undefined,
            _agencyId: ev.agency_id // internal reference
          } as AgendaEvent & { _agencyId: string };
        }));
      }

      // Fetch Assignments
      const { data: dbAssignments } = await (supabase as any).from('event_assignments').select('*') as { data: any[] | null; error: any };
      if (dbAssignments) {
        setAssignments(dbAssignments.map(a => ({
          id: a.id,
          eventId: a.event_id,
          employeeId: a.employee_id,
          role: a.role,
          status: a.status as 'Confirmado' | 'Pendiente'
        })));
      }
    } catch (err) {
      console.error(err);
      showToast('Error cargando datos de Supabase', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && user?.id) {
      fetchData();
    }
  }, [user?.id, isAuthLoading]);

  const handleSeed = async () => {
    setIsSeeding(true);
    const res = await seedDatabase();
    if (res.success) {
      showToast('Base de datos poblada con éxito', 'success');
      await fetchData();
    } else {
      showToast('Error al poblar base de datos', 'error');
    }
    setIsSeeding(false);
  };

  const updateEvent = async (id: string, data: Partial<AgendaEvent>) => {
    try {
      if (data.status !== undefined || data.eventName !== undefined || data.startDate !== undefined || data.endDate !== undefined || data.location !== undefined || data.vpSolicitante !== undefined || data.responsable !== undefined || data.segments !== undefined) {
        const { error } = await (supabase as any).from('events').update({
          event_name: data.eventName,
          start_date: data.startDate,
          end_date: data.endDate,
          segments: data.segments,
          location: data.location,
          status: data.status,
          vp_solicitante: data.vpSolicitante,
          responsable: data.responsable
        }).eq('id', id);
        if (error) throw error;
      }

      if (data.cifras) {
        const { data: existingMetric } = await (supabase as any).from('event_metrics').select('id').eq('event_id', id).maybeSingle() as { data: any | null; error: any };
        if (existingMetric) {
          await (supabase as any).from('event_metrics').update({
            cuentas_abiertas: data.cifras.cuentasAbiertas,
            tdd: data.cifras.tdd,
            reclamos: data.cifras.reclamos,
            saldos_captados_bs: data.cifras.saldosCaptadosBs,
            atm_consultas: data.cifras.atmConsultas,
            atm_retiros: data.cifras.atmRetiros,
            atm_cambio_clave: data.cifras.atmCambioClave,
            saldo_cierre_divisas: data.cifras.saldoCierreDivisas
          }).eq('event_id', id);
        } else {
          await (supabase as any).from('event_metrics').insert({
            event_id: id,
            cuentas_abiertas: data.cifras.cuentasAbiertas,
            tdd: data.cifras.tdd,
            reclamos: data.cifras.reclamos,
            saldos_captados_bs: data.cifras.saldosCaptadosBs,
            atm_consultas: data.cifras.atmConsultas,
            atm_retiros: data.cifras.atmRetiros,
            atm_cambio_clave: data.cifras.atmCambioClave,
            saldo_cierre_divisas: data.cifras.saldoCierreDivisas
          });
        }
      }

      if (data.gastos) {
        const { data: existingExpense } = await (supabase as any).from('event_expenses').select('id').eq('event_id', id).maybeSingle() as { data: any | null; error: any };
        if (existingExpense) {
          await (supabase as any).from('event_expenses').update({
            alimentacion_bs: data.gastos.alimentacionBs,
            hospedaje_bs: data.gastos.hospedajeBs,
            transporte_bs: data.gastos.transporteBs,
            soporte_tecnico_bs: data.gastos.soporteTecnicoBs,
            banca_electronica_bs: data.gastos.bancaElectronicaBs,
            gastos_tributarios_bs: data.gastos.gastosTributariosBs,
            conductor_ayudante_bs: data.gastos.conductorAyudanteBs,
            mantenimiento_limpieza_bs: data.gastos.mantenimientoLimpiezaBs,
            gasto_combustible_bs: data.gastos.gastoCombustibleBs,
            distancia_km: data.gastos.distanciaKm,
            tasa_bcv: data.gastos.tasaBcv,
            status: data.gastos.estado
          }).eq('event_id', id);
        } else {
          await (supabase as any).from('event_expenses').insert({
            event_id: id,
            alimentacion_bs: data.gastos.alimentacionBs,
            hospedaje_bs: data.gastos.hospedajeBs,
            transporte_bs: data.gastos.transporteBs,
            soporte_tecnico_bs: data.gastos.soporteTecnicoBs,
            banca_electronica_bs: data.gastos.bancaElectronicaBs,
            gastos_tributarios_bs: data.gastos.gastosTributariosBs,
            conductor_ayudante_bs: data.gastos.conductorAyudanteBs,
            mantenimiento_limpieza_bs: data.gastos.mantenimientoLimpiezaBs,
            gasto_combustible_bs: data.gastos.gastoCombustibleBs,
            distancia_km: data.gastos.distanciaKm,
            tasa_bcv: data.gastos.tasaBcv,
            status: data.gastos.estado
          });
        }
      }

      if (data.saldoFinMesBs !== undefined && data.tasaBcvRentabilidad !== undefined) {
         const { data: existingClosing } = await (supabase as any).from('event_closings').select('id').eq('event_id', id).maybeSingle() as { data: any | null; error: any };
         if (existingClosing) {
            await (supabase as any).from('event_closings').update({
              saldo_fin_mes_bs: data.saldoFinMesBs,
              tasa_bcv_rentabilidad: data.tasaBcvRentabilidad
            } as any).eq('event_id', id);
         } else {
            await (supabase as any).from('event_closings').insert({
              event_id: id,
              saldo_fin_mes_bs: data.saldoFinMesBs,
              tasa_bcv_rentabilidad: data.tasaBcvRentabilidad
            } as any);
         }
      }

      showToast('Evento actualizado', 'success');
      await fetchData();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Error al actualizar evento', 'error');
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('events').delete().eq('id', id);
      if (error) throw error;
      
      showToast('Evento eliminado exitosamente', 'success');
      await fetchData();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Error al eliminar evento', 'error');
    }
  };

  const addEvent = async (data: Omit<AgendaEvent, 'id'>) => {
    try {
      // En DB el agencyCode es un ID de agency. 
      // Si recibimos un code (Ej "001 - Caracas") lo buscamos, o si viene el uuid lo usamos.
      let agencyId = data.agencyCode;
      const agencyMatch = agencies.find(a => `${a.code} - ${a.name}` === data.agencyCode || a.code === data.agencyCode);
      if (agencyMatch) agencyId = agencyMatch.id;

      const { error } = await (supabase as any).from('events').insert({
        event_type: data.type,
        agency_id: agencyId,
        event_name: data.eventName,
        location: data.location || null,
        start_date: data.startDate,
        end_date: data.endDate,
        segments: data.segments || null,
        status: data.status,
        vp_solicitante: data.vpSolicitante || null,
        responsable: data.responsable || null
      } as any);
      if (error) throw error;
      
      await fetchData();
    } catch(e: any) {
      console.error(e);
      showToast(e?.message || 'Error al crear evento', 'error');
      throw e;
    }
  };

  const addAssignment = async (data: Omit<EventAssignment, 'id'>) => {
    try {
      const { error } = await (supabase as any).from('event_assignments').insert({
        status: data.status
      } as any);
      if (error) throw error;
      
      await fetchData();
    } catch(e: any) {
      console.error(e);
      showToast(e?.message || 'Error al asignar empleado', 'error');
      throw e;
    }
  };

  const toggleAssignmentStatus = async (id: string) => {
    try {
      const asg = assignments.find(a => a.id === id);
      if(!asg) return;
      const newStatus = asg.status === 'Confirmado' ? 'Pendiente' : 'Confirmado';
      const { error } = await (supabase as any).from('event_assignments').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      
      await fetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || 'Error al actualizar estado', 'error');
      throw e;
    }
  };

  const addEmployee = async (data: Omit<Employee, 'id'>) => {
    try {
      const { error } = await (supabase as any).from('employees').insert({
        full_name: data.fullName,
        cargo: data.cargo
      } as any);
      if (error) throw error;
      
      await fetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || 'Error al agregar empleado', 'error');
      throw e;
    }
  };

  const updateEmployee = async (id: string, data: Partial<Employee>) => {
    try {
      const { error } = await (supabase as any).from('employees').update({
        full_name: data.fullName,
        cargo: data.cargo
      } as any).eq('id', id);
      if (error) throw error;
      
      await fetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || 'Error al actualizar empleado', 'error');
      throw e;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      // Opt: Delete assignments first if foreign keys don't cascade, but let's assume cascade is setup or we rely on supabase
      const { error } = await (supabase as any).from('employees').delete().eq('id', id);
      if (error) throw error;
      
      await fetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || 'Error al eliminar empleado', 'error');
      throw e;
    }
  };

  const openModal = (mode: ModalMode, isGlobal: boolean = false, eventId: string | null = null, defaultDate: string | null = null) => {
    setModalState({ isOpen: true, mode, isGlobal, eventId, defaultDate });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const setModalMode = (mode: ModalMode) => {
    setModalState(prev => ({ ...prev, mode }));
  };

  const setModalEventId = (eventId: string | null) => {
    setModalState(prev => ({ ...prev, eventId }));
  };

  return (
    <AgendaContext.Provider value={{ 
      events, agencies, updateEvent, deleteEvent, addEvent, 
      assignments, addAssignment, toggleAssignmentStatus,
      employees, addEmployee, updateEmployee, deleteEmployee, isLoading, isSeeding, fetchData, handleSeed,
      modalState, openModal, closeModal, setModalMode, setModalEventId 
    }}>
      {children}
    </AgendaContext.Provider>
  );
}

export function useAgenda() {
  const context = useContext(AgendaContext);
  if (context === undefined) {
    throw new Error('useAgenda must be used within an AgendaProvider');
  }
  return context;
}
