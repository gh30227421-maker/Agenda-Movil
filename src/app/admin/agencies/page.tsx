import AgenciesImport from '@/components/admin/AgenciesImport';
import { Building2 } from 'lucide-react';

export const metadata = {
  title: 'Gestión de Agencias | Admin BNC',
};

export default function AgenciesAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#00205B] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#FE5000]" />
            Catálogo de Agencias
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra la información centralizada de agencias y centros de costos.
          </p>
        </div>
      </div>
      
      <AgenciesImport />
    </div>
  );
}
