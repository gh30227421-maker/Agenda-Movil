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

  // Helper to generate the next 6 months starting from the month after the event end date
  const generateMonths = (endDate: string) => {
    const dates = [];
    // Ensure we parse the date correctly in local time avoiding UTC timezone shifts
    const [yearStr, monthStr, dayStr] = endDate.split('T')[0].split('-');
    const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
    
    for (let i = 1; i <= 6; i++) {
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

      // Check events to see if they lack tracking rows (allowing testing for non-cancelled)
      const targetEvents = events.filter(e => e.status !== 'Cancelado');
      
      targetEvents.forEach(ev => {
        const evTrackings = currentTrackings.filter((t: any) => t.event_id === ev.id);
        if (evTrackings.length === 0) {
          // Generate 6 months
          const generatedDates = generateMonths(ev.endDate);
          generatedDates.forEach((monthDate, idx) => {
            trackingsToInsert.push({
              event_id: ev.id,
              month_date: monthDate,
              month_index: idx + 1,
              saldo_activo: 0,
              ingresos: 0,
              costos: 0,
              status: 'Pendiente'
            });
          });
        }
      });

      // Insert missing tracking rows if any
      if (trackingsToInsert.length > 0) {
        const { error: insertError } = await (supabase as any)
          .from('event_rentability_tracking')
          .insert(trackingsToInsert);
        if (insertError) {
          console.error('Error generating rentability trackings:', insertError);
        } else {
          // Re-fetch after inserting
          const { data: refreshed } = await (supabase as any)
            .from('event_rentability_tracking')
            .select('*');
          if (refreshed) currentTrackings = refreshed;
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
        status: t.status
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
