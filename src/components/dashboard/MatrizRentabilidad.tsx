"use client";

import React, { useState } from 'react';
import ChartModalWrapper from './ChartModalWrapper';

interface MatrizRentabilidadProps {
  events: any[];
}

export default function MatrizRentabilidad({ events }: MatrizRentabilidadProps) {
  const [filterType, setFilterType] = useState<string>('todos');

  const filteredEvents = events.filter(ev => {
    if (filterType === 'todos') return true;
    return ev.type === filterType;
  });

  return (
    <ChartModalWrapper 
      title="Matriz de Rentabilidad y Eficiencia por Jornada"
      subtitle="Evaluación del retorno financiero (Saldo Cierre USD vs. Gasto Operativo USD)"
    >
      <div className="flex flex-col h-full space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 border-b border-gray-100 pb-4">
          {/* Filtros rápidos por Canal */}
        <div className="flex items-center gap-2">
          {['todos', 'Unidad Móvil', 'Agencia Móvil', 'Red de Agencias'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterType === type 
                  ? 'bg-[#00205B] text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type === 'todos' ? 'Todos los Canales' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Maestra */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Nombre del Operativo</th>
              <th className="px-4 py-3">Estado / Región</th>
              <th className="px-4 py-3">Canal</th>
              <th className="px-4 py-3 text-center">Cuentas Abiertas</th>
              <th className="px-4 py-3 text-right">Saldo Cierre (USD)</th>
              <th className="px-4 py-3 text-right">Gasto Total (USD)</th>
              <th className="px-4 py-3 text-center">Eficiencia / Retorno</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {filteredEvents.map(ev => {
              const cuentas = ev.cifras?.cuentasAbiertas || 0;
              const tasaBcv = ev.gastos?.tasaBcv || 1;
              const saldosBs = ev.cifras?.saldosCaptadosBs || 0;
              const saldoDivisas = ev.cifras?.saldoCierreDivisas || 0;
              const saldoUsd = (tasaBcv > 0 ? saldosBs / tasaBcv : 0) + saldoDivisas;

              const tieneGastos = !!ev.gastos;
              const costosUsdBase = ev.gastos?.totalUsd || 0;
              let costosBs = 0;
              if (tieneGastos) {
                const g = ev.gastos!;
                costosBs = g.alimentacionBs + g.hospedajeBs + g.transporteBs +
                           g.soporteTecnicoBs + g.bancaElectronicaBs + g.gastosTributariosBs +
                           g.conductorAyudanteBs + g.mantenimientoLimpiezaBs + (g.gastoCombustibleBs || 0);
              } else if (costosUsdBase > 0 && tasaBcv > 0) {
                costosBs = costosUsdBase * tasaBcv;
              }
              const gastoUsd = tasaBcv > 0 ? costosBs / tasaBcv : 0;

              // Cálculo de Eficiencia
              let eficienciaLabel = '⏱ Sin Datos';
              let eficienciaBg = 'bg-gray-100 text-gray-600';

              if (saldoUsd > 0 && gastoUsd > 0) {
                const ratio = ((saldoUsd - gastoUsd) / saldoUsd) * 100;
                if (ratio >= 35) {
                  eficienciaLabel = `✨ Alta (+${ratio.toFixed(0)}%)`;
                  eficienciaBg = 'bg-emerald-100 text-emerald-700';
                } else if (ratio >= 20) {
                  eficienciaLabel = `⚡ Media (+${ratio.toFixed(0)}%)`;
                  eficienciaBg = 'bg-amber-100 text-amber-700';
                } else {
                  eficienciaLabel = `⚠️ Baja (${ratio.toFixed(0)}%)`;
                  eficienciaBg = 'bg-rose-100 text-rose-700';
                }
              } else if (saldoUsd > 0 && gastoUsd === 0) {
                eficienciaLabel = `✨ Alta (+100%)`;
                eficienciaBg = 'bg-emerald-100 text-emerald-700';
              } else if (saldoUsd === 0 && gastoUsd > 0) {
                eficienciaLabel = `⚠️ Pérdida`;
                eficienciaBg = 'bg-rose-100 text-rose-700';
              }

              return (
                <tr key={ev.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">{ev.eventName}</td>
                  <td className="px-4 py-3 text-gray-500">{ev.state || 'N/A'} <span className="text-[10px] block text-gray-400">{ev.region}</span></td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-[#00205B] px-2 py-0.5 rounded-md text-[11px] font-medium border border-blue-100">
                      {ev.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-[#00205B]">{cuentas}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">
                    {saldoUsd > 0 ? `$${saldoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#FE5000]">
                    {gastoUsd > 0 ? `$${gastoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${eficienciaBg}`}>
                      {eficienciaLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No se encontraron jornadas para el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </ChartModalWrapper>
  );
}
