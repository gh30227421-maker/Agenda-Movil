"use client";

import React, { useState, useRef, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Maximize2, X, Download } from 'lucide-react';
import { toPng } from 'html-to-image';

interface CostosParticipacionUnidadChartProps {
  events: any[];
}

export default function CostosParticipacionUnidadChart({ events }: CostosParticipacionUnidadChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    let countUnidad = 0;
    let totalAgencia = 0;
    let totalUnidad = 0;

    events.forEach(ev => {
      const g = ev.gastos;
      if (!g) return;
      const tasa = g.tasaBcv || 1;
      const totalEv = ((g.alimentacionBs || 0) + (g.transporteBs || 0) + (g.hospedajeBs || 0) + 
                       (g.soporteTecnicoBs || 0) + (g.bancaElectronicaBs || 0) + (g.gastosTributariosBs || 0) + 
                       (g.conductorAyudanteBs || 0) + (g.mantenimientoLimpiezaBs || 0)) / tasa;

      if (ev.type === 'Agencia Móvil') {
        totalAgencia += totalEv;
      } else if (ev.type === 'Unidad Móvil') {
        countUnidad++;
        totalUnidad += totalEv;
      }
    });

    const totalGlobal = totalAgencia + totalUnidad || 1;

    return {
      total: totalUnidad,
      promedio: countUnidad > 0 ? totalUnidad / countUnidad : 0,
      pct: Math.round((totalUnidad / totalGlobal) * 100)
    };
  }, [events]);

  const downloadImage = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        filter: (node: HTMLElement) => {
          if (node.classList && node.classList.contains('hide-on-download')) {
            return false;
          }
          return true;
        },
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: ref.current.offsetWidth + 'px',
          height: ref.current.offsetHeight + 'px',
        }
      });
      const link = document.createElement('a');
      link.download = `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error al generar la imagen', err);
    }
  };

  const chartData = [
    { name: 'Unidad Móvil', value: stats.pct },
    { name: 'Otros', value: 100 - stats.pct }
  ];

  return (
    <>
      <div 
        ref={cardRef} 
        className="flex flex-col items-center justify-center relative w-full p-3 bg-white rounded-xl group transition-all"
      >
        {/* Header con Título y Botones Independientes */}
        <div className="w-full flex items-center justify-between mb-2 px-1">
          <h4 className="text-sm font-bold text-[#00205B]">Unidad Móvil</h4>
          <div className="flex items-center gap-1 hide-on-download">
            <button 
              onClick={() => downloadImage(cardRef, 'Participacion_Costos_Unidad_Movil')}
              className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-[#00205B] hover:bg-blue-50 transition-colors"
              title="Descargar PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setIsExpanded(true)}
              className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-[#00205B] hover:bg-blue-50 transition-colors"
              title="Ampliar gráfico"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Gráfico Donut */}
        <div className="relative w-44 h-44 my-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="#426095" />
                <Cell fill="#E5E7EB" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-3xl font-black text-[#426095]">{stats.pct}%</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider -mt-0.5">Participación</span>
          </div>
        </div>

        {/* Métricas Inferiores */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500 font-medium">Gasto Promedio / Jornada</p>
          <p className="font-bold text-base text-gray-800">
            ${stats.promedio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Modal a Pantalla Completa para Unidad Móvil */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8">
          <div ref={modalRef} className="bg-white rounded-3xl w-full max-w-4xl flex flex-col shadow-2xl relative animate-in fade-in zoom-in duration-200 p-8">
            <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#00205B]">Participación Costos: Unidad Móvil</h2>
                <p className="text-sm text-gray-500 mt-1">Comparativa frente al gasto global del canal</p>
              </div>
              <div className="flex items-center gap-2 hide-on-download">
                <button 
                  onClick={() => downloadImage(modalRef, 'Participacion_Costos_Unidad_Movil_HD')}
                  className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                  title="Descargar PNG"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-80 h-80 my-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={110}
                      outerRadius={145}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#426095" />
                      <Cell fill="#E5E7EB" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-6xl font-black text-[#426095]">{stats.pct}%</span>
                  <span className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Participación</span>
                </div>
              </div>

              <div className="mt-6 text-center bg-gray-50 px-8 py-4 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-500 font-medium">Gasto Promedio por Jornada Operativa</p>
                <p className="font-black text-2xl text-gray-800 mt-1">
                  ${stats.promedio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
