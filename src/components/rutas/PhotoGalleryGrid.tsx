"use client";

import React, { useState } from 'react';
import { ImageIcon, X, Image as ImageIcon2 } from 'lucide-react';

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  category?: string;
  created_at?: string;
}

interface PhotoGalleryGridProps {
  photos: Photo[];
  title?: string;
  subtitle?: string;
}

export default function PhotoGalleryGrid({ photos, title = "Galería en Campo", subtitle = "Registro Fotográfico de los Operativos" }: PhotoGalleryGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 w-full flex flex-col mt-4">
      <div className="flex flex-col mb-4">
        <h3 className="text-sm font-bold text-[#00205B] flex items-center gap-1.5 uppercase tracking-wide">
          <ImageIcon2 className="w-4 h-4 text-[#FE5000]" />
          {title}
        </h3>
        <p className="text-[11px] text-gray-500 font-medium">{subtitle}</p>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 px-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-gray-400 font-medium text-xs text-center">Sin registro fotográfico disponible</p>
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar snap-x">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className="group relative w-32 md:w-40 aspect-[4/3] shrink-0 bg-gray-100 rounded-lg overflow-hidden shadow-sm border border-gray-200 cursor-pointer snap-start"
              onClick={() => setSelectedPhoto(photo)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={photo.photo_url} 
                alt={photo.caption || 'Fotografía de Operativo'} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#00205B]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                {photo.caption && (
                  <p className="text-white text-[10px] leading-tight font-bold line-clamp-2 drop-shadow-md">
                    {photo.caption}
                  </p>
                )}
                <span className="text-[9px] text-[#FE5000] font-black uppercase mt-0.5 tracking-wider drop-shadow-md">
                  Ampliar
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10 backdrop-blur-md transition-all">
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-md transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative max-w-4xl w-full max-h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={selectedPhoto.photo_url} 
              alt={selectedPhoto.caption || 'Vista Ampliada'} 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
            />
            {selectedPhoto.caption && (
              <div className="mt-4 w-full text-center">
                <p className="text-white/90 text-sm md:text-base font-medium drop-shadow-lg max-w-2xl mx-auto">
                  {selectedPhoto.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
