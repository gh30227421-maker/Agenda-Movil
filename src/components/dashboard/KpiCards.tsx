"use client";

import React from 'react';
import { DollarSign, CreditCard, Users, TrendingUp, FileText, BarChart2, Receipt, CalendarDays } from 'lucide-react';

interface KpiCardsProps {
  events: any[];
  mode?: 'operativo' | 'financiero' | 'all';
}

export default function KpiCards({ events, mode = 'all' }: KpiCardsProps) {
  const totalCuentas = events.reduce((acc, ev) => acc + (ev.cifras?.cuentasAbiertas || 0), 0);
  const totalTdd = events.reduce((acc, ev) => acc + (ev.cifras?.tdd || 0), 0);
  
  const totalOtrasOps = events.reduce((acc, ev) => acc + (ev.cifras?.reclamos || 0) + (ev.cifras?.atmCambioClave || 0), 0);
  
  const totalAtmConsultas = events.reduce((acc, ev) => acc + (ev.cifras?.atmConsultas || 0), 0);
  const totalAtmRetiros = events.reduce((acc, ev) => acc + (ev.cifras?.atmRetiros || 0), 0);
  const totalAtmCambioClave = events.reduce((acc, ev) => acc + (ev.cifras?.atmCambioClave || 0), 0);
  const totalAtm = totalAtmConsultas + totalAtmRetiros + totalAtmCambioClave;
  
  const totalVentaPos = events.reduce((acc, ev) => acc + (ev.cifras?.ventaPos || 0), 0);

  const totalJornadas = events.length;
  const promedioCuentas = totalJornadas > 0 ? Math.round(totalCuentas / totalJornadas) : 0;
  const promedioTdd = totalJornadas > 0 ? Math.round(totalTdd / totalJornadas) : 0;
  
  const totalSaldoUsd = events.reduce((acc, ev) => {
    const tasaBcv = ev.gastos?.tasaBcv || ev.tasaBcvRentabilidad || 0;
    const saldosBs = ev.cifras?.saldosCaptadosBs || 0;
    const saldoDivisas = ev.cifras?.saldoCierreDivisas || 0;
    const saldosUsd = (tasaBcv > 0 ? saldosBs / tasaBcv : 0) + saldoDivisas;
    return acc + saldosUsd;
  }, 0);

  const totalCostosUsd = events.reduce((acc, ev) => {
    // Regla de Negocio: Red de Agencias no genera gastos. 
    // Ignoramos cualquier registro residual o de prueba que tengan estas agencias en la BD.
    const isMobile = ev.type === 'Agencia Móvil' || ev.type === 'Unidad Móvil';
    if (isMobile) {
      return acc + (ev.gastos?.totalUsd || 0);
    }
    return acc;
  }, 0);

  const totalMargenUsd = totalSaldoUsd - totalCostosUsd;
  const rentabilidadGlobal = totalSaldoUsd > 0 ? (totalMargenUsd / totalSaldoUsd) * 100 : 0;
  const promedioSaldoCuenta = totalCuentas > 0 ? (totalSaldoUsd / totalCuentas) : 0;

  // Jornadas móviles que incurren en viáticos / gastos operativos
  const jornadasMoviles = events.filter(ev => ev.type === 'Agencia Móvil' || ev.type === 'Unidad Móvil');
  const totalJornadasMoviles = jornadasMoviles.length;
  const promedioGastoJornada = totalJornadasMoviles > 0 ? (totalCostosUsd / totalJornadasMoviles) : 0;

  // Meses únicos con operativos móviles para el promedio mensual
  const distinctMonths = new Set<string>();
  jornadasMoviles.forEach(ev => {
    if (ev.startDate) {
      distinctMonths.add(ev.startDate.substring(0, 7)); // YYYY-MM
    }
  });

  // Excluir el mes en curso (que está corriendo) para calcular el promedio mensual contra meses cerrados
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const closedMonths = Array.from(distinctMonths).filter(m => m < currentMonthStr);
  const mesesDivisor = closedMonths.length > 0 ? closedMonths.length : distinctMonths.size;
  const gastosMesesCerrados = jornadasMoviles
    .filter(ev => ev.startDate && (closedMonths.length === 0 || ev.startDate.substring(0, 7) < currentMonthStr))
    .reduce((acc, ev) => acc + (ev.gastos?.totalUsd || 0), 0);
  const gastoBase = closedMonths.length > 0 && gastosMesesCerrados > 0 ? gastosMesesCerrados : totalCostosUsd;
  const promedioGastoMensual = mesesDivisor > 0 ? (gastoBase / mesesDivisor) : 0;

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

  const gridColsClass = 'xl:grid-cols-6';

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gridColsClass} gap-3 xl:gap-3.5`}>
      {/* Cuentas Abiertas */}
      {(mode === 'all' || mode === 'operativo') && (
      <div className="bg-white rounded-xl p-3.5 xl:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
        <div>
          <p className="text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cuentas Abiertas</p>
          <h3 className="text-xl xl:text-2xl font-black text-[#00205B] mt-0.5">{totalCuentas.toLocaleString('de-DE')}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Nuevas aperturas</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#00205B] shrink-0">
          <Users className="w-5 h-5" />
        </div>
      </div>
      )}

      {/* TDDs Entregadas */}
      {(mode === 'all' || mode === 'operativo') && (
      <div className="bg-white rounded-xl p-3.5 xl:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
        <div>
          <p className="text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wider">TDDs Entregadas</p>
          <h3 className="text-xl xl:text-2xl font-black text-[#00205B] mt-0.5">{totalTdd.toLocaleString('de-DE')}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Tarjetas físicas</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
          <CreditCard className="w-5 h-5" />
        </div>
      </div>
      )}

      {/* Otras Operaciones */}
      {(mode === 'all' || mode === 'operativo') && (
      <div className="bg-white rounded-xl p-3.5 xl:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
        <div>
          <p className="text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Otras Operaciones</p>
          <h3 className="text-xl xl:text-2xl font-black text-[#00205B] mt-0.5">{totalOtrasOps.toLocaleString('de-DE')}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Gestiones secundarias</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
          <FileText className="w-5 h-5" />
        </div>
      </div>
      )}

      {/* Promedios por Jornada */}
      {(mode === 'all' || mode === 'operativo') && (
      <div className="bg-white rounded-xl p-3.5 xl:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
        <div>
          <p className="text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Promedios por Jornada</p>
          <h3 className="text-lg xl:text-xl font-black text-[#00205B] mt-0.5">
            {promedioCuentas} <span className="text-xs font-normal text-slate-400">Ctas</span> / {promedioTdd} <span className="text-xs font-normal text-slate-400">TDDs</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Aperturas y entregas</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
          <BarChart2 className="w-5 h-5" />
        </div>
      </div>
      )}

      {/* Operaciones ATM */}
      {(mode === 'all' || mode === 'operativo') && (
      <div className="bg-white rounded-xl p-3.5 xl:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
        <div>
          <p className="text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Operaciones ATM</p>
          <h3 className="text-xl xl:text-2xl font-black text-[#00205B] mt-0.5">{totalAtm.toLocaleString('de-DE')}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Operaciones procesadas</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-[#FE5000] shrink-0">
          <CreditCard className="w-5 h-5" />
        </div>
      </div>
      )}

      {/* Venta de POS */}
      {(mode === 'all' || mode === 'operativo') && (
      <div className="bg-white rounded-xl p-3.5 xl:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
        <div>
          <p className="text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Venta de POS</p>
          <h3 className="text-xl xl:text-2xl font-black text-[#00205B] mt-0.5">{totalVentaPos.toLocaleString('de-DE')}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Equipos comercializados</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>
      )}

      {/* 1. Saldo Total Captado (USD) */}
      {(mode === 'all' || mode === 'financiero') && (
      <div className="bg-white rounded-xl p-3.5 xl:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
        <div>
          <p className="text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap truncate" title="Total Saldos al Cierre">
            Total Saldos al Cierre
          </p>
          <h3 className="text-xl xl:text-2xl font-black text-emerald-600 mt-0.5">
            ${totalSaldoUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Convertido Tasa Prom. BCV</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>
      )}

      {/* 2. Saldo Promedio por Cuenta (USD) */}
      {(mode === 'all' || mode === 'financiero') && (
      <div className="bg-white rounded-xl p-3.5 xl:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
        <div>
          <p className="text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap truncate" title="Saldo Prom. Cuenta">
            Saldo Prom. Cuenta
          </p>
          <h3 className="text-xl xl:text-2xl font-black text-emerald-600 mt-0.5">
            ${promedioSaldoCuenta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Total Saldo / Cuentas</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>
      )}

      {/* 3. Costo Operativo Total (USD) */}
      {(mode === 'all' || mode === 'financiero') && (
      <div className="bg-white rounded-xl p-3.5 xl:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
        <div>
          <p className="text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap truncate" title="Gastos Operativos">
            Gastos Operativos
          </p>
          <h3 className="text-xl xl:text-2xl font-black text-[#00205B] mt-0.5">
            ${totalCostosUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Viáticos & Gastos Esp.</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#00205B] shrink-0">
          <CreditCard className="w-5 h-5" />
        </div>
      </div>
      )}

      {/* 4. Gasto Promedio Mensual (USD) */}
      {(mode === 'all' || mode === 'financiero') && (
      <div className="bg-white rounded-xl p-3.5 xl:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
        <div>
          <p className="text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap truncate" title="Gasto Prom. Mensual">
            Gasto Prom. Mensual
          </p>
          <h3 className="text-xl xl:text-2xl font-black text-[#00205B] mt-0.5">
            ${promedioGastoMensual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">&nbsp;</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#00205B] shrink-0">
          <CalendarDays className="w-5 h-5" />
        </div>
      </div>
      )}

      {/* 5. Gasto Promedio por Jornada (USD) */}
      {(mode === 'all' || mode === 'financiero') && (
      <div className="bg-white rounded-xl p-3.5 xl:p-4 border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow">
        <div>
          <p className="text-[10px] xl:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap truncate" title="Gasto Prom. Jornada">
            Gasto Prom. Jornada
          </p>
          <h3 className="text-xl xl:text-2xl font-black text-[#00205B] mt-0.5">
            ${promedioGastoJornada.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Viáticos por jornada móvil</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#00205B] shrink-0">
          <Receipt className="w-5 h-5" />
        </div>
      </div>
      )}

      {/* 6. Margen Operativo Global (USD) - Cierre Ejecutivo */}
      {(mode === 'all' || mode === 'financiero') && (
      <div className="bg-[#00205B] rounded-xl p-3.5 xl:p-4 text-white shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[10px] xl:text-[11px] font-bold text-blue-200 uppercase tracking-wider whitespace-nowrap truncate" title="Margen Est. (USD)">
            Margen Est. (USD)
          </p>
          <h3 className="text-xl xl:text-2xl font-black text-white mt-0.5">
            ${totalMargenUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-blue-300 mt-0.5 font-medium">
            Saldo Total - Gastos
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
          <DollarSign className="w-5 h-5 text-[#FE5000]" />
        </div>
      </div>
      )}
      
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
