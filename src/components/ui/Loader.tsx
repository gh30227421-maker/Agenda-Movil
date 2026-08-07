import { Truck, Wifi } from 'lucide-react';

export default function Loader({ text = 'Conectando...', fullScreen = false }: { text?: string, fullScreen?: boolean }) {
  const containerClasses = fullScreen 
    ? 'flex flex-col items-center justify-center h-screen w-full bg-gray-50 space-y-6' 
    : 'flex flex-col items-center justify-center min-h-[400px] space-y-6 w-full';

  return (
    <div className={containerClasses}>
      <div className='relative flex items-center justify-center w-24 h-24 flex-shrink-0 animate-bounce'>
        <Wifi className='absolute -top-2 w-12 h-12 text-[#FE5000] animate-ping drop-shadow-md opacity-80' />
        <Truck className='absolute bottom-0 w-20 h-20 text-[#00205B] drop-shadow-lg' />
      </div>
      <p className='text-[#00205B] font-bold text-lg animate-pulse tracking-wide uppercase'>{text}</p>
    </div>
  );
}
