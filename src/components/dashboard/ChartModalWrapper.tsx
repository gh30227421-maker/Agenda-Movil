"use client";

import React, { useState } from 'react';
import { Maximize2, X } from 'lucide-react';

interface ChartModalWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function ChartModalWrapper({ title, subtitle, children }: ChartModalWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col h-full relative group">
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
          <div>
            <h3 className="font-bold text-[#00205B] text-base">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <button 
            onClick={() => setIsExpanded(true)}
            className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-[#00205B] hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
            title="Ampliar gráfico"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        
        {/* Contenido (Gráfico/Mapa) */}
        <div className="flex-1 w-full h-full relative min-h-[300px] flex items-center justify-center">
          {children}
        </div>
      </div>

      {/* Modal a Pantalla Completa */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8">
          <div className="bg-white rounded-3xl w-full h-full flex flex-col shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-[#00205B]">{title}</h2>
                {subtitle && <p className="text-gray-500">{subtitle}</p>}
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                title="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 w-full h-full p-6 overflow-hidden flex flex-col items-center justify-center">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
