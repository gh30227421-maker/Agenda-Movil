"use client";

import React, { useState } from 'react';
import { format, isPast, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle, Building2, TrendingUp } from 'lucide-react';
import { RentabilityTracking } from '@/lib/mock-data';

interface EventTrackingCardProps {
  event: any;
  trackings: RentabilityTracking[];
  onEditClick: (tracking: RentabilityTracking, tasaBcv: number) => void;
}

export default function EventTrackingCard({ event, trackings, onEditClick }: EventTrackingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const monthsList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  const eventTrackings = trackings.filter(t => t.eventId === event.id).sort((a, b) => a.monthIndex - b.monthIndex);
  const eventTasaBcv = event.gastos?.tasaBcv || event.tasaBcvRentabilidad || 1;

  // Calculate Progress
  const closedMonths = eventTrackings.filter(t => t.status === 'Cerrado').length;
  const progressPct = Math.round((closedMonths / 12) * 100);

  // Calculate Global Trend (Last closed vs previous to it)
  let globalDeltaPct = 0;
  let hasGlobalTrend = false;
  if (closedMonths >= 2) {
    const closedTrackings = eventTrackings.filter(t => t.status === 'Cerrado');
    const last = closedTrackings[closedTrackings.length - 1];
    const prev = closedTrackings[closedTrackings.length - 2];
    
    const lastRate = last.tasaBcv || eventTasaBcv;
    const prevRate = prev.tasaBcv || eventTasaBcv;
    
    const lastUsd = (last.saldoActivo || 0) / lastRate;
    const prevUsd = (prev.saldoActivo || 0) / prevRate;

    if (prevUsd > 0) {
      globalDeltaPct = ((lastUsd - prevUsd) / prevUsd) * 100;
      hasGlobalTrend = true;
    } else if (lastUsd > 0) {
      globalDeltaPct = 100;
      hasGlobalTrend = true;
    }
  }

  // Determine global health color
  let healthColor = 'text-gray-400 bg-gray-50';
  let healthBar = 'bg-gray-300';
  if (hasGlobalTrend) {
    if (globalDeltaPct >= 0) {
      healthColor = 'text-[#009639] bg-[#009639]/10';
      healthBar = 'bg-[#009639]';
    } else {
      healthColor = 'text-[#D92D20] bg-[#D92D20]/10';
      healthBar = 'bg-[#D92D20]';
    }
  } else if (closedMonths === 1) {
    healthColor = 'text-[#009639] bg-[#009639]/10';
    healthBar = 'bg-[#009639]';
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-gray-300 transition-colors">
      {/* Header / Contracted View */}
      <div 
        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-[#00205B]">{event.eventName}</h3>
            {hasGlobalTrend && (
              <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${healthColor}`}>
                {globalDeltaPct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {Math.abs(globalDeltaPct).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 font-medium">
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 opacity-70" /> {event.agencyCode}</span>
            <span className="text-gray-300">•</span>
            <span>Inicio: {event.endDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 md:w-1/3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500 font-medium">Progreso de Seguimiento</span>
              <span className="font-bold text-gray-700">{closedMonths}/12 ({progressPct}%)</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${healthBar}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <button className="text-gray-400 hover:text-[#00205B] transition-colors p-1">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Accordion / Expanded View */}
      {isExpanded && (
        <div className="bg-gray-50/50 border-t border-gray-100 p-5 overflow-x-auto">
          <div className="flex gap-4 pb-2" style={{ minWidth: 'min-content' }}>
            {monthsList.map(monthIndex => {
              const t = eventTrackings.find(track => track.monthIndex === monthIndex);
              
              if (!t) {
                return (
                  <div key={`empty-${monthIndex}`} className="w-48 shrink-0 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30 text-gray-300">
                    M{monthIndex}
                  </div>
                );
              }

              const isPending = t.status === 'Pendiente';
              const cellDate = new Date(t.monthDate);
              const isOverdue = isPending && isPast(cellDate) && !isSameMonth(cellDate, new Date());
              
              // Calculate difference vs previous month in USD
              const currentRate = t.tasaBcv || eventTasaBcv;
              const currentUsd = (t.saldoActivo || 0) / currentRate;
              
              let deltaPct = 0;
              let showDiff = false;
              let isPositive = currentUsd >= 0; // Default for month 1
              
              if (!isPending && t.monthIndex > 1) {
                const prevT = eventTrackings.find(track => track.monthIndex === t.monthIndex - 1);
                if (prevT && prevT.status === 'Cerrado') {
                  const prevRate = prevT.tasaBcv || eventTasaBcv;
                  const prevUsd = (prevT.saldoActivo || 0) / prevRate;
                  
                  const diffUsd = currentUsd - prevUsd;
                  if (prevUsd > 0) {
                    deltaPct = (diffUsd / prevUsd) * 100;
                  } else {
                    deltaPct = currentUsd > 0 ? 100 : 0;
                  }
                  showDiff = true;
                  isPositive = diffUsd >= 0;
                }
              }

              if (isPending) {
                return (
                  <div 
                    key={t.id} 
                    onClick={() => onEditClick(t, eventTasaBcv)}
                    className={`w-48 shrink-0 p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                      isOverdue 
                        ? 'bg-red-50/40 border-red-100 hover:border-red-300' 
                        : 'bg-white border-dashed border-gray-200 hover:border-[#00205B]/40 hover:bg-[#00205B]/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {format(cellDate, 'MMM yyyy', { locale: es })}
                      </span>
                      {isOverdue ? <AlertCircle className="w-3.5 h-3.5 text-red-500" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>}
                    </div>
                    <div className="flex flex-col items-center justify-center h-16 gap-1 text-[#00205B] opacity-60 group-hover:opacity-100 transition-opacity">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-xs font-bold">Registrar Cierre</span>
                    </div>
                  </div>
                );
              }

              // Cerrado
              const statusBg = isPositive ? 'bg-[#009639]/5 border-[#009639]/20 hover:border-[#009639]/40' : 'bg-[#D92D20]/5 border-[#D92D20]/20 hover:border-[#D92D20]/40';
              const valueColor = isPositive ? 'text-[#009639]' : 'text-[#D92D20]';

              return (
                <div 
                  key={t.id} 
                  onClick={() => onEditClick(t, eventTasaBcv)}
                  className={`w-48 shrink-0 p-4 rounded-xl border transition-all cursor-pointer ${statusBg}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {format(cellDate, 'MMM yyyy', { locale: es })}
                    </span>
                    <CheckCircle2 className={`w-4 h-4 ${valueColor}`} />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className={`text-xl font-black ${valueColor} truncate`}>
                      $ {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(currentUsd)}
                    </span>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-medium text-gray-400">
                        Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(t.saldoActivo)}
                      </span>
                      {showDiff && (
                        <div className={`flex items-center gap-0.5 text-xs font-bold ${valueColor}`}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {Math.abs(deltaPct).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
