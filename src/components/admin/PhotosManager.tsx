"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { Loader2, Upload, Trash2, Image as ImageIcon, Search } from 'lucide-react';

interface Event {
  id: string;
  event_name: string;
  event_type: string;
  start_date: string;
}

interface Photo {
  id: string;
  photo_url: string;
  caption: string;
  category: string;
  created_at: string;
}

export default function PhotosManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverPreviewTimestamp, setCoverPreviewTimestamp] = useState(Date.now());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchPhotos(selectedEventId);
    } else {
      setPhotos([]);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('id, event_name, event_type, start_date')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      showToast('Error al cargar los operativos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/photos?event_id=${eventId}`);
      const json = await res.json();
      if (json.data) {
        setPhotos(json.data);
      }
    } catch (err) {
      showToast('Error al cargar la galería', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!selectedEventId) {
      showToast('Debe seleccionar un operativo primero', 'info');
      return;
    }

    const file = e.target.files[0];
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen es demasiado pesada. Máximo 5MB.', 'info');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('event_id', selectedEventId);
    formData.append('caption', '');
    formData.append('category', 'General');

    try {
      setUploading(true);
      const res = await fetch('/api/events/photos', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al subir la foto');
      
      showToast('Fotografía subida exitosamente', 'success');
      fetchPhotos(selectedEventId);
    } catch (err: any) {
      showToast(err.message || 'Error en la carga', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen es demasiado pesada. Máximo 5MB.', 'info');
      return;
    }

    try {
      setCoverUploading(true);
      const { data, error } = await supabase.storage
        .from('event_photos')
        .upload('unidad-oficial-cover.jpg', file, { 
          upsert: true,
          cacheControl: '10'
        });

      if (error) throw error;
      
      showToast('Portada institucional actualizada exitosamente', 'success');
      // Update timestamp to bypass browser cache for the new image preview
      setCoverPreviewTimestamp(Date.now());
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar la portada', 'error');
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta fotografía permanentemente?')) return;

    try {
      const res = await fetch(`/api/events/photos?id=${photoId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      
      showToast('Fotografía eliminada', 'success');
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredEvents = events.filter(e => 
    e.event_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && events.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-2xl shadow-sm border border-gray-100">
        <Loader2 className="w-8 h-8 text-[#FE5000] animate-spin" />
      </div>
    );
  }

  const coverUrl = `${supabase.storage.from('event_photos').getPublicUrl('unidad-oficial-cover.jpg').data.publicUrl}?t=${coverPreviewTimestamp}`;

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* SECCIÓN NUEVA: PORTADAS INSTITUCIONALES */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-[#00205B] flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#FE5000]" />
            Gestión de Portadas Institucionales
          </h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* Preview */}
          <div className="w-full md:w-1/3 aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative group flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={coverUrl} 
              alt="Portada Oficial" 
              className="w-full h-full object-cover"
              onError={(e) => {
                 e.currentTarget.style.opacity = '0';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none">
              <p className="text-white font-bold text-sm">Portada Actual</p>
            </div>
            <div className="absolute top-2 left-2 bg-[#FE5000] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10 pointer-events-none">
              UNIDAD MÓVIL
            </div>
          </div>

          {/* Acciones */}
          <div className="flex-1">
            <h3 className="text-md font-bold text-gray-800 mb-2">Portada Oficial Unidad Móvil</h3>
            <p className="text-sm text-gray-500 mb-4">
              Esta imagen se muestra de manera fija en la página pública "Rutas y Despliegues".
              Al subir una nueva imagen, reemplazará automáticamente a la anterior en toda la plataforma. Se recomienda usar formato JPG o PNG apaisado (16:9).
            </p>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={coverInputRef} 
              onChange={handleCoverUpload}
            />
            <button 
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="flex items-center gap-2 bg-[#00205B] hover:bg-[#00153B] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {coverUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {coverUploading ? 'Actualizando Portada...' : 'Actualizar Portada Oficial'}
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN EXISTENTE: GALERÍA DE OPERATIVOS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col md:flex-row gap-6">
      
      {/* Columna Izquierda: Selección de Operativo */}
      <div className="w-full md:w-1/3 flex flex-col gap-4 border-r border-gray-100 pr-6">
        <h2 className="text-lg font-bold text-[#00205B] flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          Seleccionar Operativo
        </h2>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#FE5000] focus:border-transparent outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        </div>

        <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar space-y-2 pr-2">
          {filteredEvents.map(ev => (
            <button
              key={ev.id}
              onClick={() => setSelectedEventId(ev.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${
                selectedEventId === ev.id 
                  ? 'border-[#FE5000] bg-orange-50/50 shadow-sm' 
                  : 'border-gray-100 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-semibold text-gray-900 leading-tight">{ev.event_name}</div>
              <div className="flex justify-between items-center mt-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${ev.event_type === 'Unidad Móvil' ? 'bg-[#FE5000]/10 text-[#FE5000]' : 'bg-[#00205B]/10 text-[#00205B]'}`}>
                  {ev.event_type}
                </span>
                <span className="text-[10px] text-gray-500">
                  {new Date(ev.start_date).toLocaleDateString('es-VE')}
                </span>
              </div>
            </button>
          ))}
          {filteredEvents.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-4">No se encontraron operativos.</div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Galería y Upload */}
      <div className="w-full md:w-2/3 flex flex-col">
        {!selectedEventId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <ImageIcon className="w-16 h-16 mb-4 text-gray-200" />
            <p className="text-lg font-medium">Seleccione un operativo para gestionar sus fotos</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-[#00205B]">Galería del Operativo</h2>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-[#FE5000] hover:bg-[#E04700] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Subir Fotografía
              </button>
            </div>

            {photos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <ImageIcon className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium text-sm">Este operativo aún no tiene fotografías registradas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] custom-scrollbar p-1">
                {photos.map(photo => (
                  <div key={photo.id} className="group relative aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={photo.photo_url} 
                      alt="Operativo" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => handleDelete(photo.id)}
                        className="bg-white/10 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                        title="Eliminar fotografía"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      </div>
    </div>
  );
}
