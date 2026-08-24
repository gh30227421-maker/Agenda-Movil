import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Sí, Eliminar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
          
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl transition-colors border border-gray-200"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 px-4 bg-[#FE5000] hover:bg-[#E04700] text-white font-bold text-sm rounded-xl shadow-md shadow-[#FE5000]/20 transition-all transform hover:scale-[1.02]"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
