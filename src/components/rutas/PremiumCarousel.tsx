"use client";

import React, { useState, useEffect } from 'react';
import { Camera, MapPin } from 'lucide-react';

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  category?: string;
}

interface PremiumCarouselProps {
  photos: Photo[];
}

// Stock images de respaldo cuando no hay fotos reales del operativo
const FALLBACK_PHOTOS: Photo[] = [
  {
    id: 'fb-1',
    photo_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&q=80',
    caption: 'Atención personalizada en campo',
    category: 'Operativo',
  },
  {
    id: 'fb-2',
    photo_url: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=600&fit=crop&q=80',
    caption: 'Despliegue en comunidad urbana',
    category: 'Despliegue',
  },
  {
    id: 'fb-3',
    photo_url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop&q=80',
    caption: 'Asesoría financiera en calle',
    category: 'Inclusión',
  },
];

export default function PremiumCarousel({ photos }: PremiumCarouselProps) {
  const displayPhotos = photos.length > 0 ? photos : FALLBACK_PHOTOS;
  const isFallback = photos.length === 0;
  
  const [currentIndex, setCurrentIndex] = useState(0);

  // Efecto Autoplay Slider Cross-Fade (3.5 segundos por foto)
  useEffect(() => {
    if (displayPhotos.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayPhotos.length);
    }, 3500);
    
    return () => clearInterval(interval);
  }, [displayPhotos.length]);

  return (
    <div className="w-full relative mb-2 backdrop-blur-md bg-white/70 rounded-xl shadow-2xl shadow-slate-200/50 border border-white/60 p-3 overflow-hidden flex flex-col">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .animate-ken-burns {
          animation: kenBurns 20s ease-in-out infinite alternate;
        }
      `}} />
      {/* Badge si es fallback */}
      {isFallback && (
        <div className="flex items-center gap-1.5 mb-2 px-1 relative z-20">
          <Camera className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Galería en Campo</span>
          <span className="text-[9px] text-slate-300 ml-auto">Vista previa</span>
        </div>
      )}

      {/* Cross-Fade Slider Container */}
      <div className="relative w-full aspect-[16/10] bg-slate-200 rounded-xl overflow-hidden shadow-inner border border-slate-200/50">
        {displayPhotos.map((photo, index) => (
          <div 
            key={photo.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={photo.photo_url} 
              alt={photo.caption || 'Foto del operativo'} 
              className={`w-full h-full object-cover animate-ken-burns`}
              loading="lazy"
            />
            
            {/* Marco Glassmorphic Inferior */}
            {(photo.caption || photo.category) && (
              <div className="absolute bottom-0 left-0 w-full bg-black/40 backdrop-blur-md p-3 border-t border-white/10 flex items-center justify-between">
                <p className="text-white text-xs md:text-sm font-medium line-clamp-1 flex-1">
                  {photo.caption || 'Operativo en curso'}
                </p>
                {photo.category && (
                  <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider ml-2 flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded">
                    <MapPin className="w-3 h-3" /> {photo.category}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Indicadores de progreso (Dots) */}
        {displayPhotos.length > 1 && (
          <div className="absolute top-3 right-3 flex gap-1.5 z-20 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
            {displayPhotos.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
