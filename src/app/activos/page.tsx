import React from 'react';
import ActivosSection from '@/components/activos/ActivosSection';
import { AssetsProvider } from '@/context/AssetsContext';
import { AgendaProvider } from '@/context/AgendaContext'; // Activos needs employees and agencies
import AuthGuard from '@/components/layout/AuthGuard';

export const metadata = {
  title: 'Activos | Banca Unidad Móvil',
  description: 'Gestión y control de inventario tecnológico',
};

export default function ActivosPage() {
  return (
    <AuthGuard>
      <AgendaProvider>
        <AssetsProvider>
          <div className="py-8 bg-gray-50/50 min-h-screen">
            <ActivosSection />
          </div>
        </AssetsProvider>
      </AgendaProvider>
    </AuthGuard>
  );
}
