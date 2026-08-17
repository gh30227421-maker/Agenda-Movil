import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table as TableIcon, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
  onExportExcel: () => void;
  onExportPDF: () => void;
  className?: string;
}

export default function ExportDropdown({ onExportExcel, onExportPDF, className = '' }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
      >
        <Download className="w-4 h-4 text-[#00205B]" />
        <span>Exportar</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 w-48 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 flex flex-col animate-in fade-in slide-in-from-top-2">
          <button
            type="button"
            onClick={() => {
              onExportPDF();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FE5000] transition-colors w-full text-left"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar como PDF</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              onExportExcel();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#009639] transition-colors w-full text-left"
          >
            <TableIcon className="w-4 h-4" />
            <span>Exportar como Excel</span>
          </button>
        </div>
      )}
    </div>
  );
}
