"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useAgenda } from './AgendaContext';
import { RentabilityTracking, AgendaEvent } from '@/lib/mock-data';

interface RentabilityContextType {
  trackings: RentabilityTracking[];
  isLoading: boolean;
  fetchTrackings: () => Promise<void>;
  updateTracking: (id: string, data: Partial<RentabilityTracking>) => Promise<void>;
}

const RentabilityContext = createContext<RentabilityContextType | undefined>(undefined);

export function RentabilityProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { events } = useAgenda(); // Need events to calculate automated tracking
  
  const [trackings, setTrackings] = useState<RentabilityTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to generate the next 12 months starting from the event start date
  const generateMonths = (startDate: string) => {
    const dates = [];
    // Ensure we parse the date correctly in local time avoiding UTC timezone shifts
    const [yearStr, monthStr, dayStr] = startDate.split('T')[0].split('-');
    const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
    
    for (let i = 0; i < 12; i++) {
      const nextMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + i, 1);
      const yyyy = nextMonth.getFullYear();
      const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-01`);
    }
    return dates;
  };

  const fetchTrackings = async () => {
    if (!user) return;
    if (trackings.length === 0) setIsLoading(true);
    try {
      const { data: dbTrackings, error } = await (supabase as any)
        .from('event_rentability_tracking')
        .select('*');
      
      if (error) throw error;

      let currentTrackings = dbTrackings || [];
      const trackingsToInsert: any[] = [];
      const trackingsToUpdate: any[] = [];

      // Check events to see if they lack tracking rows (allowing testing for non-cancelled)
      const targetEvents = events.filter(e => e.status !== 'Cancelado');
      
      targetEvents.forEach(ev => {
        const evTrackings = currentTrackings.filter((t: any) => t.event_id === ev.id);
        const generatedDates = generateMonths(ev.startDate);
        
        // Force exact 12 months check
        for (let i = 0; i < 12; i++) {
          const expectedMonthIndex = i + 1;
          const existingTracking = evTrackings.find((t: any) => t.month_index === expectedMonthIndex);
          
          if (!existingTracking) {
            const isFirstMonth = expectedMonthIndex === 1;
            const eventRate = ev.gastos?.tasaBcv || ev.tasaBcvRentabilidad || 1;
            const capturedBs = ev.cifras?.saldosCaptadosBs || 0;
            
            trackingsToInsert.push({
              event_id: ev.id,
              month_date: generatedDates[i],
              month_index: expectedMonthIndex,
              saldo_activo: isFirstMonth ? capturedBs : 0,
              ingresos: 0,
              costos: 0,
              tasa_bcv: isFirstMonth ? eventRate : 0,
              status: isFirstMonth ? 'Cerrado' : 'Pendiente'
            });
          } else if (expectedMonthIndex === 1 && existingTracking.status === 'Pendiente') {
            // Sync legacy month 1 to Cerrado
            const eventRate = ev.gastos?.tasaBcv || ev.tasaBcvRentabilidad || 1;
            const capturedBs = ev.cifras?.saldosCaptadosBs || 0;
            trackingsToUpdate.push({
              id: existingTracking.id,
              saldo_activo: capturedBs,
              tasa_bcv: eventRate,
              status: 'Cerrado'
            });
          }
        }
      });

      // Insert missing tracking rows if any
      let needsRefetch = false;
      if (trackingsToInsert.length > 0) {
        const { error: insertError } = await (supabase as any)
          .from('event_rentability_tracking')
          .insert(trackingsToInsert);
        if (insertError) {
          // Si es un error de duplicado (ej. por Strict Mode de React), solo lanzamos un warning
          console.warn('Nota: Error al generar trackings (posible duplicado por concurrencia):', insertError.message || insertError);
        } else {
          needsRefetch = true;
        }
      }

      // Update legacy first months if needed
      if (trackingsToUpdate.length > 0) {
        for (const updatePayload of trackingsToUpdate) {
          const { error: upErr } = await (supabase as any)
            .from('event_rentability_tracking')
            .update({
              saldo_activo: updatePayload.saldo_activo,
              tasa_bcv: updatePayload.tasa_bcv,
              status: updatePayload.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', updatePayload.id);
            
          if (upErr) console.error('Error updating legacy tracking:', upErr);
        }
        needsRefetch = true;
      }

      if (needsRefetch) {
        // Re-fetch after modifications
        const { data: refreshed } = await (supabase as any)
          .from('event_rentability_tracking')
          .select('*');
        if (refreshed) {
          currentTrackings = refreshed;
        } else {
          // Optimistic local update as fallback if refetch fails or returns null
          trackingsToInsert.forEach(t => currentTrackings.push({...t, id: Math.random().toString()}));
          trackingsToUpdate.forEach(t => {
            const index = currentTrackings.findIndex((ct: any) => ct.id === t.id);
            if (index >= 0) {
              currentTrackings[index].saldo_activo = t.saldo_activo;
              currentTrackings[index].tasa_bcv = t.tasa_bcv;
              currentTrackings[index].status = t.status;
            }
          });
        }
      }

      setTrackings(currentTrackings.map((t: any) => ({
        id: t.id,
        eventId: t.event_id,
        monthDate: t.month_date,
        monthIndex: t.month_index,
        saldoActivo: t.saldo_activo || 0,
        ingresos: t.ingresos || 0,
        costos: t.costos || 0,
        status: t.status,
        tasaBcv: t.tasa_bcv || 0
      })));
    } catch (e: any) {
      console.error(e);
      showToast('Error al cargar rentabilidad', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTracking = async (id: string, data: Partial<RentabilityTracking>) => {
    try {
      const payload: any = {};
      if (data.saldoActivo !== undefined) payload.saldo_activo = data.saldoActivo;
      if (data.ingresos !== undefined) payload.ingresos = data.ingresos;
      if (data.costos !== undefined) payload.costos = data.costos;
      if (data.status !== undefined) payload.status = data.status;
      if (data.tasaBcv !== undefined) payload.tasa_bcv = data.tasaBcv;
      payload.updated_at = new Date().toISOString();

      const { error } = await (supabase as any)
        .from('event_rentability_tracking')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
      showToast('Mes actualizado correctamente', 'success');
      await fetchTrackings();
    } catch (e: any) {
      console.error(e);
      showToast('Error al actualizar registro', 'error');
    }
  };

  useEffect(() => {
    // Only fetch trackings after events are loaded
    if (events.length > 0) {
      fetchTrackings();
    }
  }, [user, events.length]);

  return (
    <RentabilityContext.Provider value={{ trackings, isLoading, fetchTrackings, updateTracking }}>
      {children}
    </RentabilityContext.Provider>
  );
}

export function useRentability() {
  const context = useContext(RentabilityContext);
  if (context === undefined) {
    throw new Error('useRentability must be used within a RentabilityProvider');
  }
  return context;
}
