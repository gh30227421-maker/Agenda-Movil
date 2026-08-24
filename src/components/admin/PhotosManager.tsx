"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { Loader2, Upload, Trash2, Image as ImageIcon, Search, Video } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Event {
  id: string;
  event_name: string;
  event_type: string;
  start_date: string;
  photo_count?: number;
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
  const [videoUploading, setVideoUploading] = useState(false);
  const [agenciaVideoUploading, setAgenciaVideoUploading] = useState(false);
  const [agenciaVideoPreviewTimestamp, setAgenciaVideoPreviewTimestamp] = useState(Date.now());
  
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: (() => void) | null, title: string, message: string}>({
    isOpen: false,
    action: null,
    title: '',
    message: ''
  });
  
  const [unidadVideos, setUnidadVideos] = useState<string[]>([]);
  const [agenciaVideos, setAgenciaVideos] = useState<string[]>([]);

  const fetchVideosList = async () => {
    try {
      const { data } = await supabase.storage.from('event_photos').list('');
      if (data) {
        const u = data.filter(f => f.name.startsWith('unidad-oficial-video') && f.name.endsWith('.mp4')).map(f => f.name);
        const a = data.filter(f => f.name.startsWith('agencia-movil-video') && f.name.endsWith('.mp4')).map(f => f.name);
        setUnidadVideos(u);
        setAgenciaVideos(a);
      }
    } catch (e) {
      console.error('Error fetching video list', e);
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const agenciaVideoInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEvents();
    fetchVideosList();
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
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, event_name, event_type, start_date')
        .order('start_date', { ascending: false });

      if (eventsError) throw eventsError;

      const { data: photosData, error: photosError } = await supabase
        .from('event_photos')
        .select('event_id');

      let enrichedEvents = eventsData || [];
      
      if (!photosError && photosData) {
        const counts = photosData.reduce((acc: Record<string, number>, curr) => {
          if (curr.event_id) {
            acc[curr.event_id] = (acc[curr.event_id] || 0) + 1;
          }
          return acc;
        }, {});
        
        enrichedEvents = enrichedEvents.map(ev => ({
          ...ev,
          photo_count: counts[ev.id] || 0
        }));
      } else {
        enrichedEvents = enrichedEvents.map(ev => ({ ...ev, photo_count: 0 }));
      }

      // Ordenar: Primero los que tienen fotos (recientes primero), luego los que no (recientes primero)
      enrichedEvents.sort((a, b) => {
        const aHasPhotos = (a.photo_count || 0) > 0;
        const bHasPhotos = (b.photo_count || 0) > 0;
        
        if (aHasPhotos && !bHasPhotos) return -1;
        if (!aHasPhotos && bHasPhotos) return 1;
        
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      });

      setEvents(enrichedEvents);
    } catch (err) {
      showToast('Error al cargar los operativos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async (eventId: string) => {
    if (!eventId) return;
    
    try {
      const { data, error } = await supabase
        .from('event_photos')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      setPhotos(data || []);
    } catch (err: any) {
      console.error('Error detallado en fetchPhotos (Supabase):', err);
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (unidadVideos.length >= 3) {
      showToast('Límite de 3 videos alcanzado. Elimina uno primero.', 'info');
      return;
    }
    const file = e.target.files[0];
    
    if (file.size > 50 * 1024 * 1024) {
      showToast('El video es demasiado pesado. Máximo 50MB.', 'info');
      return;
    }

    try {
      setVideoUploading(true);
      const filename = `unidad-oficial-video-${Date.now()}.mp4`;
      const { error } = await supabase.storage
        .from('event_photos')
        .upload(filename, file, { upsert: true });

      if (error) throw error;
      
      showToast('Video institucional agregado exitosamente', 'success');
      fetchVideosList();
    } catch (err: any) {
      showToast(err.message || 'Error al agregar el video', 'error');
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleAgenciaVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (agenciaVideos.length >= 3) {
      showToast('Límite de 3 videos alcanzado. Elimina uno primero.', 'info');
      return;
    }
    const file = e.target.files[0];
    
    if (file.size > 50 * 1024 * 1024) {
      showToast('El video es demasiado pesado. Máximo 50MB.', 'info');
      return;
    }

    try {
      setAgenciaVideoUploading(true);
      const filename = `agencia-movil-video-${Date.now()}.mp4`;
      const { error } = await supabase.storage
        .from('event_photos')
        .upload(filename, file, { upsert: true });

      if (error) throw error;
      
      showToast('Video Agencia Móvil agregado exitosamente', 'success');
      fetchVideosList();
    } catch (err: any) {
      showToast(err.message || 'Error al agregar el video', 'error');
    } finally {
      setAgenciaVideoUploading(false);
      if (agenciaVideoInputRef.current) agenciaVideoInputRef.current.value = '';
    }
  };

  const handleDeleteVideo = (filename: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Video',
      message: '¿Está seguro de eliminar este video permanentemente? Esta acción no se puede deshacer.',
      action: async () => {
        try {
          const { error } = await supabase.storage.from('event_photos').remove([filename]);
          if (error) throw error;
          showToast('Video eliminado exitosamente', 'success');
          fetchVideosList();
        } catch (err: any) {
          showToast(err.message || 'Error al eliminar', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDelete = (photoId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Fotografía',
      message: '¿Está seguro de eliminar esta fotografía permanentemente? Esta acción no se puede deshacer.',
      action: async () => {
        try {
          // Obtener foto para extraer el nombre del archivo en storage
          const { data: photo, error: fetchError } = await supabase
            .from('event_photos')
            .select('photo_url')
            .eq('id', photoId)
            .single();

          if (fetchError || !photo) {
            throw new Error('Foto no encontrada');
          }

          // Extraer nombre de archivo del public URL (ej: UUID.jpg)
          const urlParts = photo.photo_url.split('/event_photos/');
          if (urlParts.length > 1) {
            const storagePath = urlParts[1];
            await supabase.storage.from('event_photos').remove([storagePath]);
          }

          // Eliminar de base de datos
          const { error: dbError } = await supabase.from('event_photos').delete().eq('id', photoId);
          if (dbError) throw dbError;
          
          showToast('Fotografía eliminada', 'success');
          setPhotos(prev => prev.filter(p => p.id !== photoId));
        } catch (err: any) {
          showToast(err.message || 'Error al eliminar la fotografía', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
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
    <div className="flex flex-col gap-6 w-full relative">
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          if (confirmModal.action) confirmModal.action();
        }}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
      
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

      {/* SECCIÓN NUEVA: VIDEO INSTITUCIONAL */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 mt-2">
        {/* Video Unidad Móvil */}
        <div className="w-full md:w-1/2 flex flex-col xl:flex-row gap-6 items-start border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
          <div className="w-full xl:w-1/2 flex gap-2 overflow-x-auto custom-scrollbar pb-2">
            {unidadVideos.length > 0 ? unidadVideos.map((filename, i) => (
              <div key={filename} className="w-32 aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative group shrink-0">
                <video 
                  src={supabase.storage.from('event_photos').getPublicUrl(filename).data.publicUrl} 
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <div className="absolute top-1 left-1 bg-[#FE5000] text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 pointer-events-none">
                  {i + 1}/3
                </div>
                <button
                  onClick={() => handleDeleteVideo(filename)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-full transition-all z-20 shadow-md"
                  title="Eliminar video"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )) : (
              <div className="w-32 aspect-[9/16] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-2 shrink-0">
                <Video className="w-6 h-6 mb-2 opacity-20" />
                <span className="text-[10px] text-center font-medium">Sin videos</span>
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="text-md font-bold text-gray-800 mb-2 flex items-center gap-2"><Video className="w-5 h-5 text-[#00205B]" /> Unidad Móvil</h3>
            <p className="text-xs text-gray-500 mb-4">
              Se reproducen a la derecha del mapa superior. ({unidadVideos.length}/3 agregados) (Formatos: MP4, Max 50MB).
            </p>
            <input type="file" accept="video/mp4,video/quicktime" className="hidden" ref={videoInputRef} onChange={handleVideoUpload} />
            <button onClick={() => videoInputRef.current?.click()} disabled={videoUploading || unidadVideos.length >= 3} className="flex justify-center items-center gap-2 bg-[#00205B] hover:bg-[#00153B] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50">
              {videoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {videoUploading ? 'Agregando...' : 'Agregar Video'}
            </button>
          </div>
        </div>

        {/* Video Agencia Móvil */}
        <div className="w-full md:w-1/2 flex flex-col xl:flex-row gap-6 items-start pl-0 md:pl-2">
          <div className="w-full xl:w-1/2 flex gap-2 overflow-x-auto custom-scrollbar pb-2">
            {agenciaVideos.length > 0 ? agenciaVideos.map((filename, i) => (
              <div key={filename} className="w-32 aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative group shrink-0">
                <video 
                  src={supabase.storage.from('event_photos').getPublicUrl(filename).data.publicUrl} 
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <div className="absolute top-1 left-1 bg-[#009639] text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 pointer-events-none">
                  {i + 1}/3
                </div>
                <button
                  onClick={() => handleDeleteVideo(filename)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-full transition-all z-20 shadow-md"
                  title="Eliminar video"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )) : (
              <div className="w-32 aspect-[9/16] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-2 shrink-0">
                <Video className="w-6 h-6 mb-2 opacity-20" />
                <span className="text-[10px] text-center font-medium">Sin videos</span>
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="text-md font-bold text-gray-800 mb-2 flex items-center gap-2"><Video className="w-5 h-5 text-[#009639]" /> Agencia Móvil</h3>
            <p className="text-xs text-gray-500 mb-4">
              Se reproducen a la derecha del mapa inferior. ({agenciaVideos.length}/3 agregados) (Formatos: MP4, Max 50MB).
            </p>
            <input type="file" accept="video/mp4,video/quicktime" className="hidden" ref={agenciaVideoInputRef} onChange={handleAgenciaVideoUpload} />
            <button onClick={() => agenciaVideoInputRef.current?.click()} disabled={agenciaVideoUploading || agenciaVideos.length >= 3} className="flex justify-center items-center gap-2 bg-[#009639] hover:bg-[#007A2E] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50">
              {agenciaVideoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {agenciaVideoUploading ? 'Agregando...' : 'Agregar Video'}
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
              className={`w-full text-left p-3 rounded-xl border transition-all text-sm relative ${
                selectedEventId === ev.id 
                  ? 'border-[#FE5000] bg-orange-50/50 shadow-sm' 
                  : 'border-gray-100 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-semibold text-gray-900 leading-tight pr-14">{ev.event_name}</div>
              
              {ev.photo_count && ev.photo_count > 0 ? (
                <div className="absolute top-2.5 right-2.5 bg-[#FE5000]/10 text-[#FE5000] px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-[#FE5000]/20 shadow-sm" title={`${ev.photo_count} foto(s)`}>
                  <ImageIcon className="w-3 h-3" />
                  <span className="text-[10px] font-bold">{ev.photo_count}</span>
                </div>
              ) : null}

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
