import { Suspense } from 'react';
import MonitoreoVivoClient from './MonitoreoVivoClient';

export const metadata = {
  title: 'Gestión en Vivo | BNC',
};

export default function GestionEnVivoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Cargando...</div>}>
      <MonitoreoVivoClient />
    </Suspense>
  );
}
