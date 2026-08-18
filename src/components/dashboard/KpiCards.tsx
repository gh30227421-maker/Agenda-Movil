"use client";

import React from 'react';
import { DollarSign, CreditCard, Users, TrendingUp } from 'lucide-react';

interface KpiCardsProps {
  events: any[];
}

export default function KpiCards({ events }: KpiCardsProps) {
  const totalCuentas = events.reduce((acc, ev) => acc + (ev.cifras?.cuentasAbiertas || 0), 0);
  const totalTdd = events.reduce((acc, ev) => acc + (ev.cifras?.tdd || 0), 0);
  
  const totalSaldoUsd = events.reduce((acc, ev) => {
    const tasaBcv = ev.gastos?.tasaBcv || 1;
    const saldosBs = ev.cifras?.saldosCaptadosBs || 0;
    const saldoDivisas = ev.cifras?.saldoCierreDivisas || 0;
    const saldosUsd = (tasaBcv > 0 ? saldosBs / tasaBcv : 0) + saldoDivisas;
    return acc + saldosUsd;
  }, 0);

  const totalCostosUsd = events.reduce((acc, ev) => {
    const tieneGastos = !!ev.gastos;
    const tasaBcv = ev.gastos?.tasaBcv || 1;
    const costosUsdBase = ev.gastos?.totalUsd || 0;
    
    let costosBs = 0;
    if (tieneGastos) {
      const g = ev.gastos!;
      costosBs = g.alimentacionBs + g.hospedajeBs + g.transporteBs +
                 g.soporteTecnicoBs + g.bancaElectronicaBs + g.gastosTributariosBs +
                 g.conductorAyudanteBs + g.mantenimientoLimpiezaBs + (g.gastoCombustibleBs || 0);
    } else if (costosUsdBase > 0 && tasaBcv > 0) {
      costosBs = costosUsdBase * tasaBcv;
    }
    
    const finalCostUsd = tasaBcv > 0 ? costosBs / tasaBcv : 0;
    return acc + finalCostUsd;
  }, 0);

  const totalMargenUsd = totalSaldoUsd - totalCostosUsd;
  const rentabilidadGlobal = totalSaldoUsd > 0 ? (totalMargenUsd / totalSaldoUsd) * 100 : 0;

  const UMBRAL_RENTABLE = 35;
  const UMBRAL_LIMITE = 20;
  let estadoGlobal = 'No Rentable';
  if (totalSaldoUsd === 0) estadoGlobal = 'Sin Datos';
  else if (rentabilidadGlobal >= UMBRAL_RENTABLE) estadoGlobal = 'Rentable';
  else if (rentabilidadGlobal >= UMBRAL_LIMITE) estadoGlobal = 'Al Límite';

  const colorPalette = {
    'Rentable':    { badge: 'bg-green-50 text-[#009639] border-green-200', text: 'text-[#009639]', iconBg: 'bg-green-50' },
    'Al Límite':   { badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'text-yellow-700', iconBg: 'bg-yellow-50' },
    'No Rentable': { badge: 'bg-red-50 text-red-600 border-red-200', text: 'text-red-600', iconBg: 'bg-red-50' },
    'Sin Datos':   { badge: 'bg-gray-50 text-gray-400 border-gray-200', text: 'text-gray-400', iconBg: 'bg-gray-50' },
  };
  const color = colorPalette[estadoGlobal as keyof typeof colorPalette];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
      {/* Cuentas Captadas */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cuentas Captadas</p>
          <h3 className="text-2xl font-bold text-[#00205B] mt-1">{totalCuentas.toLocaleString('de-DE')}</h3>
          <p className="text-xs text-gray-400 mt-1">Nuevas aperturas</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#00205B]">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* TDDs Entregadas */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">TDDs Entregadas</p>
          <h3 className="text-2xl font-bold text-[#00205B] mt-1">{totalTdd.toLocaleString('de-DE')}</h3>
          <p className="text-xs text-gray-400 mt-1">Tarjetas físicas</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <CreditCard className="w-6 h-6" />
        </div>
      </div>

      {/* Saldo Total Captado (USD) */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Cierre Total ($)</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            ${totalSaldoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Convertido Tasa Prom. BCV</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* Costo Operativo Total (USD) */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gasto Operaciones</p>
          <h3 className="text-2xl font-bold text-[#FE5000] mt-1">
            ${totalCostosUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Viáticos & Gastos Esp.</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#FE5000]">
          <CreditCard className="w-6 h-6" />
        </div>
      </div>

      {/* Margen Operativo Global */}
      <div className="bg-[#00205B] rounded-2xl p-5 text-white shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">Margen Est. (USD)</p>
          <h3 className="text-2xl font-bold text-white mt-1">
            ${totalMargenUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-blue-300 mt-1">
            Saldo Total - Gastos
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
          <DollarSign className="w-6 h-6 text-[#FE5000]" />
        </div>
      </div>
      
      {/* Rentabilidad Global (%) OCULTA TEMPORALMENTE
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${color.iconBg.replace('bg-', 'bg-').replace('50', '500')}`} />
        <div className="pl-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rentabilidad Global</p>
          <h3 className={`text-2xl font-bold mt-1 ${color.text}`}>
            {totalSaldoUsd > 0 ? `${rentabilidadGlobal.toFixed(1)}%` : '0.0%'}
          </h3>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${color.badge}`}>
            {estadoGlobal}
          </span>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.iconBg} ${color.text}`}>
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>
      */}
    </div>
  );
}
