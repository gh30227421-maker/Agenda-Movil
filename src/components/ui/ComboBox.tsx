"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface ComboBoxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  emptyText?: string;
  disabled?: boolean;
}

export default function ComboBox({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  icon,
  emptyText = 'No hay opciones',
  disabled = false,
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lower = searchTerm.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(lower));
  }, [options, searchTerm]);

  // Find the selected option's label
  const selectedLabel = useMemo(() => {
    const opt = options.find(o => o.value === value);
    return opt ? opt.label : placeholder;
  }, [options, value, placeholder]);

  return (
    <div className="relative w-full text-sm" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isOpen) setSearchTerm('');
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white border ${
          isOpen ? 'border-[#00205B] ring-2 ring-[#00205B]/20' : 'border-gray-200'
        } rounded-xl shadow-sm text-left transition-all duration-200 ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-[#00205B] cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-gray-500 shrink-0">{icon}</span>}
          <span className={`truncate font-medium ${value === 'todos' || !value ? 'text-gray-600' : 'text-gray-900'}`}>
            {selectedLabel}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-transparent rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#00205B] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-500">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const showGroupHeader = opt.group && (index === 0 || filteredOptions[index - 1].group !== opt.group);
                
                return (
                  <React.Fragment key={opt.value}>
                    {showGroupHeader && (
                      <div className="px-3 py-1.5 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 rounded-md">
                        {opt.group}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                        value === opt.value
                          ? 'bg-blue-50 text-[#00205B] font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {value === opt.value && <Check className="w-4 h-4 text-[#00205B] shrink-0" />}
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
