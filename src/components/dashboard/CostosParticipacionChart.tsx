"use client";

import React from 'react';
import CostosParticipacionAgenciaChart from './CostosParticipacionAgenciaChart';
import CostosParticipacionUnidadChart from './CostosParticipacionUnidadChart';

interface CostosParticipacionChartProps {
  events: any[];
}

export default function CostosParticipacionChart({ events }: CostosParticipacionChartProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full justify-between">
      {/* Encabezado Principal Limpio */}
      <div className="border-b border-gray-100 pb-4 mb-4">
        <h3 className="font-bold text-[#00205B] text-base">Participación de Costos Globales</h3>
        <p className="text-xs text-gray-500 mt-1">Comparativa de gastos operativos entre canales</p>
      </div>
      
      {/* Contenedor Unificado sin sub-cajas grises ni líneas divisorias toscas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center justify-center flex-1 w-full my-auto">
        <CostosParticipacionAgenciaChart events={events} />
        <CostosParticipacionUnidadChart events={events} />
      </div>
    </div>
  );
}
