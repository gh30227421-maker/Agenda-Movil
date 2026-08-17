import PhotosManager from '@/components/admin/PhotosManager';
import { ImageIcon } from 'lucide-react';

export const metadata = {
  title: 'Galería de Eventos | Admin BNC',
};

export default function PhotosAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#00205B] flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#FE5000]" />
            Galería de Fotografías de Operativos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sube y administra el registro fotográfico asociado a cada evento de la Unidad y Agencia Móvil.
          </p>
        </div>
      </div>
      
      <PhotosManager />
    </div>
  );
}
