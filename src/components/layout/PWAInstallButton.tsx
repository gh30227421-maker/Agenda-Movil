"use client";

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Evita que el prompt se muestre automáticamente
      e.preventDefault();
      // Guarda el evento para poder dispararlo luego
      setDeferredPrompt(e);
      // Actualiza la UI para notificar que la app puede ser instalada
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("La aplicación ya está instalada en tu equipo o tu navegador gestiona la instalación directamente desde la barra de direcciones (busca el icono de instalación).");
      return;
    }
    
    // Muestra el prompt de instalación nativo
    deferredPrompt.prompt();
    
    // Espera a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('El usuario aceptó instalar la aplicación');
    }
    
    // El prompt no se puede usar de nuevo, límpialo
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <button
      onClick={handleInstallClick}
      className="relative px-4 py-3 w-full text-[13px] font-bold uppercase flex items-center justify-between transition-colors border-l-4 text-left text-gray-600 border-transparent hover:text-[#FE5000] hover:bg-orange-50 hover:border-[#FE5000]"
      title="Instalar App en el Escritorio"
    >
      <span>Instalar App de Escritorio</span>
      <Download className="w-4 h-4" />
    </button>
  );
}
