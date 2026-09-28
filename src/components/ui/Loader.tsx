import { Truck, Wifi } from 'lucide-react';

export default function Loader({ text = 'Conectando...', fullScreen = false }: { text?: string, fullScreen?: boolean }) {
  const containerClasses = fullScreen 
    ? 'flex flex-col items-center justify-center h-screen w-full bg-gray-50 space-y-6' 
    : 'flex flex-col items-center justify-center min-h-[400px] space-y-6 w-full';

  return (
    <div className={containerClasses}>
      <div className='relative flex items-center justify-center w-40 h-40 flex-shrink-0 mb-4'>
        {/* Anillos de carga animados */}
        <div className="absolute inset-0 border-4 border-[#FE5000]/20 border-t-[#FE5000] rounded-full animate-[spin_2s_linear_infinite] shadow-[0_0_20px_rgba(254,80,0,0.4)]" />
        <div className="absolute inset-3 border-4 border-[#00205B]/20 border-b-[#00205B] rounded-full animate-[spin_3s_linear_infinite_reverse]" />
        
        {/* Glow de fondo */}
        <div className="absolute inset-0 bg-[#FE5000]/5 rounded-full blur-2xl scale-150 animate-pulse"></div>
        
        {/* Imagen central */}
        <img src="/unidad movil.png" alt="Unidad Móvil BNC" className="relative z-10 w-32 h-32 object-contain drop-shadow-2xl animate-pulse" />
      </div>
      <p className='text-[#00205B] font-black text-lg animate-pulse tracking-widest uppercase relative z-10'>{text}</p>
    </div>
  );
}
