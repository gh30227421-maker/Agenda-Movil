"use client";

import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ChartModalWrapper from './ChartModalWrapper';

interface HistorialMetricsProps {
  events: any[];
}

export default function HistorialMetrics({ events }: HistorialMetricsProps) {
  // Procesar datos para agruparlos por mes
  const data = useMemo(() => {
    const monthlyData: Record<string, any> = {};

    events.forEach(ev => {
      if (!ev.startDate) return;
      
      const monthStr = ev.startDate.substring(0, 7); // AAAA-MM
      
      if (!monthlyData[monthStr]) {
        monthlyData[monthStr] = {
          mes: monthStr,
          saldoUsd: 0,
          gastoUsd: 0,
          cuentas: 0,
          tdd: 0,
        };
      }

      const saldoUsd = (ev.saldoFinMesBs && ev.tasaBcvRentabilidad) ? (ev.saldoFinMesBs / ev.tasaBcvRentabilidad) : 0;
      const gastoUsd = ev.gastos?.totalUsd || 0;
      const cuentas = ev.cifras?.cuentasAbiertas || 0;
      const tdd = ev.cifras?.tdd || 0;

      monthlyData[monthStr].saldoUsd += saldoUsd;
      monthlyData[monthStr].gastoUsd += gastoUsd;
      monthlyData[monthStr].cuentas += cuentas;
      monthlyData[monthStr].tdd += tdd;
    });

    return Object.values(monthlyData).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [events]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Evolución Financiera (Líneas / Áreas) */}
      <ChartModalWrapper 
        title="Evolución Financiera (USD)" 
        subtitle="Comparativa de Saldo Cierre vs Gastos Operativos a lo largo del tiempo"
      >
        <div className="w-full h-72">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tickFormatter={(val) => `$${val.toLocaleString()}`} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip 
                  formatter={(val: any, name: any) => [`$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]}
                  contentStyle={{ backgroundColor: '#00205B', borderRadius: '10px', color: '#FFF', border: 'none' }}
                />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="saldoUsd" name="Saldo Cierre" stroke="#10B981" fill="#A7F3D0" fillOpacity={0.5} strokeWidth={3} />
                <Area type="monotone" dataKey="gastoUsd" name="Gastos Operativos" stroke="#EF4444" fill="#FCA5A5" fillOpacity={0.5} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">Sin datos históricos</div>
          )}
        </div>
      </ChartModalWrapper>

      {/* Evolución de Volumen (Barras) */}
      <ChartModalWrapper 
        title="Evolución de Volumen Operativo" 
        subtitle="Crecimiento de Apertura de Cuentas y Entregas de TDD"
      >
        <div className="w-full h-72">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip 
                  formatter={(val: any, name: any) => [`${Number(val).toLocaleString()}`, name]}
                  contentStyle={{ backgroundColor: '#00205B', borderRadius: '10px', color: '#FFF', border: 'none' }}
                />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />
                <Bar dataKey="cuentas" name="Apertura de Cuentas" fill="#00205C" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="tdd" name="Entregas TDD" fill="#426095" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">Sin datos históricos</div>
          )}
        </div>
      </ChartModalWrapper>
    </div>
  );
}
