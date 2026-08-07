"use client";

import React, { useState, useRef } from 'react';
import { Maximize2, X, Download } from 'lucide-react';
import { toPng } from 'html-to-image';

interface ChartModalWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'bare';
}

export default function ChartModalWrapper({ title, subtitle, children, variant = 'default' }: ChartModalWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const modalChartRef = useRef<HTMLDivElement>(null);
  const cardChartRef = useRef<HTMLDivElement>(null);

  const downloadImage = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2, // High resolution
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

  const isBare = variant === 'bare';

  return (
    <>
      <div 
        ref={cardChartRef} 
        className={isBare 
          ? "flex flex-col h-full w-full relative group p-2 bg-transparent" 
          : "bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full relative group"
        }
      >
        {/* Encabezado */}
        <div className={`flex items-start justify-between ${isBare ? 'mb-2' : 'border-b border-gray-100 pb-4 mb-4'}`}>
          <div>
            <h3 className={`font-bold text-[#00205B] ${isBare ? 'text-sm text-center' : 'text-base'}`}>{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 hide-on-download">
            <button 
              onClick={() => downloadImage(cardChartRef, title)}
              className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-[#00205B] hover:bg-blue-50 transition-colors"
              title="Descargar PNG"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsExpanded(true)}
              className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-[#00205B] hover:bg-blue-50 transition-colors"
              title="Ampliar gráfico"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Contenido (Gráfico/Mapa) */}
        <div className={`flex-1 w-full h-full relative ${isBare ? 'min-h-[200px]' : 'min-h-[300px]'} flex items-center justify-center`}>
          {children}
        </div>
      </div>

      {/* Modal a Pantalla Completa */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8">
          <div ref={modalChartRef} className="bg-white rounded-3xl w-full h-full flex flex-col shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-[#00205B]">{title}</h2>
                {subtitle && <p className="text-gray-500">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2 hide-on-download">
                <button 
                  onClick={() => downloadImage(modalChartRef, title)}
                  className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                  title="Descargar"
                >
                  <Download className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                  title="Cerrar"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 w-full h-full min-h-[600px] p-6 overflow-hidden flex flex-col items-center justify-center bg-white rounded-b-3xl">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
