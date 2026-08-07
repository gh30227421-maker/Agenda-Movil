// @ts-nocheck
import { supabase } from './supabase';
import { initialMockEvents, masterEmployees, costCenters, initialMockAssignments } from './mock-data';

export async function seedDatabase() {
  try {
    console.log('Seeding Database...');
    
    // 1. Seed Employees
    const { data: dbEmployees, error: errEmp } = await supabase
      .from('employees')
      .insert(<any>
        masterEmployees.map(emp => ({
          employee_code: emp.employeeCode,
          dni: emp.dni,
          full_name: emp.fullName,
          cargo: emp.cargo
        }))
      )
      .select();
    if (errEmp) throw errEmp;

    // 2. Seed Agencies
    const { data: dbAgencies, error: errAg } = await supabase
      .from('agencies')
      .insert(<any>
        costCenters.map(cc => ({
          code: cc.code,
          name: cc.name,
          region: cc.region,
          zone: cc.zone,
          state: cc.state,
          lat: null,
          lng: null
        }))
      )
      .select();
    if (errAg) throw errAg;

    // 3. Seed Events
    for (const mockEv of initialMockEvents) {
      // Find agency id based on agencyCode logic (mock agencyCode was '001 - Caracas Central')
      const codeStr = mockEv.agencyCode.split(' - ')[0];
      const agency = dbAgencies?.find(a => a.code === codeStr);
      if (!agency) continue;

      const { data: evData, error: errEv } = await supabase
        .from('events')
        .insert(<any>{
          event_type: mockEv.type,
          agency_id: agency.id,
          event_name: mockEv.eventName,
          location: mockEv.location || null,
          start_date: mockEv.startDate,
          end_date: mockEv.endDate,
          status: mockEv.status,
          vp_solicitante: mockEv.vpSolicitante || null,
          responsable: mockEv.responsable || null
        })
        .select()
        .single();
      
      if (errEv) throw errEv;

      // Seed Cifras
      if (mockEv.cifras) {
        await (supabase as any).from('event_metrics').insert(<any>{
          event_id: evData.id,
          cuentas_abiertas: mockEv.cifras.cuentasAbiertas,
          tdd: mockEv.cifras.tdd,
          reclamos: mockEv.cifras.reclamos,
          saldos_captados_bs: mockEv.cifras.saldosCaptadosBs
        });
      }

      // Seed Gastos
      if (mockEv.gastos) {
        await (supabase as any).from('event_expenses').insert(<any>{
          event_id: evData.id,
          alimentacion_bs: mockEv.gastos.alimentacionBs,
          hospedaje_bs: mockEv.gastos.hospedajeBs,
          transporte_bs: mockEv.gastos.transporteBs,
          soporte_tecnico_bs: mockEv.gastos.soporteTecnicoBs,
          banca_electronica_bs: mockEv.gastos.bancaElectronicaBs,
          gastos_tributarios_bs: mockEv.gastos.gastosTributariosBs,
          conductor_ayudante_bs: mockEv.gastos.conductorAyudanteBs,
          mantenimiento_limpieza_bs: mockEv.gastos.mantenimientoLimpiezaBs,
          tasa_bcv: mockEv.gastos.tasaBcv,
          status: mockEv.gastos.estado
        });
      }

      // Seed Rentabilidad
      if (mockEv.saldoFinMesBs !== undefined && mockEv.tasaBcvRentabilidad !== undefined) {
        await (supabase as any).from('event_closings').insert(<any>{
          event_id: evData.id,
          saldo_fin_mes_bs: mockEv.saldoFinMesBs,
          tasa_bcv_rentabilidad: mockEv.tasaBcvRentabilidad
        });
      }

      // Seed Assignments
      const evAssignments = initialMockAssignments.filter(a => a.eventId === mockEv.id);
      for (const asg of evAssignments) {
        const mockEmp = masterEmployees.find(e => e.id === asg.employeeId);
        if (mockEmp) {
          const dbEmp = dbEmployees?.find(e => e.employee_code === mockEmp.employeeCode);
          if (dbEmp) {
            await (supabase as any).from('event_assignments').insert(<any>{
              event_id: evData.id,
              employee_id: dbEmp.id,
              role: asg.role,
              status: asg.status
            });
          }
        }
      }
    }

    console.log('Seeding completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error };
  }
}
