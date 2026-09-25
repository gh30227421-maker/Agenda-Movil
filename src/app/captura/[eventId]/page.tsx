import React from 'react';
import CapturaFormClient from './CapturaFormClient';

export const metadata = {
  title: 'BNC Captura en Vivo',
  description: 'Formulario de registro para promotores en campo.',
};

export default async function CapturaPage({ params }: { params: Promise<{ eventId: string }> }) {
  const resolvedParams = await params;
  return <CapturaFormClient eventId={resolvedParams.eventId} />;
}
