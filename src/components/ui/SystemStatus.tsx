"use client";

import React, { useState, useEffect } from 'react';

export default function SystemStatus() {
  const [fechaActual, setFechaActual] = useState('');

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString('es-VE', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).toUpperCase();
    
    setFechaActual(formatted);
  }, []);

  return (
    <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">
      SISTEMA ACTIVO {fechaActual ? `| ${fechaActual}` : ''}
    </span>
  );
}
